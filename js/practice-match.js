/**
 * Present Progressive sentence-matching worksheet.
 * Drag colored parts into the correct order, then check all answers.
 */
(function () {
  const PART_COLORS = {
    subject: "subject",
    be: "be",
    verb: "verb",
    rest: "rest",
  };

  const SENTENCES = [
    {
      id: 1,
      parts: [
        { text: "She", type: PART_COLORS.subject },
        { text: "is", type: PART_COLORS.be },
        { text: "reading", type: PART_COLORS.verb },
        { text: "a book", type: PART_COLORS.rest },
      ],
      answer: "She is reading a book.",
    },
    {
      id: 2,
      parts: [
        { text: "We", type: PART_COLORS.subject },
        { text: "are", type: PART_COLORS.be },
        { text: "playing", type: PART_COLORS.verb },
        { text: "soccer in the park", type: PART_COLORS.rest },
      ],
      answer: "We are playing soccer in the park.",
    },
    {
      id: 3,
      parts: [
        { text: "I", type: PART_COLORS.subject },
        { text: "am", type: PART_COLORS.be },
        { text: "cooking", type: PART_COLORS.verb },
        { text: "dinner tonight", type: PART_COLORS.rest },
      ],
      answer: "I am cooking dinner tonight.",
    },
    {
      id: 4,
      parts: [
        { text: "The baby", type: PART_COLORS.subject },
        { text: "is", type: PART_COLORS.be },
        { text: "crying", type: PART_COLORS.verb },
        { text: "right now", type: PART_COLORS.rest },
      ],
      answer: "The baby is crying right now.",
    },
    {
      id: 5,
      parts: [
        { text: "They", type: PART_COLORS.subject },
        { text: "are", type: PART_COLORS.be },
        { text: "not watching", type: PART_COLORS.verb },
        { text: "TV at the moment", type: PART_COLORS.rest },
      ],
      answer: "They are not watching TV at the moment.",
    },
  ];

  const root = document.getElementById("match-worksheet");
  const exercisesEl = document.getElementById("match-exercises");
  const submitBtn = document.getElementById("match-submit");
  const resetBtn = document.getElementById("match-reset");
  const scoreEl = document.getElementById("match-score");

  if (!root || !exercisesEl || !submitBtn) return;

  let draggedChip = null;

  function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function createChip(part, sentenceId, partIndex) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = `match-chip match-chip--s${sentenceId}-p${partIndex}`;
    chip.textContent = part.text;
    chip.draggable = true;
    chip.dataset.sentenceId = String(sentenceId);
    chip.dataset.partIndex = String(partIndex);
    chip.dataset.text = part.text;
    chip.setAttribute("aria-label", part.text);

    chip.addEventListener("dragstart", (e) => {
      draggedChip = chip;
      chip.classList.add("is-dragging");
      e.dataTransfer?.setData("text/plain", chip.dataset.partIndex);
      e.dataTransfer.effectAllowed = "move";
    });

    chip.addEventListener("dragend", () => {
      chip.classList.remove("is-dragging");
      draggedChip = null;
    });

    chip.addEventListener("click", () => {
      if (root.classList.contains("is-graded")) return;
      const slot = chip.closest(".match-slot");
      if (slot) {
        const bank = getBank(sentenceId);
        clearSlot(slot);
        bank?.appendChild(chip);
        return;
      }
      const nextSlot = findNextEmptySlot(sentenceId);
      if (nextSlot) placeChipInSlot(chip, nextSlot);
    });

    return chip;
  }

  function findNextEmptySlot(sentenceId) {
    const row = exercisesEl.querySelector(`[data-sentence-id="${sentenceId}"]`);
    if (!row) return null;
    return row.querySelector(".match-slot:not(.is-filled)");
  }

  function clearSlot(slot) {
    slot.classList.remove("is-filled", "is-correct", "is-incorrect");
    slot.innerHTML = "";
    slot.removeAttribute("data-part-index");
  }

  function getBank(sentenceId) {
    return exercisesEl.querySelector(`.match-bank[data-bank="${sentenceId}"]`);
  }

  function placeChipInSlot(chip, targetSlot) {
    if (!chip || !targetSlot) return;

    const sentenceId = chip.dataset.sentenceId;
    const bank = getBank(sentenceId);
    const sourceSlot = chip.closest(".match-slot");
    const displaced = targetSlot.querySelector(".match-chip");

    if (displaced === chip) return;

    if (displaced) {
      if (sourceSlot) {
        sourceSlot.appendChild(displaced);
        sourceSlot.classList.add("is-filled");
        sourceSlot.dataset.partIndex = displaced.dataset.partIndex;
      } else if (bank) {
        bank.appendChild(displaced);
      }
    } else if (sourceSlot) {
      clearSlot(sourceSlot);
    }

    targetSlot.appendChild(chip);
    targetSlot.classList.add("is-filled");
    targetSlot.dataset.partIndex = chip.dataset.partIndex;
  }

  function wireSlot(slot) {
    slot.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (!draggedChip) return;
      slot.classList.add("is-drag-over");
    });

    slot.addEventListener("dragleave", () => {
      slot.classList.remove("is-drag-over");
    });

    slot.addEventListener("drop", (e) => {
      e.preventDefault();
      slot.classList.remove("is-drag-over");
      if (!draggedChip || root.classList.contains("is-graded")) return;
      placeChipInSlot(draggedChip, slot);
    });
  }

  function renderSentence(sentence) {
    const row = document.createElement("article");
    row.className = "match-row";
    row.dataset.sentenceId = String(sentence.id);

    const header = document.createElement("div");
    header.className = "match-row-header";
    header.innerHTML = `<span class="match-row-num">${sentence.id}.</span>`;

    const slotsWrap = document.createElement("div");
    slotsWrap.className = "match-slots";
    slotsWrap.setAttribute("aria-label", `Sentence ${sentence.id} word order`);

    sentence.parts.forEach((part, index) => {
      const slot = document.createElement("div");
      slot.className = "match-slot";
      slot.dataset.slotIndex = String(index);
      wireSlot(slot);
      slotsWrap.appendChild(slot);
    });

    const bank = document.createElement("div");
    bank.className = "match-bank";
    bank.dataset.bank = String(sentence.id);
    bank.setAttribute("aria-label", `Word bank for sentence ${sentence.id}`);

    shuffle(sentence.parts.map((part, index) => ({ part, index }))).forEach(({ part, index }) => {
      bank.appendChild(createChip(part, sentence.id, index));
    });

    const feedback = document.createElement("div");
    feedback.className = "match-row-feedback";
    feedback.hidden = true;

    row.append(header, slotsWrap, bank, feedback);
    return row;
  }

  function getUserOrder(sentenceId) {
    const row = exercisesEl.querySelector(`[data-sentence-id="${sentenceId}"]`);
    const slots = row?.querySelectorAll(".match-slot");
    if (!slots) return [];
    return Array.from(slots).map((slot) => {
      const chip = slot.querySelector(".match-chip");
      return chip ? Number(chip.dataset.partIndex) : -1;
    });
  }

  function isRowComplete(sentenceId) {
    const order = getUserOrder(sentenceId);
    return order.length > 0 && order.every((i) => i >= 0);
  }

  function gradeRow(sentence) {
    const order = getUserOrder(sentence.id);
    const correctOrder = sentence.parts.map((_, i) => i);
    return order.every((val, i) => val === correctOrder[i]);
  }

  function renderAll() {
    exercisesEl.innerHTML = "";
    SENTENCES.forEach((sentence) => {
      exercisesEl.appendChild(renderSentence(sentence));
    });
    root.classList.remove("is-graded");
    scoreEl.hidden = true;
    scoreEl.textContent = "";
  }

  submitBtn.addEventListener("click", () => {
    const incomplete = SENTENCES.find((s) => !isRowComplete(s.id));
    if (incomplete) {
      scoreEl.hidden = false;
      scoreEl.className = "match-score match-score--warn bilingual-block";
      scoreEl.innerHTML = `
        <span class="en">Please complete all 5 sentences before checking.</span>
        <span class="he" dir="rtl" lang="he">השלימו את כל 5 המשפטים לפני הבדיקה.</span>
      `;
      return;
    }

    let correctCount = 0;
    SENTENCES.forEach((sentence) => {
      const row = exercisesEl.querySelector(`[data-sentence-id="${sentence.id}"]`);
      const isCorrect = gradeRow(sentence);
      if (isCorrect) correctCount += 1;

      row.querySelectorAll(".match-slot").forEach((slot) => {
        slot.classList.remove("is-correct", "is-incorrect");
        slot.classList.add(isCorrect ? "is-correct" : "is-incorrect");
      });

      const feedback = row.querySelector(".match-row-feedback");
      feedback.hidden = false;
      feedback.className = `match-row-feedback ${isCorrect ? "is-correct" : "is-incorrect"}`;
      feedback.innerHTML = isCorrect
        ? `<span class="en">Correct!</span><span class="he" dir="rtl" lang="he">נכון!</span>`
        : `
          <span class="en"><strong>Correct answer:</strong> ${sentence.answer}</span>
          <span class="he" dir="rtl" lang="he"><strong>תשובה נכונה:</strong> ${sentence.answer}</span>
        `;
    });

    root.classList.add("is-graded");
    scoreEl.hidden = false;
    const total = SENTENCES.length;
    const en =
      correctCount === total
        ? `Perfect! You got ${correctCount} out of ${total} correct.`
        : `You got ${correctCount} out of ${total} correct. See the answers below each sentence.`;
    const he =
      correctCount === total
        ? `מצוין! עניתם נכון על ${correctCount} מתוך ${total}.`
        : `עניתם נכון על ${correctCount} מתוך ${total}. ראו את התשובות מתחת לכל משפט.`;
    scoreEl.className =
      correctCount === total
        ? "match-score match-score--ok bilingual-block"
        : "match-score match-score--bad bilingual-block";
    scoreEl.innerHTML = `<span class="en">${en}</span><span class="he" dir="rtl" lang="he">${he}</span>`;
  });

  resetBtn?.addEventListener("click", renderAll);

  renderAll();
})();
