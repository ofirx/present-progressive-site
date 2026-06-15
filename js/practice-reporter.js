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

  function renderResults(rows) {
    resultsEl.hidden = false;
    resultsEl.innerHTML = rows
      .map((row) => {
        let statusHtml;
        let detail;
        let cardClass = "reporter-result-card";

        if (row.status === "correct") {
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
    const almostCount = rows.filter((r) => r.status === "almost").length;

    let summary = "Your score: <strong>" + totalScore + "%</strong>. ";

    if (correctCount === rows.length) {
      summary += "Excellent reporting!";
    } else if (totalScore >= 90) {
      summary += "Strong Present Progressive! Check the small fixes above.";
    } else {
      summary += "Focus on <strong>am / is / are + verb-ing</strong>, then try again.";
    }

    if (almostCount > 0) {
      summary +=
        " Sentences with only capital-letter or punctuation tips count as <strong>90%</strong>.";
    }

    summaryEl.innerHTML = summary;
    summaryEl.hidden = false;
  }

  function onSubmit(e) {
    e.preventDefault();
    const rows = inputs.map((input, index) => {
      const row = checkSentence(input.value, index);
      input.classList.remove("reporter-input--ok", "reporter-input--bad", "reporter-input--almost");
      if (row.status === "correct") input.classList.add("reporter-input--ok");
      else if (row.status === "almost") input.classList.add("reporter-input--almost");
      else if (input.value.trim()) input.classList.add("reporter-input--bad");
      return row;
    });
    renderResults(rows);
    resultsEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function onClear() {
    inputs.forEach((input) => {
      input.value = "";
      input.classList.remove("reporter-input--ok", "reporter-input--bad", "reporter-input--almost");
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
