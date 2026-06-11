const videoSlots = [1, 2, 3, 4];
const objectUrls = new Map();

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = String(total % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

videoSlots.forEach((id) => {
  const video = document.getElementById(`video-${id}`);
  const frame = video.closest(".video-frame");
  const upload = document.querySelector(`.video-upload[data-video="${id}"]`);
  const playBtn = document.querySelector(`.btn-play[data-video="${id}"]`);
  const pauseBtn = document.querySelector(`.btn-pause[data-video="${id}"]`);
  const restartBtn = document.querySelector(`.btn-restart[data-video="${id}"]`);
  const fullscreenBtn = document.querySelector(`.btn-fullscreen[data-video="${id}"]`);
  const saveStatus = document.getElementById(`save-status-${id}`);
  const slot = document.querySelector(`.video-slot[data-slot="${id}"]`);
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
  function setSaveStatus(en, he) {
    if (!saveStatus) return;
    saveStatus.innerHTML = `<span class="en">${en}</span><span class="he" dir="rtl" lang="he">${he}</span>`;
    saveStatus.hidden = false;
    saveStatus.classList.add("bilingual-block", "save-status");
  }

  function revokeObjectUrl() {
    const existing = objectUrls.get(id);
    if (existing) {
      URL.revokeObjectURL(existing);
      objectUrls.delete(id);
    }
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
  }
  async function handleVideoFile(file, { persist = true, saved = false, fileName } = {}) {
    if (!file) return;

    const displayName = fileName || file.name || `video-${id}`;
    if (file.type && !file.type.startsWith("video/")) return;

    showVideoFromBlob(file, displayName);

    if (saved) {
      setSaveStatus(`Saved: ${displayName}`, `נשמר: ${displayName}`);
      return;
    }

    setSaveStatus(`Saving: ${displayName}…`, `שומר: ${displayName}…`);

    if (persist) {
      try {
        const toStore =
          file instanceof File
            ? file
            : new File([file], displayName, { type: file.type || "video/mp4" });
        await saveVideo(id, toStore);
        setSaveStatus(`Saved: ${displayName}`, `נשמר: ${displayName}`);
      } catch {
        setSaveStatus(
          "Could not save video in browser storage.",
          "לא ניתן לשמור את הסרטון בדפדפן."
        );
      }
    }
  }

  upload.addEventListener("change", () => {
    const file = upload.files[0];
    if (file) handleVideoFile(file);
  });

  playBtn.addEventListener("click", async () => {
    if (!video.src) return;
    try {
      await video.play();
    } catch {
      return;
    }
  });

  pauseBtn.addEventListener("click", () => {
    if (!video.src) return;
    video.pause();
  });

  restartBtn.addEventListener("click", () => {
    if (!video.src) return;
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

  fullscreenBtn.addEventListener("click", async () => {    if (!video.src) return;

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

  loadVideo(id).then((record) => {
    if (!record?.blob) return;

    const blob =
      record.blob instanceof Blob
        ? record.blob
        : new Blob([record.blob], { type: record.mimeType || "video/mp4" });

    handleVideoFile(blob, {
      persist: false,
      saved: true,
      fileName: record.fileName,
    });
  });
});
