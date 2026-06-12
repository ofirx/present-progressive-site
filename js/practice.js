const practiceInputs = document.querySelectorAll(".practice-input");
const checkBtn = document.getElementById("practice-check");
const resetBtn = document.getElementById("practice-reset");
const feedbackEl = document.getElementById("practice-feedback");

if (!checkBtn || !resetBtn || !feedbackEl || !practiceInputs.length) {
  // Not on the practice page
} else {

function normalize(value) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function isCorrect(input) {
  const answers = input.dataset.answer.split(",").map(normalize);
  return answers.includes(normalize(input.value));
}

function setInputState(input, correct) {
  input.classList.remove("correct", "incorrect");
  if (!input.value.trim()) return;
  input.classList.add(correct ? "correct" : "incorrect");
}

function setPracticeFeedback(correctCount, total) {
  const en = `You got ${correctCount} out of ${total} correct.`;
  const he = `עניתם נכון על ${correctCount} מתוך ${total}.`;
  feedbackEl.innerHTML = `<span class="en">${en}</span><span class="he" dir="rtl" lang="he">${he}</span>`;
  feedbackEl.className =
    correctCount === total
      ? "practice-feedback bilingual-block ok"
      : "practice-feedback bilingual-block bad";
}

checkBtn.addEventListener("click", () => {
  let correctCount = 0;

  practiceInputs.forEach((input) => {
    const correct = isCorrect(input);
    if (correct) correctCount += 1;
    setInputState(input, correct);
  });

  setPracticeFeedback(correctCount, practiceInputs.length);
});

resetBtn.addEventListener("click", () => {
  practiceInputs.forEach((input) => {
    input.value = "";
    input.classList.remove("correct", "incorrect");
  });
  feedbackEl.textContent = "";
  feedbackEl.className = "practice-feedback bilingual-block";
});
}
