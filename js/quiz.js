/**
 * Present Progressive: 3-part self-graded quiz with step navigation and Chart.js results.
 */
(function () {
  const ANSWERS = {
    q1: "b",
    q2: "c",
    q3: "b",
    q4: "a",
    q5: "b",
    q6: "a",
    q7: "b",
    q8: "a",
    q9: "b",
    q10: "b",
  };

  const PARTS = [
    { id: 1, keys: ["q1", "q2", "q3", "q4"], label: "Part 1" },
    { id: 2, keys: ["q5", "q6", "q7"], label: "Part 2" },
    { id: 3, keys: ["q8", "q9", "q10"], label: "Part 3" },
  ];

  const panes = document.querySelectorAll(".quiz-pane");
  const stepBtns = document.querySelectorAll(".quiz-step-btn");
  const btnPrev = document.getElementById("quizBtnPrev");
  const btnNext = document.getElementById("quizBtnNext");
  const btnSubmit = document.getElementById("quizBtnSubmit");
  const quizRoot = document.getElementById("ppQuiz");

  if (!quizRoot || !panes.length) return;

  let current = 0;
  const totalSteps = panes.length;
  let chartInstances = [];

  function countAnsweredInPart(keys) {
    return keys.reduce((n, key) => {
      return document.querySelector(`input[name="${key}"]:checked`) ? n + 1 : n;
    }, 0);
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
    panes.forEach((pane, idx) => {
      pane.hidden = idx !== current;
    });
    stepBtns.forEach((btn, idx) => {
      btn.classList.toggle("is-active", idx === current);
      btn.classList.toggle("is-done", idx < current);
      btn.classList.toggle("is-upcoming", idx > current);
    });
    if (btnPrev) btnPrev.disabled = current === 0;
    if (btnNext) btnNext.hidden = current >= totalSteps - 1;
    if (btnSubmit) btnSubmit.hidden = current < totalSteps - 1;
  }

  stepBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const n = parseInt(btn.getAttribute("data-step"), 10) - 1;
      if (!Number.isNaN(n)) showStep(n);
    });
  });

  if (btnPrev) {
    btnPrev.addEventListener("click", () => showStep(current - 1));
  }
  if (btnNext) {
    btnNext.addEventListener("click", () => showStep(current + 1));
  }

  function destroyCharts() {
    chartInstances.forEach((chart) => chart?.destroy());
    chartInstances = [];
  }

  function gradeMc() {
    let correct = 0;
    const total = Object.keys(ANSWERS).length;
    const byPart = [
      { c: 0, t: 0 },
      { c: 0, t: 0 },
      { c: 0, t: 0 },
    ];

    PARTS.forEach((part, pi) => {
      part.keys.forEach((key) => {
        byPart[pi].t++;
        const el = document.querySelector(`input[name="${key}"]:checked`);
        const value = el ? el.value : "";
        if (value === ANSWERS[key]) {
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

    const green = "#2d6a4f";
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
                backgroundColor: [green, red],
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
      const result = gradeMc();
      const scoreEl = document.getElementById("quizScoreText");
      const resultsEl = document.getElementById("quizResults");
      const pct = Math.round((result.correct / result.total) * 100);

      if (scoreEl) {
        scoreEl.innerHTML = `
          <span class="en">Overall score: ${result.correct} / ${result.total} (${pct}/100)</span>
          <span class="he" dir="rtl" lang="he">ציון כולל: ${result.correct} / ${result.total} (${pct}/100)</span>
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
    if (e.target?.matches?.('input[type="radio"]')) {
      updatePartCounters();
    }
  });

  updatePartCounters();
  showStep(0);
})();
