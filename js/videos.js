const videoSlots = [1, 2, 3, 4];
const storage = window.GitHubVideoStorage;

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = String(total % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

function canControlVideo(video) {
  return (
    video.readyState > 0 ||
    Boolean(video.src) ||
    Boolean(video.currentSrc) ||
    Boolean(video.querySelector("source[src]"))
  );
}

videoSlots.forEach((id) => {
  const video = document.getElementById(`video-${id}`);
  if (!video) return;

  const slot = document.querySelector(`.video-slot[data-slot="${id}"]`);
  if (!slot) return;

  const frame = video.closest(".video-frame");
  const playBtn = slot.querySelector(".btn-play");
  const pauseBtn = slot.querySelector(".btn-pause");
  const restartBtn = slot.querySelector(".btn-restart");
  const fullscreenBtn = slot.querySelector(".btn-fullscreen");
  const saveStatus = document.getElementById(`save-status-${id}`);
  const controlsWrap = slot.querySelector(".video-controls");
  if (!controlsWrap) return;

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
  const isBundled = Boolean(video.dataset.bundled);

  function setButtonsEnabled(enabled) {
    controlButtons.forEach((btn) => {
      if (btn) btn.disabled = !enabled;
    });
  }

  function setTimelineVisible(visible) {
    timeline.hidden = !visible;
    if (seekBar) seekBar.disabled = !visible;
  }

  function setControlsEnabled(enabled) {
    setButtonsEnabled(enabled);
    if (!isBundled) {
      setTimelineVisible(enabled);
    }
  }

  function updateTimeline() {
    if (!video.duration) return;
    timeCurrent.textContent = formatTime(video.currentTime);
    timeDuration.textContent = formatTime(video.duration);
    if (!isSeeking) {
      seekBar.value = String(video.currentTime);
    }
  }

  function setSaveStatus(en, he) {
    if (!saveStatus) return;
    saveStatus.innerHTML = `<span class="en">${en}</span><span class="he" dir="rtl" lang="he">${he}</span>`;
    saveStatus.hidden = false;
    saveStatus.classList.add("bilingual-block", "save-status");
  }

  playBtn?.addEventListener("click", async () => {
    if (video.readyState === 0 && video.querySelector("source[src]")) {
      video.load();
    }
    try {
      await video.play();
      if (isBundled) {
        setTimelineVisible(true);
        updateTimeline();
      }
    } catch {
      return;
    }
  });

  pauseBtn?.addEventListener("click", () => {
    if (!canControlVideo(video)) return;
    video.pause();
  });

  restartBtn?.addEventListener("click", () => {
    if (!canControlVideo(video)) return;
    video.pause();
    video.currentTime = 0;
    updateTimeline();
  });

  video.addEventListener("loadedmetadata", () => {
    seekBar.max = String(video.duration || 0);
    updateTimeline();
    if (isBundled && !video.paused && !video.ended) {
      setTimelineVisible(true);
    }
  });

  video.addEventListener("play", () => {
    if (!isBundled) return;
    setTimelineVisible(true);
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

  fullscreenBtn?.addEventListener("click", async () => {
    if (!canControlVideo(video)) return;

    try {
      if (video.webkitEnterFullscreen) {
        video.webkitEnterFullscreen();
      } else if (frame?.requestFullscreen) {
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
    setButtonsEnabled(true);
    setTimelineVisible(false);
    video.load();

    const bundledName = slot.dataset.bundledVideo || "lesson video";
    setSaveStatus(`Lesson video: ${bundledName}`, `סרטון שיעור: ${bundledName}`);

    video.addEventListener(
      "loadeddata",
      () => {
        if (video.currentTime < 0.01 && video.duration > 0.1) {
          video.currentTime = 0.01;
        }
        setButtonsEnabled(true);
        if (!video.paused && !video.ended) {
          setTimelineVisible(true);
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
          <span class="en">This video could not be loaded in your browser.</span>
          <span class="he" dir="rtl" lang="he">לא ניתן לטעון את הסרטון בדפדפן שלכם.</span>
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

    const playBtn = slot.querySelector(".btn-play");
    const pauseBtn = slot.querySelector(".btn-pause");
    const restartBtn = slot.querySelector(".btn-restart");
    const fullscreenBtn = slot.querySelector(".btn-fullscreen");
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
        <span class="en">Lesson video: ${entry.fileName || entry.file}</span>
        <span class="he" dir="rtl" lang="he">סרטון שיעור: ${entry.fileName || entry.file}</span>
      `;
    }
  });
}

loadVideosFromGitHub();
