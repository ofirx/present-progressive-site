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

  function checkSentence(text, index) {
    const issues = [];
    const trimmed = text.trim();

    if (!trimmed) {
      return {
        ok: false,
        issues: ["Please write a sentence here."],
        verbs: [],
      };
    }

    if (!/^[A-Z]/.test(trimmed)) {
      issues.push("Start with a capital letter.");
    }

    if (!/[.!?]$/.test(trimmed)) {
      issues.push("Finish with a full stop (.), ! or ?");
    }

    if (!hasPresentProgressive(trimmed)) {
      issues.push("Use Present Progressive: subject + am / is / are + verb-ing.");
    } else if (/\b(am|is|are)\s+(read|write|play|eat|draw|run)\b/i.test(trimmed)) {
      issues.push("Use the -ing form (reading, writing, playing…), not the base verb.");
    }

    const verbs = targetVerbsInSentence(trimmed);
    if (verbs.length === 0) {
      issues.push(
        "Include one of these verbs in the -ing form: reading, writing, playing, eating, drawing, running."
      );
    }

    if (trimmed.split(/\s+/).length < 4) {
      issues.push("Try to write a fuller sentence (at least 4 words).");
    }

    return { ok: issues.length === 0, issues, verbs, index };
  }

  function renderResults(rows) {
    resultsEl.hidden = false;
    resultsEl.innerHTML = rows
      .map((row) => {
        const status = row.ok
          ? '<span class="reporter-status reporter-status--ok">Correct</span>'
          : '<span class="reporter-status reporter-status--bad">Needs work</span>';
        const detail = row.ok
          ? "<p class=\"reporter-feedback reporter-feedback--ok\">Great job! This sentence uses Present Progressive well.</p>"
          : "<ul class=\"reporter-feedback reporter-feedback--bad\">" +
            row.issues.map((i) => "<li>" + i + "</li>").join("") +
            "</ul>";
        return (
          "<article class=\"reporter-result-card" +
          (row.ok ? " reporter-result-card--ok" : " reporter-result-card--bad") +
          "\">" +
          "<h3>Sentence " +
          (row.index + 1) +
          " " +
          status +
          "</h3>" +
          detail +
          "</article>"
        );
      })
      .join("");

    const correctCount = rows.filter((r) => r.ok).length;
    const allVerbs = new Set();
    rows.forEach((r) => r.verbs.forEach((v) => allVerbs.add(v.ing)));

    let summary =
      "You got <strong>" +
      correctCount +
      " / " +
      rows.length +
      "</strong> sentences correct.";

    if (allVerbs.size > 0) {
      summary +=
        " Verbs used: <strong>" +
        Array.from(allVerbs).join(", ") +
        "</strong>.";
    }

    if (correctCount === rows.length) {
      summary += " Excellent reporting!";
    } else {
      summary += " Read the tips and try again.";
    }

    summaryEl.innerHTML = summary;
    summaryEl.hidden = false;
  }

  function onSubmit(e) {
    e.preventDefault();
    const rows = inputs.map((input, index) => {
      const row = checkSentence(input.value, index);
      input.classList.toggle("reporter-input--ok", row.ok);
      input.classList.toggle("reporter-input--bad", !row.ok && input.value.trim());
      return row;
    });
    renderResults(rows);
    resultsEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function onClear() {
    inputs.forEach((input) => {
      input.value = "";
      input.classList.remove("reporter-input--ok", "reporter-input--bad");
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
