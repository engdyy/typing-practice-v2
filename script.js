const sourceTextEl = document.getElementById("sourceText");
const whitelistInputEl = document.getElementById("whitelistInput");
const sourcePanel = document.getElementById("sourcePanel");
const whitelistPanel = document.getElementById("whitelistPanel");

const practiceTextEl = document.getElementById("practiceText");
const practiceBoxEl = document.getElementById("practiceBox");

const retryBtn = document.getElementById("retryBtn");
const newTextBtn = document.getElementById("newTextBtn");

const progressBarInner = document.getElementById("progressBarInner");

const timeElapsedEl = document.getElementById("timeElapsed");
const capsIndicatorEl = document.getElementById("capsIndicator");

const correctCharsEl = document.getElementById("correctChars");
const errorCharsEl = document.getElementById("errorChars");
const totalKeysEl = document.getElementById("totalKeys");

const accuracyEl = document.getElementById("accuracy");
const wpmEl = document.getElementById("wpm");
const progressEl = document.getElementById("progress");

const errorSound = document.getElementById("errorSound");
const typingInputEl = document.getElementById("typingInput");

let referenceText = "";
let whitelist = [];
let currentIndex = 0;

let correctChars = 0;
let errorChars = 0;
let totalKeys = 0;

let startTime = null;
let isRunning = false;
let timerInterval = null;

let lastKeyCorrect = true;
let whitelistMask = [];

const defaultWhitelist = ["[KW]", "[TOPIC]"];
whitelistInputEl.value = defaultWhitelist.join("\n");

function getWhitelistFromUI() {
  const raw = whitelistInputEl.value
    .split(/\r?\n/)
    .map((i) => i.trim())
    .filter((l) => l.length > 0);
  return raw.sort((a, b) => b.length - a.length);
}

function isInWhitelist(text, index) {
  for (let item of whitelist) if (text.startsWith(item, index)) return item.length;
  return 0;
}

function computeWhitelistMask() {
  whitelistMask = new Array(referenceText.length).fill(false);
  for (let i = 0; i < referenceText.length; i++) {
    const len = isInWhitelist(referenceText, i);
    if (len > 0) {
      for (let j = 0; j < len && i + j < referenceText.length; j++) whitelistMask[i + j] = true;
      i += len - 1;
    }
  }
}

function renderText() {
  let html = "";
  for (let i = 0; i < referenceText.length; i++) {
    const ch = referenceText[i];
    const isWL = whitelistMask[i];

    if (i < currentIndex) {
      if (isWL) html += `<span class="char-whitelist">${ch}</span>`;
      else html += `<span class="char-done">${ch}</span>`;
    } else if (i === currentIndex) {
      html += `<span class="char-current${lastKeyCorrect ? "" : " error"}">${ch}</span>`;
    } else {
      html += `<span class="char-rest">${ch}</span>`;
    }
  }
  practiceTextEl.innerHTML = html;
}

function resetStats() {
  currentIndex = 0;
  correctChars = 0;
  errorChars = 0;
  totalKeys = 0;
  startTime = null;
  updateStats();
  if (timerInterval) clearInterval(timerInterval);
  timeElapsedEl.textContent = "00:00.0";
}

function updateStats() {
  correctCharsEl.textContent = correctChars;
  errorCharsEl.textContent = errorChars;
  totalKeysEl.textContent = totalKeys;

  const accuracy = totalKeys === 0 ? 0 : Math.round((correctChars / totalKeys) * 100);
  accuracyEl.textContent = accuracy + "%";

  const seconds = startTime ? (Date.now() - startTime) / 1000 : 0;
  const wpm = seconds === 0 ? 0 : Math.round((correctChars / 5) / (seconds / 60));
  wpmEl.textContent = wpm;

  progressEl.textContent = `${currentIndex} / ${referenceText.length}`;

  const pct = referenceText.length > 0 ? (currentIndex / referenceText.length) * 100 : 0;
  progressBarInner.style.width = pct + "%";
}

