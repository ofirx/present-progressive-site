(function () {
  function initFullscreen(shell) {
    const button = shell.querySelector("[data-fullscreen-btn]") ||
      shell.querySelector(".practice-game-fullscreen-btn") ||
      shell.querySelector(".balloon-game-fullscreen-btn");
    if (!button) return;

    const labelEn = button.querySelector(".btn-en");
    const labelHe = button.querySelector(".btn-he");

    function isFullscreen() {
      return document.fullscreenElement === shell;
    }

    function updateButton() {
      const active = isFullscreen();
      if (labelEn) labelEn.textContent = active ? "Exit fullscreen" : "Fullscreen";
      if (labelHe) labelHe.textContent = active ? "צא ממסך מלא" : "מסך מלא";
      button.setAttribute("aria-label", active ? "Exit fullscreen" : "Enter fullscreen");
    }

    button.addEventListener("click", async () => {
      try {
        if (isFullscreen()) await document.exitFullscreen();
        else await shell.requestFullscreen();
      } catch (err) {
        /* Fullscreen may be blocked by browser policy */
      }
    });

    document.addEventListener("fullscreenchange", updateButton);
    updateButton();
  }

  document.querySelectorAll(".practice-game-shell, .balloon-game-shell").forEach(initFullscreen);
})();
