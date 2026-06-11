const questions = [
  {
    question: "Which sentence uses the present progressive correctly?",
    questionHe: "איזה משפט משתמש נכון בהווה מתמשך?",
    options: [
      "She is cook dinner now.",
      "She is cooking dinner now.",
      "She cooking dinner now.",
    ],
    answer: 1,
    explanation: "Use am/is/are + verb-ing: She is cooking.",
    explanationHe: "יש להשתמש ב-am/is/are + verb-ing: She is cooking.",
  },
  {
    question: "Choose the correct form:",
    questionHe: "בחרו את הצורה הנכונה:",
    options: [
      "I am study for the test.",
      "I studying for the test.",
      "I am studying for the test.",
    ],
    answer: 2,
    explanation: "With I, use am + verb-ing.",
    explanationHe: "עם I משתמשים ב-am + verb-ing.",
  },
  {
    question: "Which sentence is in the present progressive?",
    questionHe: "איזה משפט הוא בהווה מתמשך?",
    options: [
      "They play chess every Friday.",
      "They are playing chess right now.",
      "They played chess yesterday.",
    ],
    answer: 1,
    explanation: "Present progressive describes an action happening now.",
    explanationHe: "הווה מתמשך מתאר פעולה שקורית עכשיו.",
  },
  {
    question: 'What is the -ing form of "run"?',
    questionHe: 'מהי צורת ה-ing של "run"?',
    options: ["runing", "running", "runned"],
    answer: 1,
    explanation: "Double the final consonant: run → running.",
    explanationHe: "מכפילים את האות האחרונה: run → running.",
  },
  {
    question: "Which negative sentence is correct?",
    questionHe: "איזה משפט שלילי נכון?",
    options: [
      "He is not working today.",
      "He not is working today.",
      "He is not work today.",
    ],
    answer: 0,
    explanation: "Put not after am/is/are: He is not working.",
    explanationHe: "שמים את not אחרי am/is/are: He is not working.",
  },
];

let current = 0;
let score = 0;
let answered = false;

const progressEl = document.getElementById("quiz-progress");
const questionEl = document.getElementById("quiz-question");
const questionHeEl = document.getElementById("quiz-question-he");
const optionsEl = document.getElementById("quiz-options");
const feedbackEnEl = document.getElementById("quiz-feedback-en");
const feedbackHeEl = document.getElementById("quiz-feedback-he");
const feedbackWrap = document.getElementById("quiz-feedback");
const nextBtn = document.getElementById("quiz-next");
const restartBtn = document.getElementById("quiz-restart");

function setProgress() {
  const en = `Question ${current + 1} of ${questions.length}`;
  const he = `שאלה ${current + 1} מתוך ${questions.length}`;
  progressEl.innerHTML = `<span class="en">${en}</span><span class="he" dir="rtl" lang="he">${he}</span>`;
}

function setFeedback(en, he, ok) {
  feedbackEnEl.textContent = en;
  feedbackHeEl.textContent = he;
  feedbackWrap.className = ok ? "quiz-feedback bilingual-block ok" : "quiz-feedback bilingual-block bad";
}

function renderQuestion() {
  answered = false;
  const item = questions[current];

  setProgress();
  questionEl.textContent = item.question;
  questionHeEl.textContent = item.questionHe;
  feedbackEnEl.textContent = "";
  feedbackHeEl.textContent = "";
  feedbackWrap.className = "quiz-feedback bilingual-block";
  nextBtn.hidden = true;
  restartBtn.hidden = true;

  optionsEl.innerHTML = "";
  item.options.forEach((text, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quiz-option";
    button.textContent = text;
    button.addEventListener("click", () => selectAnswer(index, button));
    optionsEl.appendChild(button);
  });
}

function selectAnswer(index, button) {
  if (answered) return;
  answered = true;

  const item = questions[current];
  const buttons = optionsEl.querySelectorAll(".quiz-option");
  buttons.forEach((btn) => (btn.disabled = true));

  if (index === item.answer) {
    score += 1;
    button.classList.add("correct");
    setFeedback(`Correct! ${item.explanation}`, `נכון! ${item.explanationHe}`, true);
  } else {
    button.classList.add("incorrect");
    buttons[item.answer].classList.add("correct");
    setFeedback(
      `Not quite. ${item.explanation}`,
      `לא בדיוק. ${item.explanationHe}`,
      false
    );
  }

  if (current < questions.length - 1) {
    nextBtn.hidden = false;
  } else {
    feedbackEnEl.textContent += ` Final score: ${score}/${questions.length}.`;
    feedbackHeEl.textContent += ` ציון סופי: ${score}/${questions.length}.`;
    restartBtn.hidden = false;
  }
}

nextBtn.addEventListener("click", () => {
  current += 1;
  renderQuestion();
});

restartBtn.addEventListener("click", () => {
  current = 0;
  score = 0;
  renderQuestion();
});

renderQuestion();
