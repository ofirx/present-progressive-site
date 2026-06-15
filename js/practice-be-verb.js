/**
 * Section 5 — Choose the correct form of be (am / is / are + negatives).
 */
(function () {
  const SENTENCES = [
    { text: "I ___ eating lunch now.", answer: "am", negative: false },
    { text: "She ___ reading a story.", answer: "is", negative: false },
    { text: "The boys ___ playing football.", answer: "are", negative: false },
    { text: "We ___ writing in our notebooks.", answer: "are", negative: false },
    { text: "My sister ___ drawing a picture.", answer: "is", negative: false },
    { text: "He ___ running in the park today.", answer: "isn't", negative: true },
    { text: "They ___ watching TV right now.", answer: "aren't", negative: true },
  ];

  const POSITIVE_OPTIONS = ["am", "is", "are"];
  const NEGATIVE_OPTIONS = ["am not", "isn't", "aren't"];

  const root = document.getElementById("be-verb-activity");
  if (!root) return;

  const sentencesEl = document.getElementById("be-sentences");
  const resultsEl = document.getElementById("be-results");
  const summaryEl = document.getElementById("be-summary");
  const gradePanel = document.getElementById("be-grade-panel");
  const chartStats = document.getElementById("be-chart-stats");
  const chartCanvas = document.getElementById("be-chart");
  const timerDisplay = document.getElementById("be-timer-display");
  const timerBlock = document.getElementById("be-timer-block");
  const progressCounter = document.getElementById("be-progress-counter");
  const progressFill = document.getElementById("be-progress-fill");
  const progressHint = document.getElementById("be-progress-hint");
  const timerSelect = document.getElementById("be-timer-minutes");
  const btnStart = document.getElementById("be-start");
  const btnPause = document.getElementById("be-pause");
  const btnSubmit = document.getElementById("be-submit");
  const modeInputs = root.querySelectorAll('input[name="be-mode"]');

  let started = false;
  let paused = false;
  let finished = false;
  let picks = Array(SENTENCES.length).fill(null);
  let timerId = null;
  let timeLeftMs = 0;
  let chartInstance = null;

  function isTimedMode() {
    return root.querySelector('input[name="be-mode"]:checked')?.value === "timed";
  }

  function formatTime(ms) {
    const totalSec = Math.max(0, Math.ceil(ms / 1000));
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return min + ":" + String(sec).padStart(2, "0");
  }

  function updateTimerDisplay() {
    if (!timerDisplay) return;
    timerDisplay.textContent = formatTime(timeLeftMs);
    timerDisplay.classList.toggle("be-timer-display--low", timeLeftMs <= 30000 && timeLeftMs > 0);
  }

  function setInteractive(enabled) {
    root.classList.toggle("be-verb-activity--active", enabled);
    sentencesEl.querySelectorAll(".be-verb-select").forEach((select) => {
      select.disabled = !enabled || finished;
    });
    btnSubmit.disabled = !enabled || finished;
    btnPause.disabled = !started || finished;
    modeInputs.forEach((input) => {
      input.disabled = started && !finished;
    });
    if (timerSelect) timerSelect.disabled = !isTimedMode() || (started && !finished);
  }

  function stopTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function countAnswered() {
    return picks.filter((pick) => pick !== null).length;
  }

  function updateProgress() {
    const answered = countAnswered();
    const total = SENTENCES.length;
    const remaining = total - answered;
    const percent = total ? Math.round((answered / total) * 100) : 0;

    if (progressCounter) {
      progressCounter.textContent = answered + " / " + total;
      progressCounter.setAttribute("aria-label", answered + " of " + total + " sentences answered");
    }
    if (progressFill) {
      progressFill.style.width = percent + "%";
    }
    if (!progressHint) return;

    if (!started || finished) {
      progressHint.hidden = true;
      progressHint.classList.remove("is-complete");
      progressHint.textContent = "";
      return;
    }

    if (remaining > 0) {
      progressHint.hidden = false;
      progressHint.classList.remove("is-complete");
      progressHint.textContent =
        remaining === 1
          ? "You still have 1 sentence unanswered."
          : "You still have " + remaining + " sentences unanswered.";
    } else {
      progressHint.hidden = false;
      progressHint.classList.add("is-complete");
      progressHint.textContent = "Great job! You've answered every sentence.";
    }
  }

  function destroyChart() {
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
  }

  function renderChart(correct, total) {
    destroyChart();
    const Chart = window.Chart;
    if (!Chart || !chartCanvas) return;

    const wrong = total - correct;
    chartInstance = new Chart(chartCanvas.getContext("2d"), {
      type: "pie",
      data: {
        labels: ["Correct", "Incorrect"],
        datasets: [
          {
            data: [correct, wrong],
            backgroundColor: ["#db2777", "#9b2226"],
            borderWidth: 2,
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
                const pct = total ? ((n / total) * 100).toFixed(0) : "0";
                return ctx.label + ": " + n + " (" + pct + "%)";
              },
            },
          },
        },
      },
    });

    if (chartStats) {
      chartStats.textContent =
        "Correct: " + correct + "/" + total + " · Incorrect: " + wrong + "/" + total;
    }
  }

  function hideGradePanel() {
    destroyChart();
    if (gradePanel) gradePanel.hidden = true;
    if (summaryEl) {
      summaryEl.hidden = true;
      summaryEl.textContent = "";
    }
    if (chartStats) chartStats.textContent = "";
  }

  function showTimerBlock(show) {
    if (!timerBlock) return;
    timerBlock.hidden = !show;
  }

  function startTimer() {
    stopTimer();
    if (!isTimedMode()) {
      showTimerBlock(false);
      return;
    }
    const minutes = Number(timerSelect?.value || 5);
    timeLeftMs = minutes * 60 * 1000;
    showTimerBlock(true);
    updateTimerDisplay();
    timerId = setInterval(() => {
      if (paused) return;
      timeLeftMs -= 1000;
      updateTimerDisplay();
      if (timeLeftMs <= 0) {
        stopTimer();
        gradeActivity(true);
      }
    }, 1000);
  }

  function splitSentence(text) {
    const parts = text.split("___");
    return {
      before: (parts[0] || "").trim(),
      after: (parts[1] || "").trim(),
    };
  }

  function renderSentences() {
    sentencesEl.innerHTML = SENTENCES.map((item, index) => {
      const options = item.negative ? NEGATIVE_OPTIONS : POSITIVE_OPTIONS;
      const { before, after } = splitSentence(item.text);
      const optionTags = options
        .map((opt) => '<option value="' + opt + '">' + opt + "</option>")
        .join("");

      return (
        '<div class="be-verb-row" data-index="' +
        index +
        '">' +
        '<div class="be-verb-sentence">' +
        '<p class="be-verb-line be-verb-line--start">' +
        '<span class="be-verb-num">' +
        (index + 1) +
        ".</span> " +
        '<span class="be-verb-before">' +
        before +
        "</span>" +
        '<span class="be-verb-blank" aria-hidden="true">___</span>' +
        "</p>" +
        '<p class="be-verb-line be-verb-line--rest">' +
        after +
        "</p>" +
        "</div>" +
        '<div class="be-verb-picker">' +
        '<label class="be-verb-select-label" for="be-select-' +
        index +
        '">Choose the correct form for sentence ' +
        (index + 1) +
        "</label>" +
        '<select class="be-verb-select" id="be-select-' +
        index +
        '" data-index="' +
        index +
        '" disabled>' +
        '<option value="">Choose…</option>' +
        optionTags +
        "</select>" +
        "</div>" +
        '<p class="be-verb-row-feedback" hidden aria-live="polite"></p>' +
        "</div>"
      );
    }).join("");

    sentencesEl.querySelectorAll(".be-verb-select").forEach((select) => {
      select.addEventListener("change", onSelect);
    });
  }

  function onSelect(e) {
    if (!started || paused || finished) return;
    const select = e.currentTarget;
    const index = Number(select.dataset.index);
    picks[index] = select.value || null;
    select.classList.toggle("is-selected", Boolean(select.value));
    updateProgress();
  }

  function onStart() {
    if (finished) {
      resetActivity();
    }
    started = true;
    paused = false;
    finished = false;
    picks = Array(SENTENCES.length).fill(null);
    hideGradePanel();
    resultsEl.hidden = true;
    resultsEl.innerHTML = "";

    sentencesEl.querySelectorAll(".be-verb-row").forEach((row) => {
      row.classList.remove("be-verb-row--ok", "be-verb-row--bad");
      const fb = row.querySelector(".be-verb-row-feedback");
      if (fb) {
        fb.hidden = true;
        fb.textContent = "";
      }
    });
    sentencesEl.querySelectorAll(".be-verb-select").forEach((select) => {
      select.value = "";
      select.classList.remove("is-selected", "is-correct", "is-wrong");
    });

    btnStart.textContent = "Restart";
    btnPause.textContent = "Pause";
    setInteractive(true);
    updateProgress();
    startTimer();
  }

  function onPause() {
    if (!started || finished) return;
    paused = !paused;
    btnPause.textContent = paused ? "Resume" : "Pause";
    setInteractive(!paused);
  }

  function normalizeAnswer(value) {
    return (value || "").trim().toLowerCase().replace("’", "'");
  }

  function answersMatch(given, expected) {
    const g = normalizeAnswer(given);
    const e = normalizeAnswer(expected);
    if (g === e) return true;
    if (e === "isn't" && (g === "is not" || g === "'s not")) return true;
    if (e === "aren't" && (g === "are not" || g === "'re not")) return true;
    if (e === "am not" && g === "'m not") return true;
    return false;
  }

  function gradeActivity(autoFromTimer) {
    if (finished) return;
    finished = true;
    paused = false;
    stopTimer();
    showTimerBlock(false);
    setInteractive(false);
    btnPause.textContent = "Pause";

    let correct = 0;
    const rows = SENTENCES.map((item, index) => {
      const pick = picks[index];
      const ok = answersMatch(pick, item.answer);
      if (ok) correct += 1;

      const row = sentencesEl.querySelector('.be-verb-row[data-index="' + index + '"]');
      row.classList.add(ok ? "be-verb-row--ok" : "be-verb-row--bad");
      const select = row.querySelector(".be-verb-select");
      if (select) {
        select.classList.toggle("is-correct", ok);
        select.classList.toggle("is-wrong", !ok);
        if (pick) {
          select.value = pick;
        } else if (!ok) {
          select.value = item.answer;
        }
      }

      const fb = row.querySelector(".be-verb-row-feedback");
      if (fb) {
        fb.hidden = false;
        fb.textContent = ok
          ? "Correct!"
          : "Correct answer: " + item.answer;
        fb.className = "be-verb-row-feedback " + (ok ? "is-ok" : "is-bad");
      }

      return { ok, pick, answer: item.answer };
    });

    const percent = Math.round((correct / SENTENCES.length) * 100);
    resultsEl.hidden = false;
    resultsEl.innerHTML = rows
      .map((row, i) => {
        return (
          "<p class=\"be-verb-result-line " +
          (row.ok ? "is-ok" : "is-bad") +
          "\">" +
          "<strong>Sentence " +
          (i + 1) +
          ":</strong> " +
          (row.ok ? "Correct" : "Correct answer — <em>" + SENTENCES[i].answer + "</em>") +
          "</p>"
        );
      })
      .join("");

    let summary =
      "Score: <strong>" +
      correct +
      " / " +
      SENTENCES.length +
      "</strong> (" +
      percent +
      "%). ";
    if (autoFromTimer) {
      summary += "Time is up! ";
    }
    if (percent === 100) {
      summary += "Perfect! You know am / is / are and the negative forms.";
    } else if (percent >= 70) {
      summary += "Good work! Keep practicing the negative forms too.";
    } else {
      summary += "Review am / is / are and isn't / aren't / am not.";
    }

    summaryEl.innerHTML = summary;
    summaryEl.hidden = false;
    if (gradePanel) gradePanel.hidden = false;
    renderChart(correct, SENTENCES.length);
    updateProgress();
    gradePanel?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function resetActivity() {
    started = false;
    paused = false;
    finished = false;
    picks = Array(SENTENCES.length).fill(null);
    stopTimer();
    timeLeftMs = 0;
    showTimerBlock(false);
    btnStart.textContent = "Start";
    btnPause.textContent = "Pause";
    setInteractive(false);
    renderSentences();
    hideGradePanel();
    resultsEl.hidden = true;
    resultsEl.innerHTML = "";
    updateProgress();
  }

  function onModeChange() {
    if (timerSelect) {
      timerSelect.disabled = !isTimedMode() || (started && !finished);
    }
    if (!isTimedMode()) {
      showTimerBlock(false);
    }
  }

  modeInputs.forEach((input) => input.addEventListener("change", onModeChange));
  btnStart?.addEventListener("click", onStart);
  btnPause?.addEventListener("click", onPause);
  btnSubmit?.addEventListener("click", () => gradeActivity(false));

  renderSentences();
  setInteractive(false);
  updateProgress();
  onModeChange();
})();
