/**
 * TV Reporter — Present Progressive writing activity (Section 4).
 */
(function () {
  const TARGET_VERBS = [
    { base: "read", ing: "reading" },
    { base: "write", ing: "writing" },
    { base: "play", ing: "playing" },
    { base: "eat", ing: "eating" },
    { base: "draw", ing: "drawing" },
    { base: "run", ing: "running" },
  ];

  const MODEL_BY_VERB = {
    reading: "A boy is reading a book on the bench.",
    writing: "A girl is writing in her notebook.",
    playing: "The children are playing soccer.",
    eating: "A boy is eating an apple on the grass.",
    drawing: "A girl is drawing a picture on the grass.",
    running: "A boy is running in the park.",
  };

  const MODEL_BY_SLOT = [
    "A boy is reading a book on the bench.",
    "A girl is writing in her notebook.",
    "The children are playing soccer.",
    "A boy is eating an apple on the grass.",
  ];

  let submitAttempt = 0;

  function escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getModelAnswer(row, text) {
    const verbs = targetVerbsInSentence(text);
    if (verbs.length && MODEL_BY_VERB[verbs[0].ing]) {
      return MODEL_BY_VERB[verbs[0].ing];
    }
    return MODEL_BY_SLOT[row.index] || MODEL_BY_SLOT[0];
  }

  const form = document.getElementById("reporter-form");
  if (!form) return;

  const inputs = Array.from(form.querySelectorAll(".reporter-input"));
  const resultsEl = document.getElementById("reporter-results");
  const summaryEl = document.getElementById("reporter-summary");
  const btnClear = document.getElementById("reporter-clear");

  function hasPresentProgressive(sentence) {
    return /\b(am|is|are)\s+[a-z]+ing\b/i.test(sentence);
  }

  function targetVerbsInSentence(sentence) {
    const lower = sentence.toLowerCase();
    return TARGET_VERBS.filter((v) => {
      const ingWord = new RegExp("\\b" + v.ing + "\\b", "i");
      const badForm = new RegExp("\\b(am|is|are)\\s+" + v.base + "\\b", "i");
      return ingWord.test(lower) && !badForm.test(lower);
    });
  }

  const MESSAGES = {
    empty: "Please write a sentence here.",
    capital: "Start with a capital letter.",
    punctuation: "Finish with a full stop (.), ! or ?",
    pp: "Use Present Progressive: subject + am / is / are + verb-ing.",
    baseVerb: "Use the -ing form of the verb, not the base verb.",
    picture: "Describe an action from the picture using a verb with -ing.",
    length: "Try to write a fuller sentence (at least 4 words).",
  };

  function checkSentence(text, index) {
    const coreIssues = [];
    const minorIssues = [];
    const trimmed = text.trim();

    if (!trimmed) {
      return {
        status: "needs-work",
        score: 0,
        issues: [MESSAGES.empty],
        coreIssues: [MESSAGES.empty],
        minorIssues: [],
        ok: false,
        verbs: [],
        index,
      };
    }

    if (!/^[A-Z]/.test(trimmed)) {
      minorIssues.push(MESSAGES.capital);
    }

    if (!/[.!?]$/.test(trimmed)) {
      minorIssues.push(MESSAGES.punctuation);
    }

    if (!hasPresentProgressive(trimmed)) {
      coreIssues.push(MESSAGES.pp);
    } else if (/\b(am|is|are)\s+(read|write|play|eat|draw|run)\b/i.test(trimmed)) {
      coreIssues.push(MESSAGES.baseVerb);
    }

    const verbs = targetVerbsInSentence(trimmed);
    if (verbs.length === 0) {
      coreIssues.push(MESSAGES.picture);
    }

    if (trimmed.split(/\s+/).length < 4) {
      coreIssues.push(MESSAGES.length);
    }

    const issues = coreIssues.concat(minorIssues);
    let status;
    let score;

    if (coreIssues.length === 0 && minorIssues.length === 0) {
      status = "correct";
      score = 100;
    } else if (coreIssues.length === 0 && minorIssues.length > 0) {
      status = "almost";
      score = 90;
    } else {
      status = "needs-work";
      score = 0;
    }

    return {
      status,
      score,
      issues,
      coreIssues,
      minorIssues,
      ok: status === "correct",
      verbs,
      index,
    };
  }

  function renderResults(rows, showModels) {
    resultsEl.hidden = false;
    resultsEl.innerHTML = rows
      .map((row) => {
        let statusHtml;
        let detail;
        let cardClass = "reporter-result-card";

        if (showModels && row.status !== "correct") {
          statusHtml = '<span class="reporter-status reporter-status--model">Answer</span>';
          detail =
            '<p class="reporter-feedback reporter-feedback--model">Correct sentence:</p>' +
            '<p class="reporter-model-sentence">' + escapeHtml(row.modelAnswer) + "</p>";
          cardClass += " reporter-result-card--model";
        } else if (row.status === "correct") {
          statusHtml = '<span class="reporter-status reporter-status--ok">Correct</span>';
          detail =
            '<p class="reporter-feedback reporter-feedback--ok">Great job! This sentence uses Present Progressive well.</p>';
          cardClass += " reporter-result-card--ok";
        } else if (row.status === "almost") {
          statusHtml = '<span class="reporter-status reporter-status--almost">90%</span>';
          detail =
            '<p class="reporter-feedback reporter-feedback--almost">Good Present Progressive! Small fixes:</p>' +
            '<ul class="reporter-feedback reporter-feedback--almost-list">' +
            row.minorIssues.map((i) => "<li>" + i + "</li>").join("") +
            "</ul>";
          cardClass += " reporter-result-card--almost";
        } else {
          statusHtml = '<span class="reporter-status reporter-status--bad">Needs work</span>';
          detail =
            '<ul class="reporter-feedback reporter-feedback--bad">' +
            row.issues.map((i) => "<li>" + i + "</li>").join("") +
            "</ul>";
          cardClass += " reporter-result-card--bad";
        }

        return (
          "<article class=\"" + cardClass + "\">" +
          "<h3>Sentence " + (row.index + 1) + " " + statusHtml + "</h3>" +
          detail +
          "</article>"
        );
      })
      .join("");

    const totalScore = Math.round(
      rows.reduce((sum, row) => sum + row.score, 0) / rows.length
    );
    const correctCount = rows.filter((r) => r.status === "correct").length;

    let summary = "Your score: <strong>" + totalScore + "%</strong>. ";

    if (showModels && correctCount < rows.length) {
      summary +=
        "The boxes were cleared for sentences that were not 100% correct. " +
        "Read the correct sentences above and continue.";
    } else if (correctCount === rows.length) {
      summary += "Excellent reporting!";
    } else if (totalScore >= 90) {
      summary += "Strong Present Progressive! Fix the small tips and submit one more time.";
    } else {
      summary += "Focus on <strong>am / is / are + verb-ing</strong>, fix your sentences, and submit again.";
    }

    if (!showModels && rows.some((r) => r.status === "almost")) {
      summary +=
        " Sentences with only capital-letter or punctuation tips count as <strong>90%</strong>.";
    }

    summaryEl.innerHTML = summary;
    summaryEl.hidden = false;
  }

  function onSubmit(e) {
    e.preventDefault();
    submitAttempt += 1;
    const showModels = submitAttempt >= 2;

    const rows = inputs.map((input, index) => {
      const row = checkSentence(input.value, index);
      row.modelAnswer = getModelAnswer(row, input.value);
      input.classList.remove(
        "reporter-input--ok",
        "reporter-input--bad",
        "reporter-input--almost",
        "reporter-input--model"
      );
      input.disabled = false;

      if (showModels && row.status !== "correct") {
        input.value = "";
        input.disabled = true;
        input.classList.add("reporter-input--model");
      } else if (row.status === "correct") {
        input.classList.add("reporter-input--ok");
      } else if (row.status === "almost") {
        input.classList.add("reporter-input--almost");
      } else if (input.value.trim()) {
        input.classList.add("reporter-input--bad");
      }

      return row;
    });

    renderResults(rows, showModels);
    resultsEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function onClear() {
    submitAttempt = 0;
    inputs.forEach((input) => {
      input.value = "";
      input.disabled = false;
      input.classList.remove(
        "reporter-input--ok",
        "reporter-input--bad",
        "reporter-input--almost",
        "reporter-input--model"
      );
    });
    resultsEl.hidden = true;
    resultsEl.innerHTML = "";
    summaryEl.hidden = true;
    summaryEl.textContent = "";
    inputs[0]?.focus();
  }

  form.addEventListener("submit", onSubmit);
  btnClear?.addEventListener("click", onClear);
})();
