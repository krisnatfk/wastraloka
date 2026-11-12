// Kuis "Tebak Asalnya": tampilkan foto budaya, pengunjung menebak provinsinya dari 4 pilihan.
// Skor hanya di memori halaman; jawaban benar memberi cap kunjungan provinsi itu di paspor.

import { CULTURE_KINDS } from "./content/culture-photos.js";
import { PROVINCES, provinceById } from "./content/provinces.js";
import { wikimediaSized } from "./content/wastra-catalog.js";
import { el, shuffle } from "./dom.js";
import { allCultureItems } from "./gallery.js";
import { provinceUrl } from "./map.js";

const OPTION_COUNT = 4;
const IMAGE_WIDTH = 960;

export function initQuiz({ onCorrect } = {}) {
  const root = document.getElementById("quiz");
  if (!root) return;

  // foto yang sama dipakai >1 provinsi (mis. Honai) tidak adil untuk ditebak
  const usage = new Map();
  for (const item of allCultureItems()) usage.set(item.photo.file, (usage.get(item.photo.file) ?? 0) + 1);
  const pool = allCultureItems().filter((item) => usage.get(item.photo.file) === 1);
  if (pool.length < OPTION_COUNT) { root.hidden = true; return; }

  const image = document.getElementById("quizImg");
  const question = document.getElementById("quizQuestion");
  const options = document.getElementById("quizOptions");
  const feedback = document.getElementById("quizFeedback");
  const next = document.getElementById("quizNext");
  const score = document.getElementById("quizScore");
  let queue = shuffle(pool);
  let answered = 0;
  let correct = 0;
  let streak = 0;

  function ask() {
    if (!queue.length) queue = shuffle(pool);
    const item = queue.pop();
    const answer = provinceById(item.provinceId);
    const others = shuffle(PROVINCES.filter((p) => p.id !== answer.id && p.region !== answer.region)).slice(0, OPTION_COUNT - 1);
    image.src = wikimediaSized(item.photo.src, IMAGE_WIDTH);
    image.alt = `Foto ${CULTURE_KINDS[item.kind].toLowerCase()} yang harus ditebak asalnya`;
    question.textContent = `${CULTURE_KINDS[item.kind]} ini berasal dari provinsi mana?`;
    feedback.replaceChildren();
    feedback.dataset.state = "";
    next.hidden = true;
    root.classList.remove("is-right", "is-wrong");
    options.replaceChildren(...shuffle([answer, ...others]).map((p) => {
      const b = el("button", { type: "button", textContent: p.name });
      b.addEventListener("click", () => check(b, p, answer, item));
      return b;
    }));
  }

  function check(button, picked, answer, item) {
    answered += 1;
    const isRight = picked.id === answer.id;
    if (isRight) { correct += 1; streak += 1; onCorrect?.(answer.id); } else { streak = 0; }
    for (const b of options.children) {
      b.disabled = true;
      if (b.textContent === answer.name) b.classList.add("right");
    }
    if (!isRight) button.classList.add("wrong");
    root.classList.add(isRight ? "is-right" : "is-wrong");
    feedback.dataset.state = isRight ? "right" : "wrong";
    feedback.replaceChildren(
      el("b", { textContent: isRight ? (streak >= 3 ? `Benar! ${streak} kali beruntun 🔥` : "Benar!") : `Kurang tepat, jawabannya ${answer.name}.` }),
      ` Ini ${item.photo.article}. `,
      el("a", { href: provinceUrl(answer.id), textContent: `Kenali ${answer.name} →` }),
    );
    score.textContent = `Skor ${correct}/${answered}`;
    next.hidden = false;
    next.focus();
  }

  next.addEventListener("click", ask);
  ask();
}
