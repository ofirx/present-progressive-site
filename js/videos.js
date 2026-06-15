const videoSlots = [1, 2, 3, 4];
const objectUrls = new Map();
const storage = window.GitHubVideoStorage;

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = String(total % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

function initGitHubPanel() {
  const panel = document.getElementById("githubStoragePanel");
  if (!panel || !storage) return;

  const form = document.getElementById("githubTokenForm");
  const tokenInput = document.getElementById("githubTokenInput");
  const statusEl = document.getElementById("githubConnectionStatus");
  const disconnectBtn = document.getElementById("githubDisconnectBtn");

  function setStatus(connected) {
    if (!statusEl) return;
    if (connected) {
      statusEl.innerHTML = `
        <span class="en">Connected to GitHub — uploads are saved in the repository.</span>
        <span class="he" dir="rtl" lang="he">מחובר ל-GitHub — העלאות נשמרות במאגר.</span>
      `;
      statusEl.classList.add("is-connected");
    } else {
      statusEl.innerHTML = `
        <span class="en">Not connected — connect GitHub to save uploads for everyone.</span>
        <span class="he" dir="rtl" lang="he">לא מחובר — התחברו ל-GitHub כדי לשמור העלאות לכולם.</span>
      `;
      statusEl.classList.remove("is-connected");
    }
    statusEl.classList.add("bilingual-block");
  }

  setStatus(storage.hasToken());

  if (disconnectBtn) {
    disconnectBtn.hidden = !storage.hasToken();
    disconnectBtn.addEventListener("click", () => {
      storage.setToken("");
      if (tokenInput) tokenInput.value = "";
      setStatus(false);
      disconnectBtn.hidden = true;
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const token = tokenInput?.value?.trim();
      if (!token) return;

      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      try {
        await storage.validateToken(token);
        storage.setToken(token);
        setStatus(true);
        if (disconnectBtn) disconnectBtn.hidden = false;
        if (tokenInput) tokenInput.value = "";
      } catch (err) {
        alert(err.message || "Could not connect to GitHub.");
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }
}

videoSlots.forEach((id) => {
  const video = document.getElementById(`video-${id}`);
  if (!video) return;

  const frame = video.closest(".video-frame");
  const upload = document.querySelector(`.video-upload[data-video="${id}"]`);
  const playBtn = document.querySelector(`.btn-play[data-video="${id}"]`);
  const pauseBtn = document.querySelector(`.btn-pause[data-video="${id}"]`);
  const restartBtn = document.querySelector(`.btn-restart[data-video="${id}"]`);
  const fullscreenBtn = document.querySelector(`.btn-fullscreen[data-video="${id}"]`);
  const saveStatus = document.getElementById(`save-status-${id}`);
  const slot = document.querySelector(`.video-slot[data-slot="${id}"]`);
  if (!slot) return;
  const controlsWrap = slot.querySelector(".video-controls");

  const timeline = document.createElement("div");
  timeline.className = "video-timeline";
  timeline.hidden = true;
  timeline.innerHTML = `
    <div class="timeline-header bilingual-block">
      <span class="en">Timeline</span>
      <span class="he" dir="rtl" lang="he">ציר זמן</span>
    </div>
    <input
      type="range"
      class="video-seek"
      min="0"
      max="100"
      value="0"
      step="0.1"
      aria-label="Video timeline ${id}"
      disabled
    />
    <div class="timeline-times" dir="ltr">
      <span class="time-current">0:00</span>
      <span class="time-separator" aria-hidden="true">/</span>
      <span class="time-duration">0:00</span>
    </div>
  `;
  controlsWrap.before(timeline);

  const seekBar = timeline.querySelector(".video-seek");
  const timeCurrent = timeline.querySelector(".time-current");
  const timeDuration = timeline.querySelector(".time-duration");
  let isSeeking = false;

  const controlButtons = [playBtn, pauseBtn, restartBtn, fullscreenBtn];

  function setControlsEnabled(enabled) {
    controlButtons.forEach((btn) => {
      btn.disabled = !enabled;
    });
    seekBar.disabled = !enabled;
    timeline.hidden = !enabled;
  }

  function updateTimeline() {
    if (!video.duration) return;
    timeCurrent.textContent = formatTime(video.currentTime);
    timeDuration.textContent = formatTime(video.duration);
    if (!isSeeking) {
      seekBar.value = String(video.currentTime);
    }
  }

  function resetTimeline() {
    seekBar.value = "0";
    seekBar.max = "100";
    timeCurrent.textContent = "0:00";
    timeDuration.textContent = "0:00";
  }

  function setSaveStatus(en, he, isError = false) {
    if (!saveStatus) return;
    saveStatus.innerHTML = `<span class="en">${en}</span><span class="he" dir="rtl" lang="he">${he}</span>`;
    saveStatus.hidden = false;
    saveStatus.classList.toggle("save-status-error", isError);
    saveStatus.classList.add("bilingual-block", "save-status");
  }

  function revokeObjectUrl() {
    const existing = objectUrls.get(id);
    if (existing) {
      URL.revokeObjectURL(existing);
      objectUrls.delete(id);
    }
  }

  function showVideoFromUrl(url, fileName) {
    revokeObjectUrl();
    resetTimeline();
    video.src = url;
    video.load();
    video.hidden = false;
    slot.classList.add("has-video");
    setControlsEnabled(true);
    setSaveStatus(
      `Saved on GitHub: ${fileName}`,
      `נשמר ב-GitHub: ${fileName}`
    );
  }

  function showVideoFromBlob(blob, fileName) {
    revokeObjectUrl();
    resetTimeline();

    const url = URL.createObjectURL(blob);
    objectUrls.set(id, url);

    video.src = url;
    video.load();
    video.hidden = false;
    slot.classList.add("has-video");
    setControlsEnabled(true);
    setSaveStatus(`Preview: ${fileName}`, `תצוגה מקדימה: ${fileName}`);
  }

  async function handleVideoFile(file) {
    if (!file) return;

    const displayName = file.name || `video-${id}`;
    if (file.type && !file.type.startsWith("video/")) return;

    if (!storage?.hasToken()) {
      setSaveStatus(
        "Connect GitHub above to save this upload.",
        "התחברו ל-GitHub למעלה כדי לשמור את ההעלאה.",
        true
      );
      showVideoFromBlob(file, displayName);
      return;
    }

    showVideoFromBlob(file, displayName);
    setSaveStatus(`Saving to GitHub: ${displayName}…`, `שומר ב-GitHub: ${displayName}…`);

    try {
      const result = await storage.saveVideoToGitHub(id, file);
      showVideoFromUrl(result.url, result.slot.fileName || displayName);
    } catch (err) {
      setSaveStatus(
        err.message || "Could not save video on GitHub.",
        "לא ניתן לשמור את הסרטון ב-GitHub.",
        true
      );
    }
  }

  upload.addEventListener("change", () => {
    const file = upload.files[0];
    if (file) handleVideoFile(file);
    upload.value = "";
  });

  playBtn.addEventListener("click", async () => {
    if (!video.src && !video.currentSrc) return;
    try {
      await video.play();
    } catch {
      return;
    }
  });

  pauseBtn.addEventListener("click", () => {
    if (!video.src && !video.currentSrc) return;
    video.pause();
  });

  restartBtn.addEventListener("click", () => {
    if (!video.src && !video.currentSrc) return;
    video.pause();
    video.currentTime = 0;
    updateTimeline();
  });

  video.addEventListener("loadedmetadata", () => {
    seekBar.max = String(video.duration || 0);
    updateTimeline();
  });

  video.addEventListener("timeupdate", updateTimeline);

  video.addEventListener("ended", () => {
    isSeeking = false;
    updateTimeline();
  });

  seekBar.addEventListener("pointerdown", () => {
    isSeeking = true;
  });

  seekBar.addEventListener("input", () => {
    if (!video.duration) return;
    video.currentTime = Number(seekBar.value);
    timeCurrent.textContent = formatTime(video.currentTime);
  });

  seekBar.addEventListener("change", () => {
    isSeeking = false;
    updateTimeline();
  });

  fullscreenBtn.addEventListener("click", async () => {
    if (!video.src && !video.currentSrc) return;

    try {
      if (video.webkitEnterFullscreen) {
        video.webkitEnterFullscreen();
      } else if (frame.requestFullscreen) {
        await frame.requestFullscreen();
      } else if (video.requestFullscreen) {
        await video.requestFullscreen();
      }
    } catch {
      return;
    }
  });

  if (video.dataset.bundled) {
    const placeholder = document.getElementById(`placeholder-${id}`);
    video.hidden = false;
    video.removeAttribute("hidden");
    slot.classList.add("has-video");
    if (placeholder) placeholder.style.display = "none";
    setControlsEnabled(true);

    const bundledName = slot.dataset.bundledVideo || "lesson video";
    setSaveStatus(`Lesson video: ${bundledName}`, `סרטון שיעור: ${bundledName}`);

    video.addEventListener(
      "loadeddata",
      () => {
        if (video.currentTime < 0.01 && video.duration > 0.1) {
          video.currentTime = 0.01;
        }
      },
      { once: true }
    );
  }
});

async function loadVideosFromGitHub() {
  if (!storage) return;

  const manifest = await storage.fetchManifest();
  videoSlots.forEach((id) => {
    const entry = manifest?.slots?.[String(id)];
    if (!entry?.file) return;

    const video = document.getElementById(`video-${id}`);
    const slot = document.querySelector(`.video-slot[data-slot="${id}"]`);
    const placeholder = document.getElementById(`placeholder-${id}`);
    if (!video || !slot) return;
    if (slot.dataset.bundledVideo || video.dataset.bundled) return;

    const url = storage.videoPublicUrl(entry.file, entry.updatedAt || Date.now());
    const onError = () => {
      video.removeAttribute("src");
      video.load();
      video.hidden = true;
      slot.classList.remove("has-video");
      if (placeholder) placeholder.style.display = "";

      const saveStatus = document.getElementById(`save-status-${id}`);
      if (saveStatus) {
        saveStatus.hidden = false;
        saveStatus.classList.add("bilingual-block", "save-status", "save-status-error");
        saveStatus.innerHTML = `
          <span class="en">This video format is not supported in your browser. Re-export as H.264 MP4.</span>
          <span class="he" dir="rtl" lang="he">פורמט הסרטון אינו נתמך בדפדפן. יש לייצא מחדש כ-H.264 MP4.</span>
        `;
      }

      video.removeEventListener("error", onError);
    };

    video.addEventListener("error", onError);
    video.src = url;
    video.load();
    video.hidden = false;
    video.removeAttribute("hidden");
    slot.classList.add("has-video");
    if (placeholder) placeholder.style.display = "none";

    const playBtn = document.querySelector(`.btn-play[data-video="${id}"]`);
    const pauseBtn = document.querySelector(`.btn-pause[data-video="${id}"]`);
    const restartBtn = document.querySelector(`.btn-restart[data-video="${id}"]`);
    const fullscreenBtn = document.querySelector(`.btn-fullscreen[data-video="${id}"]`);
    [playBtn, pauseBtn, restartBtn, fullscreenBtn].forEach((btn) => {
      if (btn) btn.disabled = false;
    });

    const timeline = slot.querySelector(".video-timeline");
    const seekBar = slot.querySelector(".video-seek");
    if (timeline) timeline.hidden = false;
    if (seekBar) seekBar.disabled = false;

    const saveStatus = document.getElementById(`save-status-${id}`);
    if (saveStatus) {
      saveStatus.hidden = false;
      saveStatus.classList.add("bilingual-block", "save-status");
      saveStatus.innerHTML = `
        <span class="en">Saved on GitHub: ${entry.fileName || entry.file}</span>
        <span class="he" dir="rtl" lang="he">נשמר ב-GitHub: ${entry.fileName || entry.file}</span>
      `;
    }
  });
}

initGitHubPanel();
loadVideosFromGitHub();
