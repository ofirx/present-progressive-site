/**
 * Shared “answer all questions before Submit” hint for practice sections.
 */
(function () {
  function flashSubmitRequiredHint(hintEl) {
    if (!hintEl) return;
    hintEl.hidden = false;
    hintEl.classList.remove("is-alert");
    void hintEl.offsetWidth;
    hintEl.classList.add("is-alert");
    hintEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    hintEl.addEventListener(
      "animationend",
      () => {
        hintEl.classList.remove("is-alert");
      },
      { once: true }
    );
  }

  function hideSubmitRequiredHint(hintEl) {
    if (!hintEl) return;
    hintEl.hidden = true;
    hintEl.classList.remove("is-alert");
  }

  window.PracticeSubmitGuard = {
    flashSubmitRequiredHint,
    hideSubmitRequiredHint,
  };
})();
