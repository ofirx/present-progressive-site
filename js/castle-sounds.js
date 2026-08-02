(() => {
  const SOUND_BASE = "sounds/";
  const FILES = {
    click: "ui-click.wav",
    window: "window-open.wav",
    enter: "door-enter.wav",
    creak: "floor-creak.wav",
    exit: "door-exit.wav",
  };

  const cache = Object.create(null);
  let unlocked = false;

  function load(name) {
    if (!cache[name]) {
      const audio = new Audio(SOUND_BASE + FILES[name]);
      audio.preload = "auto";
      cache[name] = audio;
    }
    return cache[name];
  }

  function unlock() {
    if (unlocked) return;
    unlocked = true;
    Object.keys(FILES).forEach((name) => {
      const a = load(name);
      a.volume = 0;
      a.play()
        .then(() => {
          a.pause();
          a.currentTime = 0;
          a.volume = 1;
        })
        .catch(() => {
          a.volume = 1;
        });
    });
  }

  function play(name, volume = 0.7) {
    unlock();
    const base = load(name);
    const a = base.cloneNode();
    a.volume = volume;
    a.play().catch(() => {});
  }

  window.CastleSounds = {
    unlock,
    play,
    click: () => play("click", 0.55),
    window: () => play("window", 0.65),
    enter: () => play("enter", 0.75),
    creak: () => play("creak", 0.6),
    exit: () => play("exit", 0.55),
  };

  document.addEventListener("pointerdown", unlock, { once: true });
  document.addEventListener("keydown", unlock, { once: true });
})();
