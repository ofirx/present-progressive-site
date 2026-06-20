/**
 * Present Progressive: 3-part self-graded quiz with step navigation and Chart.js results.
 */
(function () {
  const RADIO_ANSWERS = {
    q9: "a",
    q10: "a",
  };

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
      "they do not play football every day",
      "they don't play football every day",
    ],
    q8: [
      "he does not read a book after school",
      "he doesn't read a book after school",
    ],
  };

  const MIN_SUBMIT_COUNT = 8;

  const ALL_QUESTION_KEYS = [
    "q1",
    "q2",
    "q3",
    "q4",
    "q5",
    "q6",
    "q7",
    "q8",
    "q9",
    "q10",
    "q11",
    "q12",
  ];

  const PARTS = [
    { id: 1, keys: ["q1", "q2", "q3", "q4"], label: "Part A" },
    { id: 2, keys: ["q5", "q6", "q7", "q8"], label: "Part B" },
    { id: 3, keys: ["q9", "q10", "q11", "q12"], label: "Part C" },
  ];

  const QUESTION_LABELS = {
    q1: "1. I … (read) a book now.",
    q2: "2. She … (write) a story at the moment.",
    q3: "3. They … (play) football right now.",
    q4: "4. He … (eat) an apple now.",
    q5: "5. I am drawing a picture now.",
    q6: "6. She is running right now.",
    q7: "7. They play football every day.",
    q8: "8. He reads a book after school.",
    q9: "9. Is she reading a book now?",
    q10: "10. Is he playing football at the moment?",
    q11: "11. Write one sentence about what a classmate is doing right now.",
    q12: "12. Write sentences about what you are doing now and what you are not doing now.",
  };

  const CORRECT_DISPLAY = {
    q1: "am reading",
    q2: "is writing",
    q3: "are playing",
    q4: "is eating",
    q5: "I am not drawing a picture now.",
    q6: "She is not running right now.",
    q7: "They do not play football every day.",
    q8: "He does not read a book after school.",
    q9: "Yes, she is.",
    q10: "Yes, he is.",
    q11: "Example: My classmate is listening to the teacher right now.",
    q12: "a. Example: I am doing this quiz now. · b. Example: I am not watching TV now.",
  };

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

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getUserAnswer(key) {
    if (key === "q12") {
      const a = getTextValue("q12a").trim();
      const b = getTextValue("q12b").trim();
      if (!a && !b) return "—";
      return `a. ${a || "—"} · b. ${b || "—"}`;
    }

    if (SELECT_ANSWERS[key]) {
      const value = getSelectValue(key);
      return value || "—";
    }

    if (TEXT_ANSWERS[key] || key === "q11") {
      return getTextValue(key).trim() || "—";
    }

    const checked = document.querySelector(`input[name="${key}"]:checked`);
    if (!checked) return "—";
    const label = checked.closest("label");
    return label ? label.textContent.trim() : checked.value;
  }

  function getFeedbackMessage(pct) {
    if (pct > 80) {
      return {
        className: "quiz-feedback--excellent",
        en: "Excellent work! You have a strong grasp of the Present Progressive. Keep it up!",
        he: "עבודה מצוינת! יש לך שליטה טובה בזמן הווה מתמשך. המשיכו כך!",
      };
    }

    if (pct > 60) {
      return {
        className: "quiz-feedback--good",
        en: "Good job! You are making solid progress with the Present Progressive.",
        he: "כל הכבוד! אתם מתקדמים יפה עם זמן הווה מתמשך.",
      };
    }

    return {
      className: "quiz-feedback--support",
      en: "Don't worry — please see me after class to work on an adapted program.",
      he: "אל דאגה — אנא פנו אלי אחרי השיעור כדי לעבוד על תוכנית מותאמת.",
    };
  }

  function renderPartCPictureSummary() {
    const el = document.getElementById("quizPartCPictureSummary");
    if (!el) return;

    const q9Ok = isQuestionCorrect("q9");
    const q10Ok = isQuestionCorrect("q10");
    const q9User = getUserAnswer("q9");
    const q10User = getUserAnswer("q10");

    el.innerHTML = `
      <h4 class="quiz-partc-picture-title">Part C — Picture questions (9 &amp; 10)</h4>
      <ul class="quiz-partc-picture-list">
        <li class="quiz-partc-picture-item ${q9Ok ? "is-correct" : "is-wrong"}">
          <span class="en">
            <strong>9.</strong> Correct answer: <strong>Yes, she is.</strong>
            · Your answer: ${escapeHtml(q9User)}
            · <span class="quiz-partc-status">${q9Ok ? "Correct" : "Incorrect"}</span>
          </span>
          <span class="he" dir="rtl" lang="he">
            <strong>9.</strong> תשובה נכונה: <strong>Yes, she is.</strong>
            · התשובה שלך: ${escapeHtml(q9User)}
            · <span class="quiz-partc-status">${q9Ok ? "נכון" : "לא נכון"}</span>
          </span>
        </li>
        <li class="quiz-partc-picture-item ${q10Ok ? "is-correct" : "is-wrong"}">
          <span class="en">
            <strong>10.</strong> Correct answer: <strong>Yes, he is.</strong>
            · Your answer: ${escapeHtml(q10User)}
            · <span class="quiz-partc-status">${q10Ok ? "Correct" : "Incorrect"}</span>
          </span>
          <span class="he" dir="rtl" lang="he">
            <strong>10.</strong> תשובה נכונה: <strong>Yes, he is.</strong>
            · התשובה שלך: ${escapeHtml(q10User)}
            · <span class="quiz-partc-status">${q10Ok ? "נכון" : "לא נכון"}</span>
          </span>
        </li>
      </ul>
    `;
    el.hidden = false;
  }

  function renderFeedback(pct) {
    const feedbackEl = document.getElementById("quizFeedback");
    if (!feedbackEl) return;

    const message = getFeedbackMessage(pct);
    feedbackEl.className = `quiz-feedback bilingual-block ${message.className}`;
    feedbackEl.innerHTML = `
      <span class="en">${escapeHtml(message.en)}</span>
      <span class="he" dir="rtl" lang="he">${escapeHtml(message.he)}</span>
    `;
    feedbackEl.hidden = false;
  }

  function renderCorrections() {
    PARTS.forEach((part) => {
      const el = document.getElementById(`correctionsPart${part.id}`);
      if (!el) return;

      const wrongItems = part.keys
        .filter((key) => isQuestionCorrect(key) === false)
        .map((key) => ({
          key,
          label: QUESTION_LABELS[key] || key,
          user: getUserAnswer(key),
          correct: CORRECT_DISPLAY[key] || "—",
        }));

      if (!wrongItems.length) {
        el.hidden = true;
        el.innerHTML = "";
        return;
      }

      el.hidden = false;
      el.innerHTML = `
        <h5 class="quiz-corrections-title">Review incorrect answers</h5>
        <ul class="quiz-corrections-list">
          ${wrongItems
            .map(
              (item) => `
            <li class="quiz-correction-item">
              <p class="quiz-correction-q">${escapeHtml(item.label)}</p>
              <p class="quiz-correction-your"><strong>Your answer:</strong> ${escapeHtml(item.user)}</p>
              <p class="quiz-correction-answer"><strong>Correct answer:</strong> ${escapeHtml(item.correct)}</p>
            </li>
          `
            )
            .join("")}
        </ul>
      `;
    });
  }

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
    if (RADIO_ANSWERS[key]) {
      const checked = document.querySelector(`input[name="${key}"]:checked`);
      return checked ? checked.value === RADIO_ANSWERS[key] : false;
    }

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

  function countTotalAnswered() {
    return ALL_QUESTION_KEYS.reduce((n, key) => (isQuestionAnswered(key) ? n + 1 : n), 0);
  }

  function updateMinSubmitHints() {
    const totalAnswered = countTotalAnswered();
    const needsMore = totalAnswered < MIN_SUBMIT_COUNT;

    PARTS.forEach((part) => {
      const el = document.getElementById(`quizMinSubmitHintPart${part.id}`);
      if (!el) return;
      el.hidden = !needsMore;
    });

    if (btnSubmit) {
      btnSubmit.classList.toggle("quiz-submit--blocked", needsMore);
      btnSubmit.setAttribute("aria-describedby", needsMore ? "quizMinSubmitHintPart3" : "");
    }
  }

  function flashMinSubmitHint() {
    const hint = document.getElementById("quizMinSubmitHintPart3");
    if (!hint) return;

    hint.hidden = false;
    hint.classList.remove("is-alert");
    void hint.offsetWidth;
    hint.classList.add("is-alert");
    hint.scrollIntoView({ behavior: "smooth", block: "nearest" });

    hint.addEventListener(
      "animationend",
      () => {
        hint.classList.remove("is-alert");
      },
      { once: true }
    );
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

    updateMinSubmitHints();
  }

  function showStep(i, scrollIntoView = true) {
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

    updateMinSubmitHints();

    if (!scrollIntoView) return;

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
      if (countTotalAnswered() < MIN_SUBMIT_COUNT) {
        updateMinSubmitHints();
        flashMinSubmitHint();
        return;
      }

      const result = gradeQuiz();
      const scoreEl = document.getElementById("quizScoreText");
      const resultsEl = document.getElementById("quizResults");
      const pct = result.total ? Math.round((result.correct / result.total) * 100) : 0;

      if (scoreEl) {
        const q9Ok = isQuestionCorrect("q9");
        const q10Ok = isQuestionCorrect("q10");
        scoreEl.innerHTML = `
          <span class="en">Overall score: ${result.correct} / ${result.total} (${pct}/100)
            · Picture Q9: ${q9Ok ? "correct" : "incorrect"} (answer: Yes, she is.)
            · Picture Q10: ${q10Ok ? "correct" : "incorrect"} (answer: Yes, he is.)</span>
          <span class="he" dir="rtl" lang="he">ציון כולל: ${result.correct} / ${result.total} (${pct}/100)
            · תמונה שאלה 9: ${q9Ok ? "נכון" : "לא נכון"} (תשובה: Yes, she is.)
            · תמונה שאלה 10: ${q10Ok ? "נכון" : "לא נכון"} (תשובה: Yes, he is.)</span>
        `;
      }
      renderPartCPictureSummary();
      renderFeedback(pct);
      if (resultsEl) {
        resultsEl.hidden = false;
        renderCharts(result);
        renderCorrections();
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

  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }
  window.scrollTo(0, 0);

  updatePartCounters();
  showStep(0, false);
})();
