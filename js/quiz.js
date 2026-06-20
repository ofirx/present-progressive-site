/**
 * Present Progressive: 3-part self-graded quiz with step navigation and Chart.js results.
 */
(function () {
  const SELECT_ANSWERS = {
    q1: "am reading",
    q2: "is writing",
    q3: "are playing",
    q4: "is eating",
  };

  const TEXT_ANSWERS = {
    q5: [
      "i am not drawing a picture now",
      "i'm not drawing a picture now",
    ],
    q6: [
      "she is not running right now",
      "she's not running right now",
      "she is not running right now.",
      "she's not running right now.",
    ],
    q7: [
      "they are not reading a book at the moment",
      "they're not reading a book at the moment",
    ],
    q8: [
      "he is not writing a letter now",
      "he's not writing a letter now",
    ],
  };

  const PARTS = [
    { id: 1, keys: ["q1", "q2", "q3", "q4"], label: "Part A" },
    { id: 2, keys: ["q5", "q6", "q7", "q8"], label: "Part B" },
    { id: 3, keys: ["q9", "q10", "q11", "q12"], label: "Part C" },
  ];

  const PROGRESSIVE =
    /\b(?:i|you|he|she|it|we|they|'m|'re|'s|am|is|are)\b[^.?!]{0,40}\b\w+ing\b/i;
  const NEGATIVE_PROGRESSIVE =
    /\b(?:am|is|are|'m|'re|'s)\s+not\b|\b(?:isn't|aren't|i'm not|he's not|she's not|it's not|we're not|they're not)\b/i;

  const quizRoot = document.getElementById("ppQuiz");
  if (!quizRoot) return;

  const panes = quizRoot.querySelectorAll(".quiz-pane");
  const stepBtns = quizRoot.querySelectorAll(".quiz-step-btn");
  const btnPrev = document.getElementById("quizBtnPrev");
  const btnNext = document.getElementById("quizBtnNext");
  const btnSubmit = document.getElementById("quizBtnSubmit");
  const footerNav = document.getElementById("quizFooterNav");
  const quizMain = quizRoot.querySelector(".quiz-main");

  if (!panes.length) return;

  let current = 0;
  const totalSteps = panes.length;
  let chartInstances = [];

  function normalizeText(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/['']/g, "'")
      .replace(/\s+/g, " ")
      .replace(/[.!?]+$/, "");
  }

  function getSelectValue(name) {
    const el = document.querySelector(`select[name="${name}"]`);
    return el ? el.value : "";
  }

  function getTextValue(name) {
    const el = document.querySelector(`input[name="${name}"]`);
    return el ? el.value : "";
  }

  function isQuestionAnswered(key) {
    if (key === "q12") {
      return Boolean(getTextValue("q12a").trim() && getTextValue("q12b").trim());
    }

    if (SELECT_ANSWERS[key]) {
      return Boolean(getSelectValue(key));
    }

    if (TEXT_ANSWERS[key] || key === "q11") {
      return Boolean(getTextValue(key).trim());
    }

    return Boolean(document.querySelector(`input[name="${key}"]:checked`));
  }

  function matchesTextAnswer(key, value) {
    const accepted = TEXT_ANSWERS[key];
    if (!accepted) return false;
    const normalized = normalizeText(value);
    return accepted.some((answer) => normalizeText(answer) === normalized);
  }

  function isQuestionCorrect(key) {
    if (SELECT_ANSWERS[key]) {
      return getSelectValue(key) === SELECT_ANSWERS[key];
    }

    if (TEXT_ANSWERS[key]) {
      return matchesTextAnswer(key, getTextValue(key));
    }

    if (key === "q11") {
      return PROGRESSIVE.test(getTextValue("q11"));
    }

    if (key === "q12") {
      const a = getTextValue("q12a");
      const b = getTextValue("q12b");
      return PROGRESSIVE.test(a) && NEGATIVE_PROGRESSIVE.test(b) && /\b\w+ing\b/i.test(b);
    }

    return null;
  }

  function countAnsweredInPart(keys) {
    return keys.reduce((n, key) => (isQuestionAnswered(key) ? n + 1 : n), 0);
  }

  function updatePartCounters() {
    PARTS.forEach((part) => {
      const el = document.getElementById(`quizCounterPart${part.id}`);
      if (!el) return;

      const answered = countAnsweredInPart(part.keys);
      const total = part.keys.length;
      const remaining = total - answered;
      el.textContent = `${answered} / ${total}`;
      el.setAttribute("aria-label", `${answered} of ${total} questions answered in this part`);

      const hintEl = document.getElementById(`quizCounterHintPart${part.id}`);
      if (!hintEl) return;

      if (remaining > 0) {
        hintEl.hidden = false;
        hintEl.classList.remove("is-complete");
        hintEl.textContent =
          remaining === 1
            ? "You still have 1 question unanswered in this section."
            : `You still have ${remaining} questions unanswered in this section.`;
      } else if (total > 0) {
        hintEl.hidden = false;
        hintEl.classList.add("is-complete");
        hintEl.textContent = "Great job! You've answered every question in this section.";
      } else {
        hintEl.hidden = true;
        hintEl.classList.remove("is-complete");
        hintEl.textContent = "";
      }
    });
  }

  function showStep(i) {
    current = Math.max(0, Math.min(i, totalSteps - 1));
    quizRoot.setAttribute("data-active-part", String(current + 1));
    panes.forEach((pane, idx) => {
      const isActive = idx === current;
      pane.hidden = !isActive;
      pane.classList.toggle("is-active-pane", isActive);
    });
    stepBtns.forEach((btn, idx) => {
      btn.classList.toggle("is-active", idx === current);
      btn.classList.toggle("is-done", idx < current);
      btn.classList.toggle("is-upcoming", idx > current);
    });
    if (btnPrev) btnPrev.disabled = current === 0;
    if (btnNext) btnNext.hidden = current >= totalSteps - 1;
    if (btnSubmit) btnSubmit.hidden = current < totalSteps - 1;

    const activePane = panes[current];
    if (activePane) {
      activePane.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (quizMain) {
      quizMain.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  stepBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const n = parseInt(btn.getAttribute("data-step"), 10) - 1;
      if (!Number.isNaN(n)) showStep(n);
    });
  });

  if (footerNav) {
    footerNav.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.id === "quizBtnPrev" || target.closest("#quizBtnPrev")) {
        e.preventDefault();
        showStep(current - 1);
      } else if (target.id === "quizBtnNext" || target.closest("#quizBtnNext")) {
        e.preventDefault();
        showStep(current + 1);
      }
    });
  }

  function destroyCharts() {
    chartInstances.forEach((chart) => chart?.destroy());
    chartInstances = [];
  }

  function gradeQuiz() {
    let correct = 0;
    let total = 0;
    const byPart = [
      { c: 0, t: 0 },
      { c: 0, t: 0 },
      { c: 0, t: 0 },
    ];

    PARTS.forEach((part, pi) => {
      part.keys.forEach((key) => {
        if (key === "q9" || key === "q10") {
          return;
        }

        byPart[pi].t++;
        total++;

        const isCorrect = isQuestionCorrect(key);
        if (isCorrect) {
          correct++;
          byPart[pi].c++;
        }
      });
    });

    return { correct, total, byPart };
  }

  function renderCharts(result) {
    destroyCharts();
    const Chart = window.Chart;
    if (!Chart) return;

    const partCorrectColors = ["#2d6a4f", "#7c3aed", "#ca8a04"];
    const red = "#9b2226";

    PARTS.forEach((part, idx) => {
      const bp = result.byPart[idx];
      const wrong = bp.t - bp.c;
      const canvas = document.getElementById(`chartPart${part.id}`);
      if (!canvas) return;

      chartInstances.push(
        new Chart(canvas.getContext("2d"), {
          type: "pie",
          data: {
            labels: ["Correct", "Incorrect"],
            datasets: [
              {
                data: [bp.c, wrong],
                backgroundColor: [partCorrectColors[idx], red],
                borderWidth: 1,
                borderColor: "#fff",
              },
            ],
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: "bottom" },
              tooltip: {
                callbacks: {
                  label(ctx) {
                    const n = ctx.raw;
                    const pct = bp.t ? ((n / bp.t) * 100).toFixed(0) : "0";
                    return `${ctx.label}: ${n} (${pct}%)`;
                  },
                },
              },
            },
          },
        })
      );

      const statEl = document.getElementById(`statsPart${part.id}`);
      if (statEl) {
        statEl.textContent = `Correct: ${bp.c}/${bp.t} · Incorrect: ${wrong}/${bp.t}`;
      }
    });
  }

  if (btnSubmit) {
    btnSubmit.addEventListener("click", () => {
      const result = gradeQuiz();
      const scoreEl = document.getElementById("quizScoreText");
      const resultsEl = document.getElementById("quizResults");
      const pct = result.total ? Math.round((result.correct / result.total) * 100) : 0;

      if (scoreEl) {
        scoreEl.innerHTML = `
          <span class="en">Overall score: ${result.correct} / ${result.total} (${pct}/100) — Questions 9 and 10 are not auto-graded.</span>
          <span class="he" dir="rtl" lang="he">ציון כולל: ${result.correct} / ${result.total} (${pct}/100) — שאלות 9 ו-10 לא נבדקות אוטומטית.</span>
        `;
      }
      if (resultsEl) {
        resultsEl.hidden = false;
        renderCharts(result);
        resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  quizRoot.addEventListener("change", (e) => {
    if (e.target?.matches?.('input[type="radio"], .quiz-select')) {
      updatePartCounters();
    }
  });

  quizRoot.addEventListener("input", (e) => {
    if (e.target?.matches?.(".quiz-text-input")) {
      updatePartCounters();
    }
  });

  updatePartCounters();
  showStep(0);
})();