function updateTimer() {
  if (!startTime) return;
  const diff = Date.now() - startTime;
  const sec = diff / 1000;
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(1);
  timeElapsedEl.textContent = `${m.toString().padStart(2, "0")}:${s.toString().padStart(4, "0")}`;
  updateStats();
}

function focusTypingInput() {
  if (!typingInputEl) return;
  setTimeout(() => {
    typingInputEl.focus();
  }, 0);
}

function startPractice() {
  let txt = sourceTextEl.value;
  if (!txt.trim()) return;

  referenceText = txt.replace(/\r\n/g, "\n").trimEnd();
  whitelist = getWhitelistFromUI();
  computeWhitelistMask();
  resetStats();

  let skip;
  while ((skip = isInWhitelist(referenceText, currentIndex)) > 0) currentIndex += skip;

  renderText();
  updateStats();

  sourcePanel.classList.add("hidden");
  whitelistPanel.classList.add("hidden");

  document.querySelector(".practice-panel").classList.remove("hidden");

  practiceBoxEl.classList.add("active");
  retryBtn.style.display = "inline-block";
  newTextBtn.style.display = "inline-block";

  isRunning = true;
  timerInterval = setInterval(updateTimer, 100);

  focusTypingInput();
}

function restartPractice() {
  resetStats();
  computeWhitelistMask();

  let skip;
  while ((skip = isInWhitelist(referenceText, currentIndex)) > 0) currentIndex += skip;

  renderText();
  practiceBoxEl.classList.add("active");
  isRunning = true;
  timerInterval = setInterval(updateTimer, 100);

  focusTypingInput();
}

function resetAll() {
  sourceTextEl.value = "";
  whitelistInputEl.value = "";
  referenceText = "";
  whitelist = [];
  whitelistMask = [];
  resetStats();

  practiceTextEl.innerHTML = 'Dán đoạn văn và bấm "Bắt đầu luyện" để hiển thị ở đây.';

  sourcePanel.classList.remove("hidden");
  whitelistPanel.classList.remove("hidden");
  document.querySelector(".practice-panel").classList.add("hidden");

  retryBtn.style.display = "none";
  newTextBtn.style.display = "none";

  isRunning = false;
  if (typingInputEl) typingInputEl.blur();
}

document.getElementById("startBtn").onclick = startPractice;
document.getElementById("resetBtn").onclick = resetAll;
retryBtn.onclick = restartPractice;
newTextBtn.onclick = resetAll;

if (practiceBoxEl && typingInputEl) {
  practiceBoxEl.onclick = () => {
    typingInputEl.focus();
    typingInputEl.click();
  };
}

if (typingInputEl) {
  typingInputEl.addEventListener("keydown", (e) => {
    if (e.getModifierState("CapsLock")) {
      capsIndicatorEl.textContent = "Caps Lock: ON";
      capsIndicatorEl.classList.add("caps-on");
    } else {
      capsIndicatorEl.textContent = "Caps Lock: OFF";
      capsIndicatorEl.classList.remove("caps-on");
    }

    if (e.key === "Escape") {
      resetAll();
      return;
    }

    if (!referenceText || !isRunning) return;

    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      return;
    }

    if (e.key === " ") e.preventDefault();
    if (e.key.length !== 1 && e.key !== "Enter") return;

    totalKeys++;
    if (!startTime) startTime = Date.now();

    let skip;
    while ((skip = isInWhitelist(referenceText, currentIndex)) > 0) currentIndex += skip;

    const typed = e.key === "Enter" ? "\n" : e.key;
    const expected = referenceText[currentIndex];

    if (typed === expected) {
      correctChars++;
      currentIndex++;
      lastKeyCorrect = true;

      while ((skip = isInWhitelist(referenceText, currentIndex)) > 0) currentIndex += skip;
    } else {
      errorChars++;
      lastKeyCorrect = false;

      if (errorSound) {
        try {
          errorSound.currentTime = 0;
          const p = errorSound.play();
          if (p && p.catch) p.catch(() => {});
        } catch (_) {}
      }
    }

    if (currentIndex >= referenceText.length) {
      isRunning = false;
      clearInterval(timerInterval);
    }

    renderText();
    updateStats();
    typingInputEl.value = "";
  });
}

