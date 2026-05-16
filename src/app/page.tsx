"use client";

import Image from "next/image";
import { type CSSProperties, type DragEvent, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/* ─── Confetti celebration ─── */
function Confetti({ active }: { active: boolean }) {
  const colors = ["#fb7185", "#f59e0b", "#34d399", "#60a5fa", "#a78bfa", "#fbbf24"];
  const [pieces] = useState(() =>
    Array.from({ length: 40 }, () => ({
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 1.2}s`,
      animationDuration: `${2 + Math.random() * 2}s`,
      width: `${6 + Math.random() * 8}px`,
      height: `${6 + Math.random() * 8}px`,
    })),
  );

  if (!active) return null;

  return (
    <div className="confetti-container" aria-hidden="true">
      {pieces.map((piece, i) => (
        <div
          key={i}
          className="confetti-piece"
          style={{
            left: piece.left,
            background: colors[i % colors.length],
            animationDelay: piece.animationDelay,
            animationDuration: piece.animationDuration,
            width: piece.width,
            height: piece.height,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Sound effects via Web Audio API ─── */
function useSoundEffects() {
  const ctxRef = useRef<AudioContext | null>(null);
  const getCtx = useCallback(() => {
    if (!ctxRef.current && typeof AudioContext !== "undefined") {
      ctxRef.current = new AudioContext();
    }
    return ctxRef.current;
  }, []);

  const playTone = useCallback((freq: number, duration: number, type: OscillatorType = "sine") => {
    const ctx = getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }, [getCtx]);

  const playCorrect = useCallback(() => {
    playTone(523, 0.15);
    setTimeout(() => playTone(659, 0.15), 100);
    setTimeout(() => playTone(784, 0.25), 200);
  }, [playTone]);

  const playWrong = useCallback(() => {
    playTone(300, 0.2, "square");
    setTimeout(() => playTone(250, 0.3, "square"), 150);
  }, [playTone]);

  const playClick = useCallback(() => {
    playTone(880, 0.06);
  }, [playTone]);

  return { playCorrect, playWrong, playClick };
}

/* ─── Text-to-Speech hook ─── */
function useTTS() {
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const stop = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setSpeakingId(null);
  }, []);

  const speak = useCallback((id: string, text: string, lang: string = "en-US") => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.88;
    utterance.pitch = 1.1;
    utterance.volume = 1;
    utterance.onstart = () => setSpeakingId(id);
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    window.speechSynthesis.speak(utterance);
    setSpeakingId(id);
  }, []);

  const isActive = useCallback((id: string) => speakingId === id, [speakingId]);

  useEffect(() => {
    return () => { window.speechSynthesis?.cancel(); };
  }, []);

  return { speak, stop, isActive };
}

/* ─── Convert fraction notation to spoken words ─── */
function fractionToWords(text: string, lang: "en" | "id"): string {
  if (lang === "en") {
    return text
      .replace(/3\/4/g, "three quarters")
      .replace(/1\/2/g, "one half")
      .replace(/1\/4/g, "one quarter")
      .replace(/1\/3/g, "one third");
  }
  return text
    .replace(/3\/4/g, "tiga perempat")
    .replace(/1\/2/g, "setengah")
    .replace(/1\/4/g, "seperempat")
    .replace(/1\/3/g, "sepertiga");
}

/* ─── Progress bar component ─── */
// Legacy component kept for future UI variants.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ProgressBar({ current, total, score }: { current: number; total: number; score: number }) {
  const pct = ((current + 1) / total) * 100;
  return (
    <div className="w-full space-y-1">
      <div className="flex items-center justify-between text-xs font-bold text-stone-500">
        <span>{Math.round(pct)}%</span>
        <span>🏆 {score}</span>
      </div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ─── How-to-play modal ─── */
function HowToPlayModal({ language, onClose }: { language: "en" | "id"; onClose: () => void }) {
  const steps = language === "en"
    ? [
      { icon: "👨‍🍳", text: "Pick your chef buddy to guide you." },
      { icon: "🧩", text: "Solve 5 fraction levels: tap or drag your answers." },
      { icon: "💡", text: "Read the coach hints if you get stuck." },
      { icon: "⭐", text: "Earn 20 points per correct answer. Aim for 100!" },
    ]
    : [
      { icon: "👨‍🍳", text: "Pilih teman koki untuk membimbingmu." },
      { icon: "🧩", text: "Selesaikan 5 level pecahan: ketuk atau seret jawabanmu." },
      { icon: "💡", text: "Baca petunjuk pelatih jika bingung." },
      { icon: "⭐", text: "Dapatkan 20 poin per jawaban benar. Targetkan 100!" },
    ];

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-black text-stone-900">
          {language === "en" ? "How to Play" : "Cara Bermain"} 🎮
        </h2>
        <div className="mt-5 space-y-4">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="step-indicator">{i + 1}</span>
              <div className="flex items-center gap-2 pt-0.5">
                <span className="text-xl">{step.icon}</span>
                <p className="text-base text-stone-700">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-[1.5rem] bg-stone-900 px-5 py-3 text-base font-black text-white transition hover:-translate-y-1"
        >
          {language === "en" ? "Got it!" : "Mengerti!"}
        </button>
      </div>
    </div>
  );
}

/* ─── Streak badge ─── */
function StreakBadge({ streak }: { streak: number }) {
  if (streak < 2) return null;
  return (
    <div className="bounce-in inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-400 to-rose-500 px-3 py-1.5 text-sm font-black text-white shadow-lg">
      <span className="streak-flame">🔥</span>
      <span>{streak}x</span>
    </div>
  );
}

/* ─── Post-answer feedback panel ─── */
function FeedbackPanel({
  result,
  questionId,
  language,
  chefAvatar,
  chefName,
}: {
  result: QuestionResult | undefined;
  questionId: QuestionId;
  language: Language;
  chefAvatar: string;
  chefName: string;
}) {
  if (!result) return null;

  const explanation = result.correct
    ? explanationBank[questionId].correct
    : explanationBank[questionId].wrong;

  return (
    <div className={`mt-6 feedback-slide-in ${result.correct ? "feedback-correct" : "feedback-wrong"}`}>
      <div className="feedback-card">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full text-2xl ${
              result.correct
                ? "bg-emerald-100 shadow-[0_8px_20px_rgba(52,211,153,0.25)]"
                : "bg-rose-100 shadow-[0_8px_20px_rgba(251,113,133,0.25)]"
            }`}
          >
            {result.correct ? "✅" : "💡"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-black ${
                  result.correct
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-rose-100 text-rose-700"
                }`}
              >
                {result.correct
                  ? language === "en"
                    ? "🎉 Correct!"
                    : "🎉 Benar!"
                  : language === "en"
                    ? "❌ Not quite!"
                    : "❌ Belum tepat!"}
              </span>
              {result.points > 0 && (
                <span className="points-pop inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-black text-amber-700">
                  +{result.points} ⭐
                </span>
              )}
            </div>
            <p className="mt-3 text-base leading-7 text-stone-700">
              {pickText(explanation, language)}
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-[1.2rem] bg-stone-50 px-4 py-3">
          <span className="text-2xl">{chefAvatar}</span>
          <p className="text-sm font-bold italic text-stone-600">
            {result.correct
              ? language === "en"
                ? `"${chefName} is so proud of you!"`
                : `"${chefName} sangat bangga padamu!"`
              : language === "en"
                ? "\"Don't worry! Every mistake helps us learn!\""
                : "\"Jangan khawatir! Setiap kesalahan membantu kita belajar!\""}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Welcome feature cards ─── */
function FeatureCards({ language }: { language: Language }) {
  const features = [
    {
      icon: "🎮",
      title: language === "en" ? "5 Fun Levels" : "5 Level Seru",
      desc: language === "en" ? "Pizza, chocolate, cake & more!" : "Pizza, cokelat, kue & lainnya!",
      gradient: "from-rose-400 to-pink-500",
      bg: "bg-rose-50",
    },
    {
      icon: "🌐",
      title: language === "en" ? "Bilingual" : "Dwibahasa",
      desc: language === "en" ? "English & Indonesian" : "Inggris & Indonesia",
      gradient: "from-cyan-400 to-blue-500",
      bg: "bg-cyan-50",
    },
    {
      icon: "🧮",
      title: language === "en" ? "Learn Fractions" : "Belajar Pecahan",
      desc: language === "en" ? "Master ½ and ¼" : "Kuasai ½ dan ¼",
      gradient: "from-amber-400 to-orange-500",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="grid w-full max-w-lg grid-cols-3 gap-3">
      {features.map((f, i) => (
        <div
          key={i}
          className={`${f.bg} feature-card-entrance rounded-[1.4rem] border border-white/60 p-4 text-center shadow-sm`}
          style={{ animationDelay: `${0.1 + i * 0.1}s` }}
        >
          <div
            className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${f.gradient} text-2xl shadow-md`}
          >
            {f.icon}
          </div>
          <p className="mt-2 text-sm font-black text-stone-800">{f.title}</p>
          <p className="mt-1 text-xs text-stone-500">{f.desc}</p>
        </div>
      ))}
    </div>
  );
}

const questionOrder = [
  "pizza",
  "chocolate",
  "cake",
  "notThird",
  "sorting",
] as const;
const sortItemIds = ["watermelon", "orange", "dragonfruit", "kiwi"] as const;

type Language = "en" | "id";
type Screen = "welcome" | "game" | "results";
type ChefId = "luna" | "milo" | "nori";
type QuestionId = (typeof questionOrder)[number];
type SortBucket = "half" | "quarter";
type SortItemId = (typeof sortItemIds)[number];
type ChocolateLabelValue = "1/3" | "1/2" | "1/4";

type AnswersState = {
  pizza: string | null;
  chocolate: string | null;
  chocolateLabel: ChocolateLabelValue | null;
  cake: string | null;
  notThird: string | null;
  sorting: Partial<Record<SortItemId, SortBucket>>;
};

type QuestionResult = {
  correct: boolean;
  points: number;
};

type ResultsState = Partial<Record<QuestionId, QuestionResult>>;

type LocalizedText = {
  en: string;
  id: string;
};

type PieOption = {
  id: string;
  title: LocalizedText;
  subtitle: LocalizedText;
  snack: LocalizedText;
  segments: number[];
  highlighted: number[];
  colors?: {
    crust: string;
    fill: string;
    base: string;
  };
};

type FractionOption = {
  id: string;
  title: LocalizedText;
  subtitle: LocalizedText;
  value: string;
};

type ChefCard = {
  id: ChefId;
  avatar: string;
  accent: string;
  name: LocalizedText;
  badge: LocalizedText;
  cheer: LocalizedText;
};

type SortItem = {
  id: SortItemId;
  label: LocalizedText;
  snack: LocalizedText;
  bucket: SortBucket;
  segments: number[];
  highlighted: number[];
  colors: {
    crust: string;
    fill: string;
    base: string;
  };
};

const uiText = {
  en: {
    appName: "Fraction Adventure",
    appSubtitle:
      "A candy-colored math game for 2nd graders to learn one-half and one-fourth.",
    welcomeKicker: "Kitchen Quest",
    welcomeTitle: "Share the snacks fairly.",
    welcomeBody:
      "Pick a chef buddy, switch languages anytime, and solve 5 tiny fraction levels without leaving the game board.",
    chooseChef: "Choose your chef helper",
    chooseLanguage: "Language",
    start: "Start the game",
    back: "Back",
    playAgain: "Play again",
    switchHint: "You can switch between English and Indonesian any time.",
    progress: "Level",
    score: "Score",
    submit: "Submit answer",
    next: "Next level",
    finish: "See results",
    smartCoach: "Smart Coach",
    dragHint: "Drag or tap to place your answer.",
    sortingHint: "Drag or tap each fruit slice into the right basket.",
    resetTray: "Return to tray",
    yourAnswer: "Your answer",
    correctAnswer: "Correct answer",
    explanation: "Why it works",
    notAnswered: "Not answered",
    ready: "Ready for the next fraction challenge?",
    perfect: "Perfect kitchen score!",
    niceTry: "Nice job, math chef!",
    welcomeStats1: "5 quick game levels",
    welcomeStats2: "English + Indonesian",
    welcomeStats3: "Fractions 1/2 and 1/4",
    summaryTitle: "Game report",
    summaryBody:
      "Each question below shows your answer and a simple explanation so children can review the idea of equal parts.",
    reviewListTitle: "Recipe review",
    reviewLaterHint: "Choose an answer, then keep going. The full explanation will be waiting on the final page.",
    backToKitchen: "Back to the kitchen",
    correctChip: "Correct",
    wrongChip: "Try again",
    question: "Question",
    tapToCycle: "Tip: tapping a fruit card moves it to the next basket.",
    continueHint: "Check the coach note, then move on.",
    dropHere: "Drop here",
    chocolateTitle: "Chocolate Drag & Drop",
    pizzaLevelTitle: "Level 1: Pizza Fractions",
    chocolateLevelTitle: "Level 2: Chocolate Fractions",
    cakeLevelTitle: "Level 3: Cake Fractions",
    cakeCardTitle: "Identify 1/4 of a cake",
    notHalfLevelTitle: "Level 4: Spot the Difference",
    notHalfCardTitle: "Pick the shape that is NOT 1/2",
    notHalfCardHelper: "Tap on the cookie that is divided unfairly!",
    chocolateCoachBubble: "\"Great job, helper! Half means two parts that are exactly the same size!\"",
    selectLabelFirst: "Choose a fraction label first.",
    nextLevel: "Next Level",
    incompletePizza: "Pick one pizza first.",
    incompleteChocolate: "Place the 1/2 label on one chocolate bar.",
    incompleteCake: "Choose the fraction for one cake piece.",
    incompleteNotThird: "Pick the shape that is not one-half.",
    incompleteSorting: "Sort every fruit slice before you submit.",
    footerBrand: "© 2024 Candy Kitchen Math - Baking up Fractions!",
    privacy: "Privacy",
    parentsGuide: "Parents Guide",
    help: "Help",
    footerNote:
      "Built to feel playful, visual, and bilingual for young learners.",
  },
  id: {
    appName: "Petualangan Pecahan",
    appSubtitle:
      "Game matematika berwarna ceria untuk siswa kelas 2 belajar setengah dan seperempat.",
    welcomeKicker: "Misi Dapur",
    welcomeTitle: "Bagi camilan dengan adil.",
    welcomeBody:
      "Pilih teman koki, ganti bahasa kapan saja, lalu selesaikan 5 level pecahan tanpa keluar dari papan permainan.",
    chooseChef: "Pilih teman koki",
    chooseLanguage: "Bahasa",
    start: "Mulai bermain",
    back: "Kembali",
    playAgain: "Main lagi",
    switchHint: "Bahasa Inggris dan Indonesia bisa diganti kapan saja.",
    progress: "Level",
    score: "Skor",
    submit: "Kirim jawaban",
    next: "Level berikutnya",
    finish: "Lihat hasil",
    smartCoach: "Pelatih Pintar",
    dragHint: "Seret atau ketuk untuk menaruh jawaban.",
    sortingHint: "Seret atau ketuk tiap potongan buah ke keranjang yang benar.",
    resetTray: "Kembali ke nampan",
    yourAnswer: "Jawabanmu",
    correctAnswer: "Jawaban benar",
    explanation: "Mengapa benar",
    notAnswered: "Belum dijawab",
    ready: "Siap ke tantangan pecahan berikutnya?",
    perfect: "Skor dapur sempurna!",
    niceTry: "Hebat, koki matematika!",
    welcomeStats1: "5 level game cepat",
    welcomeStats2: "Bahasa Inggris + Indonesia",
    welcomeStats3: "Pecahan 1/2 dan 1/4",
    summaryTitle: "Laporan permainan",
    summaryBody:
      "Setiap soal di bawah menampilkan jawabanmu dan penjelasan sederhana agar anak bisa meninjau ide tentang bagian yang sama besar.",
    reviewListTitle: "Ulasan resep",
    reviewLaterHint: "Pilih jawaban, lalu lanjutkan. Penjelasan lengkap akan menunggu di halaman akhir.",
    backToKitchen: "Kembali ke dapur",
    correctChip: "Benar",
    wrongChip: "Coba lagi",
    question: "Soal",
    tapToCycle: "Tips: ketuk kartu buah untuk memindahkannya ke keranjang berikutnya.",
    continueHint: "Baca catatan pelatih, lalu lanjut.",
    dropHere: "Taruh di sini",
    chocolateTitle: "Seret & Lepas Cokelat",
    pizzaLevelTitle: "Level 1: Pecahan Pizza",
    chocolateLevelTitle: "Level 2: Pecahan Cokelat",
    cakeLevelTitle: "Level 3: Pecahan Kue",
    cakeCardTitle: "Kenali 1/4 dari kue",
    notHalfLevelTitle: "Level 4: Cari Perbedaannya",
    notHalfCardTitle: "Pilih bentuk yang BUKAN 1/2",
    notHalfCardHelper: "Ketuk kue yang dibagi tidak adil!",
    chocolateCoachBubble: "\"Kerja bagus, helper! Setengah berarti dua bagian yang ukurannya tepat sama!\"",
    selectLabelFirst: "Pilih label pecahan dulu.",
    nextLevel: "Level Berikutnya",
    incompletePizza: "Pilih satu pizza terlebih dahulu.",
    incompleteChocolate: "Taruh label 1/2 pada salah satu cokelat batangan.",
    incompleteCake: "Pilih pecahan untuk satu potong kue.",
    incompleteNotThird: "Pilih bentuk yang bukan setengah.",
    incompleteSorting: "Kelompokkan semua potongan buah sebelum kirim.",
    footerBrand: "© 2024 Candy Kitchen Math - Baking up Fractions!",
    privacy: "Privasi",
    parentsGuide: "Panduan Orang Tua",
    help: "Bantuan",
    footerNote:
      "Dibuat agar terasa seperti bermain, visual, dan bilingual untuk siswa kecil.",
  },
} as const;

const chefs: ChefCard[] = [
  {
    id: "luna",
    avatar: "🍓",
    accent: "from-rose-400 via-pink-300 to-orange-200",
    name: {
      en: "Chef Luna",
      id: "Koki Luna",
    },
    badge: {
      en: "Berry Baker",
      id: "Juru Roti Berry",
    },
    cheer: {
      en: "Let's share every snack in equal parts!",
      id: "Ayo bagi setiap camilan menjadi bagian yang sama besar!",
    },
  },
  {
    id: "milo",
    avatar: "🍫",
    accent: "from-amber-400 via-orange-300 to-yellow-200",
    name: {
      en: "Chef Milo",
      id: "Koki Milo",
    },
    badge: {
      en: "Chocolate Captain",
      id: "Kapten Cokelat",
    },
    cheer: {
      en: "We can spot one-half and one-fourth together.",
      id: "Kita bisa menemukan setengah dan seperempat bersama.",
    },
  },
  {
    id: "nori",
    avatar: "🍉",
    accent: "from-cyan-400 via-teal-300 to-lime-200",
    name: {
      en: "Chef Nori",
      id: "Koki Nori",
    },
    badge: {
      en: "Fruit Slice Friend",
      id: "Teman Irisan Buah",
    },
    cheer: {
      en: "Tiny slices can teach big ideas.",
      id: "Irisan kecil bisa mengajarkan ide yang besar.",
    },
  },
];

const pizzaOptions: PieOption[] = [
  {
    id: "pizza-quarter",
    title: {
      en: "1 slice out of 4 equal slices",
      id: "1 potong dari 4 potong yang sama besar",
    },
    subtitle: {
      en: "This pizza shows one-fourth.",
      id: "Pizza ini menunjukkan seperempat.",
    },
    snack: {
      en: "Pizza",
      id: "Pizza",
    },
    segments: [90, 90, 90, 90],
    highlighted: [0],
    colors: {
      crust: "#e67e22",
      fill: "#ff7b54",
      base: "#ffe2a6",
    },
  },
  {
    id: "pizza-half",
    title: {
      en: "1 slice out of 2 pieces",
      id: "1 potong dari 2 bagian",
    },
    subtitle: {
      en: "This is one-half, not one-fourth.",
      id: "Ini setengah, bukan seperempat.",
    },
    snack: {
      en: "Pizza",
      id: "Pizza",
    },
    segments: [180, 180],
    highlighted: [0],
    colors: {
      crust: "#d97706",
      fill: "#fb7185",
      base: "#fde68a",
    },
  },
  {
    id: "pizza-unequal",
    title: {
      en: "Slices are not equal",
      id: "Potongannya tidak sama besar",
    },
    subtitle: {
      en: "Fractions need equal parts.",
      id: "Pecahan harus punya bagian yang sama besar.",
    },
    snack: {
      en: "Pizza",
      id: "Pizza",
    },
    segments: [55, 115, 190],
    highlighted: [0],
    colors: {
      crust: "#f97316",
      fill: "#f87171",
      base: "#fdedd0",
    },
  },
  {
    id: "pizza-three-quarter",
    title: {
      en: "3 slices out of 4 equal slices",
      id: "3 potong dari 4 bagian sama besar",
    },
    subtitle: {
      en: "This shows three-fourths, not one-fourth.",
      id: "Ini menunjukkan tiga perempat, bukan seperempat.",
    },
    snack: {
      en: "Pizza",
      id: "Pizza",
    },
    segments: [90, 90, 90, 90],
    highlighted: [0, 1, 2],
    colors: {
      crust: "#f97316",
      fill: "#f59e0b",
      base: "#fde68a",
    },
  },
];

const pizzaReferenceImages: Record<
  string,
  {
    src: string;
    imageClassName: string;
    frameClassName?: string;
  }
> = {
  "pizza-half": {
    src: "/pizza-half.png",
    imageClassName: "h-[88%] w-[88%] object-contain drop-shadow-[0_15px_15px_rgba(0,0,0,0.12)]",
  },
  "pizza-quarter": {
    src: "/pizza-quarter.png",
    imageClassName: "h-[88%] w-[88%] object-contain drop-shadow-[0_15px_15px_rgba(0,0,0,0.12)]",
  },
  "pizza-unequal": {
    src: "/pizza-unequal.png",
    imageClassName: "h-[88%] w-[88%] object-contain drop-shadow-[0_15px_15px_rgba(0,0,0,0.12)]",
  },
  "pizza-three-quarter": {
    src: "/pizza-three-quarter.png",
    imageClassName: "h-[88%] w-[88%] object-contain drop-shadow-[0_15px_15px_rgba(0,0,0,0.12)]",
  },
};

const cakeOptions: FractionOption[] = [
  {
    id: "cake-half",
    title: {
      en: "1/2",
      id: "1/2",
    },
    subtitle: {
      en: "One out of 2 equal pieces",
      id: "Satu dari 2 bagian yang sama besar",
    },
    value: "1/2",
  },
  {
    id: "cake-quarter",
    title: {
      en: "1/4",
      id: "1/4",
    },
    subtitle: {
      en: "One out of 4 equal pieces",
      id: "Satu dari 4 bagian yang sama besar",
    },
    value: "1/4",
  },
  {
    id: "cake-third",
    title: {
      en: "1/3",
      id: "1/3",
    },
    subtitle: {
      en: "One out of 3 equal pieces",
      id: "Satu dari 3 bagian yang sama besar",
    },
    value: "1/3",
  },
];

const notThirdOptions: PieOption[] = [
  {
    id: "half-green",
    title: {
      en: "2 equal pie pieces",
      id: "2 potongan pie sama besar",
    },
    subtitle: {
      en: "One highlighted piece is one-half.",
      id: "Satu potongan berwarna adalah setengah.",
    },
    snack: {
      en: "Kiwi Pie",
      id: "Pie Kiwi",
    },
    segments: [180, 180],
    highlighted: [0],
    colors: {
      crust: "#65a30d",
      fill: "#84cc16",
      base: "#d9f99d",
    },
  },
  {
    id: "half-blue",
    title: {
      en: "A square cookie split into 2 equal parts",
      id: "Kue persegi dibagi menjadi 2 bagian sama besar",
    },
    subtitle: {
      en: "A diagonal line can still make one-half if the two pieces match.",
      id: "Garis diagonal tetap bisa menunjukkan setengah jika kedua bagiannya sama.",
    },
    snack: {
      en: "Square Cookie",
      id: "Kue Persegi",
    },
    segments: [180, 180],
    highlighted: [1],
    colors: {
      crust: "#2563eb",
      fill: "#38bdf8",
      base: "#dbeafe",
    },
  },
  {
    id: "not-half",
    title: {
      en: "A cookie split into unequal parts",
      id: "Kue yang dibagi menjadi bagian tidak sama besar",
    },
    subtitle: {
      en: "This is not one-half because one side is smaller.",
      id: "Ini bukan setengah karena salah satu sisinya lebih kecil.",
    },
    snack: {
      en: "Rectangle Cookie",
      id: "Kue Persegi Panjang",
    },
    segments: [80, 130, 150],
    highlighted: [0],
    colors: {
      crust: "#8b5cf6",
      fill: "#f472b6",
      base: "#fae8ff",
    },
  },
  {
    id: "half-square",
    title: {
      en: "2 equal rounded-square halves",
      id: "2 bagian persegi bundar yang sama besar",
    },
    subtitle: {
      en: "A fair horizontal split still shows one-half.",
      id: "Pembagian horizontal yang adil tetap menunjukkan setengah.",
    },
    snack: {
      en: "Cookie Square",
      id: "Kue Persegi",
    },
    segments: [180, 180],
    highlighted: [1],
    colors: {
      crust: "#e76f51",
      fill: "#f4a261",
      base: "#e9c46a",
    },
  },
];

const sortItems: SortItem[] = [
  {
    id: "watermelon",
    label: {
      en: "Watermelon",
      id: "Semangka",
    },
    snack: {
      en: "1 out of 2 equal slices",
      id: "1 dari 2 irisan yang sama besar",
    },
    bucket: "half",
    segments: [180, 180],
    highlighted: [0],
    colors: {
      crust: "#16a34a",
      fill: "#fb7185",
      base: "#dcfce7",
    },
  },
  {
    id: "orange",
    label: {
      en: "Orange",
      id: "Jeruk",
    },
    snack: {
      en: "1 out of 4 equal pieces",
      id: "1 dari 4 potongan yang sama besar",
    },
    bucket: "quarter",
    segments: [90, 90, 90, 90],
    highlighted: [0],
    colors: {
      crust: "#ea580c",
      fill: "#fb923c",
      base: "#ffedd5",
    },
  },
  {
    id: "dragonfruit",
    label: {
      en: "Dragon Fruit",
      id: "Buah Naga",
    },
    snack: {
      en: "1 out of 2 equal pieces",
      id: "1 dari 2 potongan yang sama besar",
    },
    bucket: "half",
    segments: [180, 180],
    highlighted: [1],
    colors: {
      crust: "#be185d",
      fill: "#f472b6",
      base: "#fce7f3",
    },
  },
  {
    id: "kiwi",
    label: {
      en: "Kiwi",
      id: "Kiwi",
    },
    snack: {
      en: "1 out of 4 equal pieces",
      id: "1 dari 4 potongan yang sama besar",
    },
    bucket: "quarter",
    segments: [90, 90, 90, 90],
    highlighted: [2],
    colors: {
      crust: "#4d7c0f",
      fill: "#84cc16",
      base: "#ecfccb",
    },
  },
];

const questionPrompts: Record<
  QuestionId,
  {
    prompt: LocalizedText;
    helper: LocalizedText;
  }
> = {
  pizza: {
    prompt: {
      en: "Which pizza shows exactly 1/4?",
      id: "Pizza mana yang menunjukkan tepat 1/4?",
    },
    helper: {
      en: "Look for 4 equal slices with only 1 slice highlighted.",
      id: "Cari 4 potongan yang sama besar dengan hanya 1 potongan yang disorot.",
    },
  },
  chocolate: {
    prompt: {
      en: "Drag the 1/2 label to the chocolate bar with 2 equal parts.",
      id: "Seret label 1/2 ke cokelat batangan dengan 2 bagian yang sama besar.",
    },
    helper: {
      en: "One-half means 1 out of 2 fair parts.",
      id: "Setengah artinya 1 dari 2 bagian yang adil.",
    },
  },
  cake: {
    prompt: {
      en: "Mom cuts a cake into 4 equal pieces. One piece is...",
      id: "Ibu memotong kue menjadi 4 bagian sama besar. Satu bagian adalah...",
    },
    helper: {
      en: "The bottom number tells how many equal parts there are.",
      id: "Angka bawah menunjukkan ada berapa bagian yang sama besar.",
    },
  },
  notThird: {
    prompt: {
      en: "Pick the shape that is NOT 1/2.",
      id: "Pilih bentuk yang BUKAN 1/2.",
    },
    helper: {
      en: "One-half only works when the whole shape is split into 2 equal parts.",
      id: "Setengah hanya benar jika seluruh bentuk dibagi menjadi 2 bagian yang sama besar.",
    },
  },
  sorting: {
    prompt: {
      en: "Sort the fruit slices into the 1/2 or 1/4 baskets.",
      id: "Kelompokkan potongan buah ke keranjang 1/2 atau 1/4.",
    },
    helper: {
      en: "Count how many equal pieces each fruit was cut into.",
      id: "Hitung berapa bagian sama besar pada tiap buah.",
    },
  },
};

const explanationBank: Record<
  QuestionId,
  {
    correct: LocalizedText;
    wrong: LocalizedText;
  }
> = {
  pizza: {
    correct: {
      en: "Yes. One-fourth means 1 of 4 equal slices, so the pizza must show 4 matching pieces with only 1 selected.",
      id: "Ya. Seperempat berarti 1 dari 4 potongan yang sama besar, jadi pizza harus punya 4 bagian yang cocok dengan hanya 1 yang dipilih.",
    },
    wrong: {
      en: "One-fourth is not about any small piece. It must be 1 out of 4 equal slices. Equal parts are the important clue.",
      id: "Seperempat bukan sekadar potongan kecil. Harus 1 dari 4 bagian yang sama besar. Petunjuk terpentingnya adalah bagian yang sama besar.",
    },
  },
  chocolate: {
    correct: {
      en: "Great match. The label 1/2 belongs on the chocolate bar divided into 2 equal pieces because one-half is 1 of 2 fair parts.",
      id: "Pas sekali. Label 1/2 cocok untuk cokelat yang dibagi menjadi 2 bagian sama besar karena setengah adalah 1 dari 2 bagian yang adil.",
    },
    wrong: {
      en: "Check the number on the bottom. The bottom number 2 means the whole chocolate bar must be split into 2 equal parts.",
      id: "Periksa angka di bawah. Angka bawah 2 berarti seluruh cokelat harus dibagi menjadi 2 bagian yang sama besar.",
    },
  },
  cake: {
    correct: {
      en: "Exactly. If a cake is cut into 4 equal pieces, one piece is one-fourth, written as 1/4.",
      id: "Tepat. Jika kue dipotong menjadi 4 bagian yang sama besar, satu bagian adalah seperempat, ditulis 1/4.",
    },
    wrong: {
      en: "The cake has 4 equal pieces, so the denominator should be 4. One single piece from those 4 pieces is 1/4.",
      id: "Kue itu punya 4 bagian yang sama besar, jadi penyebutnya harus 4. Satu bagian dari 4 bagian itu adalah 1/4.",
    },
  },
  notThird: {
    correct: {
      en: "Nice spotting. Even if a shape has 2 pieces, it is not one-half when the pieces are different sizes.",
      id: "Bagus. Walaupun sebuah bentuk punya 2 potongan, itu bukan setengah jika ukuran potongannya berbeda-beda.",
    },
    wrong: {
      en: "Remember the fairness rule. One-half means 2 equal pieces. If the pieces do not match, the highlighted part is not 1/2.",
      id: "Ingat aturan adil. Setengah berarti 2 bagian yang sama besar. Jika ukurannya tidak sama, bagian yang disorot bukan 1/2.",
    },
  },
  sorting: {
    correct: {
      en: "Excellent sorting. Items in the 1/2 basket have 2 equal pieces, and items in the 1/4 basket have 4 equal pieces.",
      id: "Penyortiranmu hebat. Benda di keranjang 1/2 punya 2 bagian sama besar, dan benda di keranjang 1/4 punya 4 bagian sama besar.",
    },
    wrong: {
      en: "Try counting the pieces again. The denominator tells how many equal pieces the whole fruit was cut into.",
      id: "Coba hitung potongannya lagi. Penyebut menunjukkan ada berapa bagian sama besar saat seluruh buah dipotong.",
    },
  },
};

const storageKeys = {
  language: "fraction-adventure-language",
  chef: "fraction-adventure-chef",
};
const settingsEvent = "fraction-adventure-settings";

function pickText(text: LocalizedText, language: Language) {
  return text[language];
}

function subscribeToSettingsStore(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(settingsEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(settingsEvent, onStoreChange);
  };
}

function getStoredLanguage(): Language {
  if (typeof window === "undefined") {
    return "en";
  }

  return window.localStorage.getItem(storageKeys.language) === "id" ? "id" : "en";
}

function getStoredChef(): ChefId {
  if (typeof window === "undefined") {
    return "luna";
  }

  const chef = window.localStorage.getItem(storageKeys.chef);

  return chef === "milo" || chef === "nori" ? chef : "luna";
}

function createInitialAnswers(): AnswersState {
  return {
    pizza: null,
    chocolate: null,
    chocolateLabel: null,
    cake: null,
    notThird: null,
    sorting: {},
  };
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;

  return {
    x: centerX + radius * Math.cos(radians),
    y: centerY + radius * Math.sin(radians),
  };
}

function describeArc(startAngle: number, endAngle: number) {
  const start = polarToCartesian(50, 50, 42, endAngle);
  const end = polarToCartesian(50, 50, 42, startAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return `M 50 50 L ${end.x.toFixed(3)} ${end.y.toFixed(3)} A 42 42 0 ${largeArcFlag} 1 ${start.x.toFixed(3)} ${start.y.toFixed(3)} Z`;
}

function PieSnack({
  label,
  segments,
  highlighted,
  colors,
  size = "large",
}: {
  label: string;
  segments: number[];
  highlighted: number[];
  colors?: {
    crust: string;
    fill: string;
    base: string;
  };
  size?: "large" | "small";
}) {
  const tone = colors ?? {
    crust: "#f97316",
    fill: "#fb7185",
    base: "#fde68a",
  };
  const wrapperClass = size === "large" ? "h-[8.5rem] w-[8.5rem] sm:h-[9.5rem] sm:w-[9.5rem]" : "h-[5.5rem] w-[5.5rem]";

  return (
    <div className={`relative ${wrapperClass}`}>
      <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-[0_12px_24px_rgba(0,0,0,0.16)]">
        <circle cx="50" cy="50" r="46" fill={tone.crust} />
        <circle cx="50" cy="50" r="42" fill={tone.base} />
        {segments.map((segment, index) => {
          const startAngle = segments.slice(0, index).reduce((sum, value) => sum + value, 0);
          const path = describeArc(startAngle, startAngle + segment);
          const isHighlighted = highlighted.includes(index);

          return (
            <path
              key={`${label}-${segment}-${index}`}
              d={path}
              fill={isHighlighted ? tone.fill : tone.base}
              stroke="rgba(255,255,255,0.9)"
              strokeWidth="2.7"
            />
          );
        })}
        <circle cx="50" cy="50" r="7" fill="rgba(255,255,255,0.8)" />
      </svg>
      <div className="absolute inset-x-0 -bottom-2 mx-auto w-fit rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-stone-700 shadow-sm">
        {label}
      </div>
    </div>
  );
}

function FractionBadge({ value, large = false }: { value: string; large?: boolean }) {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-[1.5rem] border-[3px] border-white/80 bg-[linear-gradient(135deg,#fb7185,#f59e0b)] text-white shadow-[0_14px_30px_rgba(251,113,133,0.28)] ${large ? "h-[4.5rem] w-[4.5rem] text-2xl" : "h-14 w-14 text-xl"
        } font-black`}
    >
      {value}
    </div>
  );
}

function ChocolateBar({
  widths,
  dropLabel,
  emptyLabel,
  selected,
  revealCorrect,
  revealWrong,
  glossy = false,
}: {
  widths: number[];
  dropLabel: string | null;
  emptyLabel: string;
  selected: boolean;
  revealCorrect?: boolean;
  revealWrong?: boolean;
  glossy?: boolean;
}) {
  const cardClass = revealCorrect
    ? "border-[#98f4dd] bg-white shadow-[0_12px_34px_rgba(152,244,221,0.35)] ring-4 ring-[#98f4dd]/35"
    : revealWrong
      ? "border-[#ffb1c0] bg-[#fff6f8] shadow-[0_12px_34px_rgba(255,133,161,0.18)]"
      : selected
        ? "border-[#98f4dd] bg-white shadow-[0_12px_34px_rgba(152,244,221,0.3)]"
        : "border-[#ece2d8] bg-white shadow-[0_10px_28px_rgba(145,110,79,0.1)]";

  return (
    <div className={`rounded-[2rem] border-[3px] p-6 transition-all ${cardClass}`}>
      <div className="flex h-40 overflow-hidden rounded-[1rem] border-[4px] border-[#7c4d00] bg-[#5c3400] shadow-[inset_0_6px_12px_rgba(0,0,0,0.15)]">
        {widths.map((width, index) => (
          <div
            key={`${dropLabel ?? emptyLabel}-${width}-${index}`}
            style={{ flex: width } as CSSProperties}
            className={`relative h-full ${index < widths.length - 1 ? "border-r-[3px] border-[#5f3600]" : ""}`}
          >
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#94630f_0%,#7a4a00_100%)]" />
            {glossy && (
              <div className="absolute left-3 right-3 top-3 h-[45%] rounded-[0.35rem] bg-white/12" />
            )}
          </div>
        ))}
      </div>
      <div className="mt-7 flex h-20 items-center justify-center rounded-[1.1rem] border-2 border-dashed border-[#dbc0c4] bg-[#f6eee2] px-4 text-center">
        {dropLabel ? (
          <span className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#f4b43a,#ef9b1d)] px-6 py-3 text-2xl font-black text-[#5a3800] shadow-[0_6px_0_#c57e1a,0_12px_20px_rgba(239,155,29,0.22)]">
            {dropLabel}
          </span>
        ) : (
          <span className="text-2xl font-medium text-stone-400">{emptyLabel}</span>
        )}
      </div>
    </div>
  );
}

function LanguageSwitcher({
  language,
  onChange,
}: {
  language: Language;
  onChange: (value: Language) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-white/70 bg-white/80 p-1 shadow-[0_10px_24px_rgba(255,255,255,0.22)] backdrop-blur">
      <button
        type="button"
        onClick={() => onChange("en")}
        className={`rounded-full px-3 py-2 text-sm font-bold transition ${language === "en" ? "bg-stone-900 text-white" : "text-stone-700"
          }`}
      >
        🇺🇸 EN
      </button>
      <button
        type="button"
        onClick={() => onChange("id")}
        className={`rounded-full px-3 py-2 text-sm font-bold transition ${language === "id" ? "bg-stone-900 text-white" : "text-stone-700"
          }`}
      >
        🇮🇩 ID
      </button>
    </div>
  );
}

function LessonProgressBar({
  current,
  total,
  marker,
}: {
  current: number;
  total: number;
  marker: string;
}) {
  const pct = ((current + 1) / total) * 100;

  return (
    <div className="lesson-progress-wrap" aria-hidden="true">
      <div className="lesson-progress-track">
        <div className="lesson-progress-fill" style={{ width: `${pct}%` }}>
          <span className="lesson-progress-star">
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
              <path d="M12 2.75l2.5 5.06 5.59.81-4.04 3.94.95 5.57L12 15.5l-5 2.63.95-5.57-4.04-3.94 5.59-.81L12 2.75z" />
            </svg>
          </span>
        </div>
      </div>
      <div className="lesson-progress-cap">
        <span>{marker}</span>
      </div>
    </div>
  );
}

function CandyLevelHeader({
  title,
  language,
  current,
  total,
  score,
  streak,
  onBack,
  onChangeLanguage,
}: {
  title: string;
  language: Language;
  current: number;
  total: number;
  score: number;
  streak: number;
  onBack: () => void;
  onChangeLanguage: (value: Language) => void;
}) {
  return (
    <header className="border-b-4 border-[#f3e5ab] bg-[#fff9f0] shadow-[0_4px_0_rgba(255,133,161,0.18)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center gap-3">
          <span className="text-3xl font-black tracking-tight text-[#ff7f9d]">
            Candy Kitchen Math
          </span>
          <div className="score-glow inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-4 py-2 text-sm font-black text-amber-800 shadow-sm">
            <span>🏆</span>
            <span className="score-pop">{score}</span>
          </div>
          {streak >= 2 && <StreakBadge streak={streak} />}
        </div>
        <div className="relative flex-1 lg:max-w-3xl lg:px-14">
          <button
            type="button"
            onClick={onBack}
            className="left-0 top-1/2 inline-flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#e8ddd4] bg-white text-[#a03b56] shadow-[0_4px_0_#dbc0c4] transition hover:translate-y-[calc(-50%+1px)] hover:shadow-[0_3px_0_#dbc0c4] lg:absolute"
            aria-label={language === "en" ? "Back" : "Kembali"}
          >
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 px-1 text-sm font-black text-[#8a5300] sm:text-base">
              <span>{title}</span>
              <span>{`Level ${current} / ${total}`}</span>
            </div>
            <div className="h-7 overflow-hidden rounded-full border border-[#e5dbcf] bg-[#ebe2d7] shadow-inner">
              <div
                className="flex h-full items-center justify-end rounded-full bg-[linear-gradient(180deg,#fb799b_0%,#f16e91_100%)] pr-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]"
                style={{ width: `${(current / total) * 100}%` }}
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
                  <path d="M12 2l2.83 5.74 6.34.92-4.59 4.47 1.08 6.32L12 16.47 6.34 19.45l1.08-6.32L2.83 8.66l6.34-.92L12 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end">
          <div className="inline-flex rounded-full border-2 border-[#e7e2d9] bg-[#f0e8dd] p-1 shadow-inner">
            <button
              type="button"
              onClick={() => onChangeLanguage("id")}
              className={`rounded-full px-4 py-2 text-sm font-black transition ${language === "id" ? "bg-[#a03b56] text-white shadow-sm" : "text-[#554245]"}`}
            >
              ID
            </button>
            <button
              type="button"
              onClick={() => onChangeLanguage("en")}
              className={`rounded-full px-4 py-2 text-sm font-black transition ${language === "en" ? "bg-[#a03b56] text-white shadow-sm" : "text-[#554245]"}`}
            >
              EN
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function CakeQuarterPreview() {
  return (
    <div className="relative h-72 w-72 sm:h-80 sm:w-80">
      <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-[0_12px_24px_rgba(230,194,122,0.22)]">
        <circle cx="50" cy="50" r="47" fill="#f7e7a4" stroke="#e6c27a" strokeWidth="1.8" />
        <path d={describeArc(0, 90)} fill="#ffd9df" stroke="#ff85a1" strokeWidth="1.3" />
        <line x1="50" y1="3" x2="50" y2="97" stroke="#e6c27a" strokeWidth="1.4" />
        <line x1="3" y1="50" x2="97" y2="50" stroke="#e6c27a" strokeWidth="1.4" />
        <text x="74" y="28" textAnchor="middle" className="fill-[#a03b56] text-[11px] font-black">
          1/4
        </text>
      </svg>
    </div>
  );
}

function NotHalfShape({ optionId }: { optionId: PieOption["id"] }) {
  if (optionId === "half-green") {
    return (
      <div className="relative h-56 w-56 rounded-full border-[8px] border-[#e76f51] bg-[#f4a261] shadow-inner">
        <div className="absolute inset-y-0 left-0 w-1/2 rounded-l-full border-r-[4px] border-dashed border-[#e76f51] bg-[#e9c46a]" />
        <span className="absolute left-10 top-10 h-4 w-4 rounded-full bg-[#264653]" />
        <span className="absolute right-10 top-20 h-3.5 w-3.5 rounded-full bg-[#264653]" />
        <span className="absolute bottom-14 right-12 h-5 w-5 rounded-full bg-[#264653]" />
      </div>
    );
  }

  if (optionId === "not-half") {
    return (
      <div className="relative h-56 w-56 overflow-hidden rounded-[1.2rem] border-[8px] border-[#e76f51] bg-[#f4a261] shadow-inner">
        <div className="absolute inset-y-0 left-0 w-1/3 border-r-[4px] border-dashed border-[#e76f51] bg-[#e9c46a]" />
        <span className="absolute left-5 top-6 h-2.5 w-8 rotate-45 rounded-full bg-[#e76f51]" />
        <span className="absolute right-16 top-20 h-2.5 w-8 rotate-90 rounded-full bg-[#e9c46a]" />
        <span className="absolute bottom-10 right-8 h-2.5 w-8 -rotate-12 rounded-full bg-[#2a9d8f]" />
      </div>
    );
  }

  if (optionId === "half-square") {
    return (
      <div className="relative h-56 w-56 overflow-hidden rounded-[2.4rem] border-[8px] border-[#e76f51] bg-[#f4a261] shadow-inner">
        <div className="absolute inset-x-0 top-0 h-1/2 border-b-[4px] border-dashed border-[#e76f51] bg-[#e9c46a]" />
      </div>
    );
  }

  return (
    <div className="relative h-56 w-56 overflow-hidden border-[8px] border-[#e76f51] bg-[#f4a261] shadow-inner">
      <div className="absolute inset-0 bg-[#e9c46a]" style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }} />
      <div className="absolute left-1 top-1 h-[140%] w-[4px] origin-top-left rotate-45 border-l-[4px] border-dashed border-[#e76f51]" />
    </div>
  );
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswersState>(createInitialAnswers());
  const [results, setResults] = useState<ResultsState>({});
  const [showIncompleteHint, setShowIncompleteHint] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [questionKey, setQuestionKey] = useState(0);
  const [activeChocolateLabel, setActiveChocolateLabel] = useState<ChocolateLabelValue | null>(null);
  const sfx = useSoundEffects();
  const tts = useTTS();

  const language = useSyncExternalStore<Language>(
    subscribeToSettingsStore,
    getStoredLanguage,
    () => "en",
  );
  const selectedChef = useSyncExternalStore<ChefId>(
    subscribeToSettingsStore,
    getStoredChef,
    () => "luna",
  );

  useEffect(() => {
    document.documentElement.lang = language === "en" ? "en" : "id";
  }, [language]);

  const t = uiText[language];
  const activeChef = chefs.find((chef) => chef.id === selectedChef) ?? chefs[0];
  const currentQuestionId = questionOrder[currentQuestionIndex];
  const currentQuestion = questionPrompts[currentQuestionId];
  const currentResult = results[currentQuestionId];
  const totalScore = questionOrder.reduce((sum, questionId) => sum + (results[questionId]?.points ?? 0), 0);
  const totalCorrect = questionOrder.reduce(
    (sum, questionId) => sum + (results[questionId]?.correct ? 1 : 0),
    0,
  );
  // Reserved for future input patterns that update answers without auto-submitting.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function updateAnswer<K extends keyof AnswersState>(key: K, value: AnswersState[K]) {
    if (currentResult) {
      return;
    }

    setShowIncompleteHint(false);
    setAnswers((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  function handleLanguageChange(nextLanguage: Language) {
    window.localStorage.setItem(storageKeys.language, nextLanguage);
    window.dispatchEvent(new Event(settingsEvent));
  }

  function handleChefChange(nextChef: ChefId) {
    window.localStorage.setItem(storageKeys.chef, nextChef);
    window.dispatchEvent(new Event(settingsEvent));
  }

  function startGame() {
    sfx.playClick();
    setShowHowToPlay(false);
    setScreen("game");
    setCurrentQuestionIndex(0);
    setAnswers(createInitialAnswers());
    setResults({});
    setShowIncompleteHint(false);
    setStreak(0);
    setShowConfetti(false);
    setQuestionKey(0);
    setActiveChocolateLabel(null);
  }

  function replayGame() {
    sfx.playClick();
    setScreen("welcome");
    setCurrentQuestionIndex(0);
    setAnswers(createInitialAnswers());
    setResults({});
    setShowIncompleteHint(false);
    setStreak(0);
    setShowConfetti(false);
    setQuestionKey(0);
    setActiveChocolateLabel(null);
  }

  function getIncompleteMessage(questionId: QuestionId) {
    switch (questionId) {
      case "pizza":
        return t.incompletePizza;
      case "chocolate":
        return t.incompleteChocolate;
      case "cake":
        return t.incompleteCake;
      case "notThird":
        return t.incompleteNotThird;
      case "sorting":
        return t.incompleteSorting;
    }
  }

  function evaluate(
    questionId: QuestionId,
    state: AnswersState = answers,
    chocolateLabel: ChocolateLabelValue | null = state.chocolateLabel,
  ): QuestionResult {
    switch (questionId) {
      case "pizza":
        return {
          correct: state.pizza === "pizza-quarter",
          points: state.pizza === "pizza-quarter" ? 20 : 0,
        };
      case "chocolate":
        return {
          correct: state.chocolate === "bar-half" && chocolateLabel === "1/2",
          points: state.chocolate === "bar-half" && chocolateLabel === "1/2" ? 20 : 0,
        };
      case "cake":
        return {
          correct: state.cake === "cake-quarter",
          points: state.cake === "cake-quarter" ? 20 : 0,
        };
      case "notThird":
        return {
          correct: state.notThird === "not-half",
          points: state.notThird === "not-half" ? 20 : 0,
        };
      case "sorting": {
        const correct = sortItems.every((item) => state.sorting[item.id] === item.bucket);

        return {
          correct,
          points: correct ? 20 : 0,
        };
      }
    }
  }

  function applyQuestionResult(questionId: QuestionId, result: QuestionResult) {
    setResults((previous) => ({
      ...previous,
      [questionId]: result,
    }));

    if (result.correct) {
      sfx.playCorrect();
      setStreak((s) => s + 1);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3500);
    } else {
      sfx.playWrong();
      setStreak(0);
    }
  }

  function chooseSingleAnswer(
    key: "pizza" | "chocolate" | "cake" | "notThird",
    value: string,
  ) {
    if (currentResult) {
      return;
    }

    setShowIncompleteHint(false);
    const nextAnswers = {
      ...answers,
      [key]: value,
    } as AnswersState;

    setAnswers(nextAnswers);
    applyQuestionResult(key, evaluate(key, nextAnswers));
  }

  function goToNextQuestion() {
    sfx.playClick();
    setShowIncompleteHint(false);
    setActiveChocolateLabel(null);

    if (currentQuestionIndex === questionOrder.length - 1) {
      setScreen("results");
      if (totalCorrect === questionOrder.length) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
      return;
    }

    setCurrentQuestionIndex((value) => value + 1);
    setQuestionKey((k) => k + 1);
  }

  function goToPreviousQuestion() {
    sfx.playClick();
    setShowIncompleteHint(false);
    setActiveChocolateLabel(null);

    if (currentQuestionIndex === 0) {
      setScreen("welcome");
      return;
    }

    setCurrentQuestionIndex((value) => value - 1);
    setQuestionKey((k) => k + 1);
  }

  function placeSortingItem(itemId: SortItemId, bucket: SortBucket | null) {
    if (currentResult) {
      return;
    }

    setShowIncompleteHint(false);
    const nextSorting = { ...answers.sorting };

    if (bucket === null) {
      delete nextSorting[itemId];
    } else {
      nextSorting[itemId] = bucket;
    }

    const nextAnswers = {
      ...answers,
      sorting: nextSorting,
    };

    setAnswers(nextAnswers);
    // Auto-eval removed ” user presses "Check Answer" manually.
  }

  function handleCheckSortingAnswer() {
    const allPlaced = sortItems.every((item) => answers.sorting[item.id]);
    if (!allPlaced) {
      setShowIncompleteHint(true);
      return;
    }
    applyQuestionResult("sorting", evaluate("sorting", answers));
  }

  function cycleSortingPlacement(itemId: SortItemId) {
    const currentPlacement = answers.sorting[itemId];

    if (!currentPlacement) {
      placeSortingItem(itemId, "half");
      return;
    }

    if (currentPlacement === "half") {
      placeSortingItem(itemId, "quarter");
      return;
    }

    placeSortingItem(itemId, null);
  }

  function selectChocolateLabel(label: ChocolateLabelValue) {
    if (currentResult) {
      return;
    }

    setShowIncompleteHint(false);
    setActiveChocolateLabel(label);
  }

  function placeChocolateLabel(targetId: "bar-half" | "bar-uneven", label: ChocolateLabelValue | null = activeChocolateLabel) {
    if (currentResult) {
      return;
    }

    if (!label) {
      setShowIncompleteHint(true);
      return;
    }

    setShowIncompleteHint(false);
    const nextAnswers = {
      ...answers,
      chocolate: targetId,
      chocolateLabel: label,
    };
    setAnswers(nextAnswers);
    applyQuestionResult("chocolate", evaluate("chocolate", nextAnswers, label));
  }

  function handleDropChoice(event: DragEvent<HTMLElement>, value: string) {
    event.preventDefault();

    const draggedLabel = event.dataTransfer.getData("text/plain") as ChocolateLabelValue;
    if ((draggedLabel === "1/3" || draggedLabel === "1/2" || draggedLabel === "1/4")
      && (value === "bar-half" || value === "bar-uneven")) {
      placeChocolateLabel(value, draggedLabel);
    }
  }

  function handleSortDrop(event: DragEvent<HTMLDivElement>, bucket: SortBucket | null) {
    event.preventDefault();
    const itemId = event.dataTransfer.getData("text/plain") as SortItemId;

    if (sortItemIds.includes(itemId)) {
      placeSortingItem(itemId, bucket);
    }
  }

  function answerSummary(questionId: QuestionId) {
    switch (questionId) {
      case "pizza": {
        const option = pizzaOptions.find((item) => item.id === answers.pizza);
        return option ? pickText(option.title, language) : t.notAnswered;
      }
      case "chocolate":
        if (answers.chocolate === "bar-half") {
          return language === "en" ? "Chocolate bar with 2 equal parts" : "Cokelat dengan 2 bagian sama besar";
        }
        if (answers.chocolate === "bar-quarter") {
          return language === "en" ? "Chocolate bar with 4 parts" : "Cokelat dengan 4 bagian";
        }
        if (answers.chocolate === "bar-uneven") {
          return language === "en" ? "Chocolate bar with uneven parts" : "Cokelat dengan bagian tidak sama";
        }
        return t.notAnswered;
      case "cake": {
        const option = cakeOptions.find((item) => item.id === answers.cake);
        return option ? option.value : t.notAnswered;
      }
      case "notThird": {
        const option = notThirdOptions.find((item) => item.id === answers.notThird);
        return option ? pickText(option.title, language) : t.notAnswered;
      }
      case "sorting":
        return sortItems
          .map((item) => {
            const placement = answers.sorting[item.id];
            const bucketLabel =
              placement === "half"
                ? "1/2"
                : placement === "quarter"
                  ? "1/4"
                  : language === "en"
                    ? "tray"
                    : "nampan";
            return `${pickText(item.label, language)} ⠙ ${bucketLabel}`;
          })
          .join(", ");
    }
  }

  function correctAnswer(questionId: QuestionId) {
    switch (questionId) {
      case "pizza":
        return language === "en"
          ? "Pizza with 1 slice out of 4 equal slices"
          : "Pizza dengan 1 potong dari 4 bagian yang sama besar";
      case "chocolate":
        return language === "en"
          ? "The bar with 2 equal parts"
          : "Batangan dengan 2 bagian yang sama besar";
      case "cake":
        return "1/4";
      case "notThird":
        return language === "en"
          ? "The shape with unequal pieces"
          : "Bentuk dengan potongan tidak sama besar";
      case "sorting":
        return language === "en"
          ? "Watermelon + Dragon Fruit -> 1/2, Orange + Kiwi -> 1/4"
          : "Semangka + Buah Naga -> 1/2, Jeruk + Kiwi -> 1/4";
    }
  }

  function coachLine() {
    return t.reviewLaterHint;
  }

  function resultFocusLabel(questionId: QuestionId) {
    switch (questionId) {
      case "pizza":
        return "1/4";
      case "chocolate":
        return "1/2";
      case "cake":
        return "1/4";
      case "notThird":
        return language === "en" ? "Not 1/2" : "Bukan 1/2";
      case "sorting":
        return "1/2 + 1/4";
    }
  }

  function resultCardTitle(questionId: QuestionId) {
    switch (questionId) {
      case "pizza":
        return language === "en" ? "Sharing the pizza" : "Membagi pizza";
      case "chocolate":
        return language === "en" ? "Finding the chocolate bar for 1/2" : "Menemukan cokelat untuk 1/2";
      case "cake":
        return language === "en" ? "Naming one cake piece" : "Menamai satu potong kue";
      case "notThird":
        return language === "en" ? "Spotting the shape that is not one-half" : "Mencari bentuk yang bukan setengah";
      case "sorting":
        return language === "en" ? "Sorting the fruit slices" : "Mengelompokkan potongan buah";
    }
  }

  function levelHeaderTitle(questionId: QuestionId) {
    if (questionId === "pizza") {
      return t.pizzaLevelTitle;
    }

    if (questionId === "chocolate") {
      return t.chocolateLevelTitle;
    }

    if (questionId === "cake") {
      return t.cakeLevelTitle;
    }

    if (questionId === "notThird") {
      return t.notHalfLevelTitle;
    }

    return `${t.progress} ${currentQuestionIndex + 1}`;
  }

  function renderPromptText(prompt: string) {
    return prompt.split(/(1\/2|1\/4)/g).map((part, index) => {
      if (part === "1/2" || part === "1/4") {
        return (
          <span key={`${part}-${index}`} className="lesson-fraction-chip">
            {part}
          </span>
        );
      }

      return <span key={`${part}-${index}`}>{part}</span>;
    });
  }

  function getChoiceCardClass(selected: boolean, revealCorrect: boolean, revealWrong: boolean) {
    return `lesson-choice-card${selected ? " lesson-choice-selected" : ""}${revealCorrect ? " lesson-choice-correct" : ""}${revealWrong ? " lesson-choice-wrong" : ""}`;
  }

  function renderQuestionArea() {
    if (currentQuestionId === "pizza") {
      return (
        <div className="grid gap-7 sm:grid-cols-2">
          {pizzaOptions.map((option) => {
            const selected = answers.pizza === option.id;
            const revealCorrect = currentResult?.correct && option.id === "pizza-quarter";
            const revealWrong = currentResult && !currentResult.correct && selected;
            const referenceImage = pizzaReferenceImages[option.id];

            return (
              <button
                type="button"
                key={option.id}
                onClick={() => chooseSingleAnswer("pizza", option.id)}
                disabled={Boolean(currentResult)}
                className={`${getChoiceCardClass(Boolean(selected), Boolean(revealCorrect), Boolean(revealWrong))} lesson-pizza-card group text-left`}
              >
                <div className="lesson-choice-figure relative flex aspect-square items-center justify-center overflow-hidden">
                  {referenceImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={referenceImage.src}
                      alt={pickText(option.title, language)}
                      className={referenceImage.imageClassName}
                    />
                  ) : (
                    <PieSnack
                      label={pickText(option.snack, language)}
                      segments={option.segments}
                      highlighted={option.highlighted}
                      colors={option.colors}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      );
    }

    if (currentQuestionId === "chocolate") {
      const chocolateChoices = [
        {
          id: "bar-uneven",
          widths: [1, 3],
          glossy: false,
        },
        {
          id: "bar-half",
          widths: [1, 1],
          glossy: true,
        },
      ] as const;
      const chocolateLabels: ChocolateLabelValue[] = ["1/3", "1/2", "1/4"];

      return (
        <div className="space-y-8">
          <div className="text-center">
            <p className="text-2xl font-medium tracking-tight text-[#bc3c62] sm:text-[2rem]">{t.chocolateTitle}</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-lg text-stone-800 sm:text-xl">
              <span>{language === "en" ? "Drag the" : "Seret label"}</span>
              <span className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#f4b43a,#ef9b1d)] px-5 py-2 text-2xl font-black text-[#5a3800] shadow-[0_6px_0_#c57e1a,0_12px_20px_rgba(239,155,29,0.22)]">
                1/2
              </span>
              <span>
                {language === "en"
                  ? "label to the chocolate bar with 2 equal parts."
                  : "ke cokelat batangan dengan 2 bagian yang sama besar."}
              </span>
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  const id = "chocolate-instruction";
                  if (tts.isActive(id)) { tts.stop(); return; }
                  const text = language === "en"
                    ? "Drag the one half label to the chocolate bar with 2 equal parts."
                    : "Seret label setengah ke cokelat batangan dengan 2 bagian yang sama besar.";
                  tts.speak(id, text, language === "en" ? "en-US" : "id-ID");
                }}
                className={`inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#ffd9df] text-[#a03b56] shadow-[0_8px_18px_rgba(160,59,86,0.16)] transition hover:-translate-y-0.5${tts.isActive("chocolate-instruction") ? " speaking" : ""}`}
                aria-label={language === "en" ? "Read instruction" : "Bacakan instruksi"}
              >
                {tts.isActive("chocolate-instruction") ? (
                  <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden="true"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 8.5v7a4.49 4.49 0 002.5-3.5zM14 3.23v2.06a6.49 6.49 0 010 13.42v2.06A8.49 8.49 0 0014 3.23z" /></svg>
                )}
              </button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {chocolateChoices.map((choice) => {
              const selected = answers.chocolate === choice.id;
              const revealCorrect = currentResult?.correct && choice.id === "bar-half";
              const revealWrong = currentResult && !currentResult.correct && selected;
              const dropLabel = selected ? answers.chocolateLabel : null;

              return (
                <button
                  type="button"
                  key={choice.id}
                  onClick={() => placeChocolateLabel(choice.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => handleDropChoice(event, choice.id)}
                  disabled={Boolean(currentResult)}
                  className="text-left transition hover:-translate-y-1 disabled:cursor-default disabled:hover:translate-y-0"
                >
                  <ChocolateBar
                    widths={[...choice.widths]}
                    dropLabel={dropLabel}
                    emptyLabel={t.dropHere}
                    selected={selected}
                    revealCorrect={Boolean(revealCorrect)}
                    revealWrong={Boolean(revealWrong)}
                    glossy={choice.glossy}
                  />
                </button>
              );
            })}
          </div>

          <div className="rounded-[2rem] border-2 border-[#efe5d9] bg-[#f8f1e7] p-5 shadow-[0_12px_28px_rgba(145,110,79,0.08)]">
            <div className="flex flex-wrap justify-center gap-4">
              {chocolateLabels.map((label) => {
                const isActive = activeChocolateLabel === label;
                const chipClass =
                  label === "1/3"
                    ? "bg-[linear-gradient(180deg,#bc496b_0%,#a33a5b_100%)] text-white shadow-[0_6px_0_#7f2440]"
                    : label === "1/2"
                      ? "bg-[linear-gradient(180deg,#f4b43a_0%,#ef9b1d_100%)] text-[#5a3800] shadow-[0_6px_0_#c57e1a]"
                      : "bg-[linear-gradient(180deg,#0c8a79_0%,#0a7364_100%)] text-white shadow-[0_6px_0_#07584c]";

                return (
                  <button
                    key={label}
                    type="button"
                    draggable={!currentResult}
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/plain", label);
                      selectChocolateLabel(label);
                    }}
                    onClick={() => selectChocolateLabel(label)}
                    disabled={Boolean(currentResult)}
                    className={`rounded-full px-8 py-4 text-3xl font-black transition ${chipClass} ${isActive ? "ring-4 ring-white/75" : ""} ${currentResult ? "cursor-default opacity-80" : "cursor-grab active:cursor-grabbing hover:-translate-y-0.5"}`}
                    aria-pressed={isActive}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    if (currentQuestionId === "cake") {
      return (
        <div className="grid gap-5 md:grid-cols-3">
          {cakeOptions.map((option) => {
            const selected = answers.cake === option.id;
            const revealCorrect = currentResult?.correct && option.id === "cake-quarter";
            const revealWrong = currentResult && !currentResult.correct && selected;

            return (
              <button
                type="button"
                key={option.id}
                onClick={() => chooseSingleAnswer("cake", option.id)}
                disabled={Boolean(currentResult)}
                className={`${getChoiceCardClass(Boolean(selected), Boolean(revealCorrect), Boolean(revealWrong))} text-left`}
              >
                <div className="lesson-choice-figure mb-5 flex min-h-[14rem] items-center justify-center">
                  <FractionBadge value={option.value} large />
                </div>
                <p className="text-center text-2xl font-black text-stone-800">{pickText(option.title, language)}</p>
                <p className="mt-2 text-center text-sm text-stone-600">{pickText(option.subtitle, language)}</p>
              </button>
            );
          })}
        </div>
      );
    }

    if (currentQuestionId === "notThird") {
      return (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {notThirdOptions.map((option) => {
            const selected = answers.notThird === option.id;
            const revealCorrect = currentResult?.correct && option.id === "not-half";
            const revealWrong = currentResult && !currentResult.correct && selected;

            return (
              <button
                type="button"
                key={option.id}
                onClick={() => chooseSingleAnswer("notThird", option.id)}
                disabled={Boolean(currentResult)}
                className={`${getChoiceCardClass(Boolean(selected), Boolean(revealCorrect), Boolean(revealWrong))} text-left`}
              >
                <div className="lesson-choice-figure mb-5 flex min-h-[14rem] items-center justify-center">
                  <PieSnack
                    label={pickText(option.snack, language)}
                    segments={option.segments}
                    highlighted={option.highlighted}
                    colors={option.colors}
                  />
                </div>
                <p className="text-base font-black text-stone-800">{pickText(option.title, language)}</p>
                <p className="mt-2 text-sm text-stone-600">{pickText(option.subtitle, language)}</p>
              </button>
            );
          })}
        </div>
      );
    }

    const trayItems = sortItems.filter((item) => !answers.sorting[item.id]);
    const halfItems = sortItems.filter((item) => answers.sorting[item.id] === "half");
    const quarterItems = sortItems.filter((item) => answers.sorting[item.id] === "quarter");

    const renderSortCard = (item: SortItem) => (
      <button
        type="button"
        key={item.id}
        draggable={!currentResult}
        onDragStart={(event) => event.dataTransfer.setData("text/plain", item.id)}
        onClick={() => cycleSortingPlacement(item.id)}
        disabled={Boolean(currentResult)}
        className="lesson-sort-card"
      >
        <div className="flex items-center gap-3">
          <PieSnack
            label={pickText(item.label, language)}
            segments={item.segments}
            highlighted={item.highlighted}
            colors={item.colors}
            size="small"
          />
          <div>
            <p className="font-black text-stone-800">{pickText(item.label, language)}</p>
            <p className="text-sm text-stone-600">{pickText(item.snack, language)}</p>
          </div>
        </div>
      </button>
    );

    return (
      <div className="space-y-4">
        <div
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => handleSortDrop(event, null)}
          className="lesson-dropzone"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-stone-500">{t.sortingHint}</p>
            <span className="text-xs font-bold text-stone-500">{t.tapToCycle}</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">{trayItems.map((item) => renderSortCard(item))}</div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {(
            [
              ["half", halfItems, "#34d399", "1/2 basket", "Keranjang 1/2"],
              ["quarter", quarterItems, "#60a5fa", "1/4 basket", "Keranjang 1/4"],
            ] as const
          ).map(([bucket, bucketItems, color, enLabel, idLabel]) => (
            <div
              key={bucket}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleSortDrop(event, bucket)}
              className="min-h-[11rem] rounded-[2rem] border-4 p-4"
              style={{
                borderColor: color,
                background: `linear-gradient(180deg, ${color}18, rgba(255,255,255,0.92))`,
              }}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-black text-stone-800">{language === "en" ? enLabel : idLabel}</h3>
                <FractionBadge value={bucket === "half" ? "1/2" : "1/4"} />
              </div>
              <div className="grid gap-3">{bucketItems.map((item) => renderSortCard(item))}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (screen === "welcome") {
    const chefGreeting = language === "en"
      ? { title: `Hi there! I'm ${pickText(activeChef.name, language)}. Welcome to My Kitchen!`, body: "I'm so excited you're here! Let's have a wonderful time baking yummy treats and solving sweet math puzzles together." }
      : { title: `Halo! Aku ${pickText(activeChef.name, language)}. Selamat Datang di Dapurku!`, body: "Aku senang sekali kamu ada di sini! Ayo bersenang-senang membuat kue lezat dan menyelesaikan teka-teki matematika bersama." };

    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-8 sm:px-6">
        {/* Floating orbs */}
        <div className="floating-orb left-[3%] top-[5%] h-32 w-32 bg-cyan-200/50" />
        <div className="floating-orb right-[5%] top-[12%] h-28 w-28 bg-rose-200/40 [animation-delay:1.2s]" />
        <div className="floating-orb bottom-[10%] left-[8%] h-20 w-20 bg-green-200/40 [animation-delay:2s]" />
        <div className="floating-orb right-[12%] bottom-[15%] h-24 w-24 bg-amber-200/50 [animation-delay:0.8s]" />

        {/* Language switcher - top right */}
        <div className="fixed right-4 top-4 z-50 sm:right-6 sm:top-6">
          <div className="inline-flex items-center rounded-full border border-white/60 bg-white/80 p-1 shadow-lg backdrop-blur-sm">
            <button
              type="button"
              onClick={() => handleLanguageChange("id")}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-bold transition ${
                language === "id" ? "bg-rose-500 text-white shadow-md" : "text-stone-600 hover:bg-white"
              }`}
            >
              <span>🇮🇩</span> ID
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange("en")}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-bold transition ${
                language === "en" ? "bg-rose-500 text-white shadow-md" : "text-stone-600 hover:bg-white"
              }`}
            >
              <span>🇺🇸</span> EN
            </button>
          </div>
        </div>

        {/* Chef image card */}
        <div className="slide-in-up relative z-10 mb-6">
          <div className="relative mx-auto h-[280px] w-[280px] overflow-hidden rounded-[2rem] border-2 border-rose-100 bg-white p-2 shadow-[0_20px_60px_rgba(190,24,93,0.12)] sm:h-[320px] sm:w-[320px]">
            <Image
              src="/chef-albie.png"
              alt={pickText(activeChef.name, language)}
              fill
              sizes="(max-width: 640px) 280px, 320px"
              preload
              className="h-full w-full rounded-[1.6rem] object-cover"
            />
          </div>
          {/* Decorative circles around the card */}
          <div className="absolute -left-4 top-8 h-10 w-10 rounded-full bg-cyan-300/70 shadow-sm" />
          <div className="absolute -right-2 top-1/2 h-8 w-8 rounded-full bg-amber-300/70 shadow-sm" />
        </div>

        {/* Title + audio icon */}
        <div className="fade-in-delayed relative z-10 flex max-w-xl flex-col items-center text-center">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                const id = "chef-greeting";
                if (tts.isActive(id)) { tts.stop(); return; }
                tts.speak(id, chefGreeting.title, language === "en" ? "en-US" : "id-ID");
              }}
              className={`mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-400 transition hover:bg-rose-200 hover:text-rose-500${tts.isActive("chef-greeting") ? " speaking" : ""}`}
              aria-label={language === "en" ? "Read aloud" : "Bacakan"}
            >
              {tts.isActive("chef-greeting") ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 8.5v7a4.49 4.49 0 002.5-3.5zM14 3.23v2.06a6.49 6.49 0 010 13.42v2.06A8.49 8.49 0 0014 3.23z"/></svg>
              )}
            </button>
            <h1 className="text-3xl font-black leading-tight tracking-tight text-rose-700 sm:text-4xl">
              {chefGreeting.title}
            </h1>
          </div>
          <p className="mt-4 max-w-md text-base leading-7 text-stone-500">
            {chefGreeting.body}
          </p>
        </div>

        <div className="fade-in-delayed relative z-10 mt-8 w-full max-w-5xl" style={{ animationDelay: "0.2s" }}>
          <div className="mx-auto max-w-4xl rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-[0_20px_50px_rgba(120,53,75,0.12)] backdrop-blur-sm">
            <div className="flex flex-col gap-2 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-rose-500">{t.chooseChef}</p>
                <p className="mt-1 text-sm text-stone-500">{t.switchHint}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowHowToPlay(true)}
                className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-black text-rose-700 transition hover:-translate-y-0.5 hover:bg-rose-100"
              >
                {language === "en" ? "How to Play" : "Cara Bermain"}
              </button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {chefs.map((chef) => {
                const isActive = chef.id === selectedChef;

                return (
                  <button
                    key={chef.id}
                    type="button"
                    onClick={() => handleChefChange(chef.id)}
                    className={`rounded-[1.8rem] border-2 p-4 text-left transition ${isActive
                      ? "border-rose-400 bg-[linear-gradient(135deg,rgba(251,113,133,0.14),rgba(255,255,255,0.96))] shadow-[0_18px_35px_rgba(190,24,93,0.12)]"
                      : "border-white/70 bg-white/80 hover:-translate-y-1 hover:border-amber-200"
                      }`}
                    aria-pressed={isActive}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className={`inline-flex h-14 w-14 items-center justify-center rounded-[1.3rem] bg-gradient-to-br ${chef.accent} text-3xl shadow-[0_12px_24px_rgba(0,0,0,0.12)]`}>
                        {chef.avatar}
                      </div>
                      {isActive && (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                          {language === "en" ? "Selected" : "Dipilih"}
                        </span>
                      )}
                    </div>
                    <h2 className="mt-4 text-xl font-black text-stone-900">{pickText(chef.name, language)}</h2>
                    <p className="mt-1 text-sm font-black uppercase tracking-[0.14em] text-stone-500">
                      {pickText(chef.badge, language)}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-stone-600">{pickText(chef.cheer, language)}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Feature cards */}
        <div className="fade-in-delayed relative z-10 mt-6 flex justify-center" style={{ animationDelay: "0.25s" }}>
          <FeatureCards language={language} />
        </div>

        {/* Start Adventure button */}
        <div className="fade-in-delayed relative z-10 mt-8 w-full max-w-md px-4" style={{ animationDelay: "0.35s" }}>
          <button
            type="button"
            onClick={startGame}
            className="group flex w-full items-center justify-center gap-3 rounded-[2rem] border-2 border-rose-900/10 bg-gradient-to-b from-rose-700 via-rose-800 to-rose-900 px-8 py-5 text-xl font-black text-white shadow-[0_16px_40px_rgba(136,19,55,0.35),inset_0_1px_0_rgba(255,255,255,0.15)] transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(136,19,55,0.4)]"
          >
            <span>{t.start}</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 transition group-hover:bg-white/30">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </span>
          </button>
        </div>

        {/* Dot indicators */}
        <div className="fade-in-delayed relative z-10 mt-8 flex items-center gap-3" style={{ animationDelay: "0.45s" }}>
          <span className="h-3 w-3 rounded-full bg-rose-300" />
          <span className="h-3.5 w-3.5 rounded-full bg-cyan-300" />
          <span className="h-3 w-3 rounded-full bg-amber-300" />
        </div>

        {showHowToPlay && <HowToPlayModal language={language} onClose={() => setShowHowToPlay(false)} />}
      </main>
    );
  }

  if (screen === "results") {
    return (
      <main className="min-h-screen overflow-hidden bg-[linear-gradient(180deg,#fff9f0_0%,#fff2de_100%)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="floating-orb left-[5%] top-[8%] h-28 w-28 bg-cyan-200/55" />
        <div className="floating-orb right-[8%] top-[18%] h-24 w-24 bg-rose-300/45 [animation-delay:1.3s]" />
        <div className="floating-orb bottom-[7%] right-[18%] h-20 w-20 bg-amber-200/55 [animation-delay:2.2s]" />
        <div className="relative z-10 mx-auto max-w-7xl">
          <nav className="flex flex-col gap-4 rounded-[2rem] border-4 border-orange-100 bg-orange-50 px-5 py-4 shadow-[0_10px_28px_rgba(255,133,161,0.14)] sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div className="flex items-center gap-3 text-pink-600">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-pink-600 shadow-sm">
                <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current" aria-hidden="true">
                  <path d="M4 9a2 2 0 012-2h12a2 2 0 012 2v1H4V9zm0 3h16l-1.2 6.02A2 2 0 0116.84 20H7.16a2 2 0 01-1.96-1.58L4 12zm5.4-9.6a2.8 2.8 0 013.96 0l.64.64.64-.64a2.8 2.8 0 113.96 3.96L16.2 8H7.8L5.44 5.64A2.8 2.8 0 019.4 2.4z" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-black tracking-tight sm:text-2xl">{t.appName}</p>
                <p className="text-sm font-bold text-[#8f4d5b]">{t.summaryTitle}</p>
              </div>
            </div>
            <LanguageSwitcher language={language} onChange={handleLanguageChange} />
          </nav>

          <section className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
            <aside className="flex flex-col gap-6">
              <div className="relative overflow-hidden rounded-[2.2rem] bg-[linear-gradient(160deg,#ffced9_0%,#ff9fb6_100%)] p-7 text-center shadow-[0_18px_42px_rgba(255,133,161,0.25)]">
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/25 blur-2xl" />
                <div className="absolute -bottom-10 -left-8 h-32 w-32 rounded-full bg-[#a03b56]/15 blur-2xl" />
                <p className="relative text-4xl font-black tracking-tight text-[#6c1733] sm:text-5xl">
                  {totalCorrect === questionOrder.length ? t.perfect : t.niceTry}
                </p>
                <p className="relative mt-3 text-base leading-7 text-[#7d3550]">{t.summaryBody}</p>
                <div className="relative mt-6 inline-flex items-end justify-center rounded-full border border-white/60 bg-white/35 px-8 py-4 backdrop-blur-sm">
                  <span className="text-6xl font-black leading-none text-[#a03b56]">{totalCorrect}</span>
                  <span className="mx-2 pb-2 text-2xl font-black text-[#7d3550]">/</span>
                  <span className="pb-2 text-2xl font-black text-[#7d3550]">{questionOrder.length}</span>
                </div>
                <p className="relative mt-3 text-sm font-black uppercase tracking-[0.2em] text-[#7d3550]">
                  {totalScore} {t.score}
                </p>
                <div className="relative mt-5 flex justify-center gap-1.5">
                  {Array.from({ length: questionOrder.length }).map((_, index) => (
                    <svg
                      key={index}
                      viewBox="0 0 24 24"
                      className={`h-8 w-8 ${index < totalCorrect ? "fill-amber-400" : "fill-white/70"}`}
                      aria-hidden="true"
                    >
                      <path d="M12 2l2.83 5.74 6.34.92-4.59 4.47 1.08 6.32L12 16.47 6.34 19.45l1.08-6.32L2.83 8.66l6.34-.92L12 2z" />
                    </svg>
                  ))}
                </div>
              </div>

              <div className="relative rounded-[2rem] border-2 border-white/60 bg-white/85 px-6 pb-6 pt-[4.5rem] text-center shadow-[0_16px_34px_rgba(130,92,52,0.12)]">
                <div className="absolute left-1/2 top-0 h-28 w-28 -translate-x-1/2 -translate-y-1/3 overflow-hidden rounded-full border-4 border-[#fff9f0] bg-white shadow-lg">
                  <Image
                    src="/chef-albie.png"
                    alt={language === "en" ? "Chef Albie cheering for the student" : "Chef Albie menyemangati murid"}
                    fill
                    sizes="112px"
                    className="h-full w-full object-cover"
                  />
                </div>
                <h2 className="text-2xl font-black text-[#0f6e61]">
                  {language === "en" ? '"You finished the kitchen challenge!"' : '"Kamu menyelesaikan tantangan dapur!"'}
                </h2>
                <p className="mt-3 text-base leading-7 text-stone-600">{pickText(activeChef.cheer, language)}</p>
              </div>

              <button
                type="button"
                onClick={replayGame}
                className="rounded-[1.6rem] bg-[linear-gradient(180deg,#98f4dd_0%,#77d3bf_100%)] px-6 py-4 text-base font-black text-[#005144] shadow-[0_8px_0_#4fb39f,0_18px_30px_rgba(119,211,191,0.25)] transition hover:-translate-y-1"
              >
                {t.backToKitchen}
              </button>
            </aside>

            <section className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 px-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-3xl font-black tracking-tight text-stone-900">{t.reviewListTitle}</h3>
                  <p className="mt-1 text-base text-stone-600">{t.summaryBody}</p>
                </div>
                <div className="rounded-full bg-white/75 px-4 py-2 text-sm font-black text-[#8f4d5b] shadow-sm">
                  {totalCorrect}/{questionOrder.length} {language === "en" ? "correct answers" : "jawaban benar"}
                </div>
              </div>

              <div className="space-y-4">
                {questionOrder.map((questionId, index) => {
                  const result = results[questionId];
                  const isCorrect = Boolean(result?.correct);

                  return (
                    <article
                      key={questionId}
                      className={`flex flex-col gap-4 rounded-[1.8rem] border-2 p-5 shadow-[0_14px_30px_rgba(130,92,52,0.1)] sm:flex-row sm:items-start ${isCorrect
                        ? "border-[#98f4dd]/60 bg-white/92"
                        : "border-[#ffd9df] bg-[#fff8fa]"
                        }`}
                    >
                      <div
                        className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-white shadow-sm ${isCorrect ? "bg-[#98f4dd] text-[#005144]" : "bg-[#ffd9df] text-[#8f2a44]"
                          }`}
                      >
                        {isCorrect ? (
                          <svg viewBox="0 0 24 24" className="h-8 w-8 fill-current" aria-hidden="true">
                            <path d="M9 16.2l-3.5-3.5L4 14.2l5 5 11-11-1.5-1.5z" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" className="h-8 w-8 fill-current" aria-hidden="true">
                            <path d="M12 5a7 7 0 015.93 10.72l1.52 1.52A9 9 0 103 12h2a7 7 0 017-7zm1 2v5.59l2.7 2.7-1.4 1.41L11 13.41V7z" />
                          </svg>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <span className="inline-flex w-fit rounded-full bg-[#ffddb6] px-3 py-1 text-sm font-black text-[#643f00]">
                            {t.progress} {index + 1}
                          </span>
                          <span className="text-sm font-black text-[#a03b56]">{resultFocusLabel(questionId)}</span>
                        </div>
                        <h4 className="mt-3 text-xl font-black text-stone-900">{resultCardTitle(questionId)}</h4>
                        <p className="mt-3 rounded-[1.2rem] bg-[#f7f1e8] px-4 py-3 text-sm leading-7 text-stone-600">
                          {pickText(
                            result?.correct
                              ? explanationBank[questionId].correct
                              : explanationBank[questionId].wrong,
                            language,
                          )}
                        </p>
                        <div className="mt-4 grid gap-3 text-sm text-stone-700 sm:grid-cols-2">
                          <p className="rounded-[1rem] bg-white/80 px-4 py-3">
                            <span className="font-black text-stone-900">{t.yourAnswer}: </span>
                            {answerSummary(questionId)}
                          </p>
                          <p className="rounded-[1rem] bg-white/80 px-4 py-3">
                            <span className="font-black text-stone-900">{t.correctAnswer}: </span>
                            {correctAnswer(questionId)}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </section>
        </div>
      </main>
    );
  }

  if (screen === "game") {
    if (currentQuestionId === "chocolate") {
      return (
        <>
          <Confetti active={showConfetti} />
          <main className="flex min-h-screen flex-col bg-[#fff9f0]">
            <CandyLevelHeader
              title={levelHeaderTitle(currentQuestionId)}
              language={language}
              current={currentQuestionIndex + 1}
              total={questionOrder.length}
              score={totalScore}
              streak={streak}
              onBack={goToPreviousQuestion}
              onChangeLanguage={handleLanguageChange}
            />

            <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-10 lg:px-8">
              <div className="grid items-start gap-10 lg:grid-cols-[300px_1fr]">
                <aside className="flex flex-col items-center pt-8 text-center">
                  <div className="relative h-56 w-56 overflow-hidden rounded-full border-[6px] border-[#98f4dd] bg-[#7cd7c1] p-5 shadow-[0_10px_30px_rgba(124,215,193,0.35)]">
                    <Image
                      src="/chef-albie.png"
                      alt={language === "en" ? "Chef Albie" : "Koki Albie"}
                      fill
                      sizes="224px"
                      className="rounded-full object-cover p-5"
                    />
                  </div>
                  <div className="relative mt-7 rounded-[1.3rem] border-2 border-[#dbc0c4] bg-white px-7 py-6 text-[1.05rem] leading-9 text-stone-900 shadow-[0_10px_30px_rgba(145,110,79,0.12)]">
                    <div className="absolute -top-2 left-10 h-5 w-5 rotate-45 border-l-2 border-t-2 border-[#dbc0c4] bg-white" />
                    <p>
                      {t.chocolateCoachBubble}
                      <button
                        type="button"
                        onClick={() => {
                          sfx.playClick();
                          const id = "chocolate-coach";
                          if (tts.isActive(id)) { tts.stop(); return; }
                          tts.speak(id, fractionToWords(t.chocolateCoachBubble.replace(/"/g, ""), language), language === "en" ? "en-US" : "id-ID");
                        }}
                        className={`ml-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#ffd9df] align-middle text-[#a03b56] shadow-sm transition hover:-translate-y-0.5${tts.isActive("chocolate-coach") ? " speaking" : ""}`}
                        aria-label={language === "en" ? "Read coach tip" : "Bacakan tips"}
                      >
                        {tts.isActive("chocolate-coach") ? (
                          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                        ) : (
                          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 8.5v7a4.49 4.49 0 002.5-3.5zM14 3.23v2.06a6.49 6.49 0 010 13.42v2.06A8.49 8.49 0 0014 3.23z" /></svg>
                        )}
                      </button>
                    </p>
                  </div>
                </aside>

                <div className="min-w-0">
                  <div key={questionKey} className="w-full">
                    {renderQuestionArea()}
                  </div>

                  <FeedbackPanel
                    result={currentResult}
                    questionId={currentQuestionId}
                    language={language}
                    chefAvatar={activeChef.avatar}
                    chefName={pickText(activeChef.name, language)}
                  />

                  <div className="mt-8 flex flex-col items-end gap-4">
                    {showIncompleteHint && !currentResult && (
                      <p className="w-full rounded-[1.2rem] bg-amber-100 px-4 py-3 text-sm font-bold text-amber-900">
                        {activeChocolateLabel ? getIncompleteMessage(currentQuestionId) : t.selectLabelFirst}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={goToNextQuestion}
                      disabled={!currentResult}
                      className="inline-flex min-w-[18rem] items-center justify-center gap-3 rounded-[1.2rem] bg-[linear-gradient(180deg,#0d8b78_0%,#0a7565_100%)] px-8 py-5 text-2xl font-black text-white shadow-[0_6px_0_#07584c,0_18px_28px_rgba(10,117,101,0.22)] transition hover:-translate-y-1 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-[0_6px_0_#07584c]"
                    >
                      {currentQuestionIndex === questionOrder.length - 1 ? t.finish : t.nextLevel}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <footer className="border-t-4 border-[#f9e5ac] bg-[#fceec7] py-8">
              <div className="mx-auto max-w-4xl px-8 text-center">
                <p className="text-lg font-bold text-[#845400]">{t.footerBrand}</p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-8 text-[#845400]">
                  <a href="#" className="text-sm font-bold transition hover:opacity-70">{t.privacy}</a>
                  <a href="#" className="text-sm font-bold transition hover:opacity-70">{t.parentsGuide}</a>
                  <a href="#" className="text-sm font-bold transition hover:opacity-70">{t.help}</a>
                </div>
              </div>
            </footer>
          </main>
        </>
      );
    }

    if (currentQuestionId === "cake") {
      return (
        <>
          <Confetti active={showConfetti} />
          <main className="flex min-h-screen flex-col bg-[#fff9f0]">
            <CandyLevelHeader
              title={levelHeaderTitle(currentQuestionId)}
              language={language}
              current={currentQuestionIndex + 1}
              total={questionOrder.length}
              score={totalScore}
              streak={streak}
              onBack={goToPreviousQuestion}
              onChangeLanguage={handleLanguageChange}
            />

            <section className="mx-auto flex w-full max-w-7xl flex-1 items-start justify-center px-4 py-12 lg:px-8">
              <div className="w-full max-w-4xl rounded-[2rem] border-2 border-[#e7e2d9] bg-white px-6 py-10 text-center shadow-[0_8px_30px_-5px_rgba(255,133,161,0.15)] sm:px-10">
                <p className="text-2xl font-medium tracking-tight text-[#bc3c62] sm:text-[2rem]">
                  {t.cakeCardTitle}
                </p>
                <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-[#554245] sm:text-xl">
                  &quot;{pickText(currentQuestion.prompt, language)}&quot;
                </p>

                <div className="mt-10 flex justify-center">
                  <CakeQuarterPreview />
                </div>

                <div className="mt-10 flex flex-wrap justify-center gap-3 sm:gap-4">
                  {cakeOptions.map((option) => {
                    const isSelected = answers.cake === option.id;
                    const isCorrect = currentResult?.correct && option.id === "cake-quarter";
                    const isWrong = currentResult?.correct === false && isSelected;
                    const buttonClass = isCorrect || isSelected
                      ? "bg-[#fb799b] text-white shadow-[0_4px_0_0_#a03b56]"
                      : isWrong
                        ? "bg-[#ffd9df] text-[#81233f] shadow-[0_4px_0_0_#c58a97]"
                        : "bg-[#f3ede4] text-[#1d1b16] shadow-[0_4px_0_0_#e7e2d9]";

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => chooseSingleAnswer("cake", option.id)}
                        disabled={Boolean(currentResult)}
                        className={`min-w-[5.5rem] rounded-[1.2rem] px-7 py-4 text-2xl font-bold transition ${buttonClass} ${currentResult ? "cursor-default" : "hover:-translate-y-0.5"}`}
                      >
                        {option.value}
                      </button>
                    );
                  })}
                </div>

                <FeedbackPanel
                  result={currentResult}
                  questionId={currentQuestionId}
                  language={language}
                  chefAvatar={activeChef.avatar}
                  chefName={pickText(activeChef.name, language)}
                />

                <div className="mt-10 flex justify-center">
                  <button
                    type="button"
                    onClick={goToNextQuestion}
                    disabled={!currentResult}
                    className="inline-flex items-center gap-2 rounded-full bg-[#0a7565] px-10 py-5 text-2xl font-black text-white shadow-[0_4px_0_0_#004d40,0_12px_20px_rgba(10,117,101,0.18)] transition hover:-translate-y-1 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span>{currentQuestionIndex === questionOrder.length - 1 ? t.finish : t.nextLevel}</span>
                    <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current">
                      <path d="M13 5l7 7-7 7-1.41-1.41L16.17 13H4v-2h12.17l-4.58-4.59L13 5z" />
                    </svg>
                  </button>
                </div>
              </div>
            </section>

            <footer className="border-t-4 border-[#f9e5ac] bg-[#f3e5ab] py-12">
              <div className="mx-auto max-w-4xl px-8 text-center">
                <p className="text-lg font-medium text-[#8b4513]">{t.footerBrand}</p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-8 text-[#8b4513]">
                  <a href="#" className="text-sm font-medium opacity-80 transition hover:opacity-100">{t.privacy}</a>
                  <a href="#" className="text-sm font-medium opacity-80 transition hover:opacity-100">{t.parentsGuide}</a>
                  <a href="#" className="text-sm font-medium opacity-80 transition hover:opacity-100">{t.help}</a>
                </div>
              </div>
            </footer>
          </main>
        </>
      );
    }

    if (currentQuestionId === "notThird") {
      return (
        <>
          <Confetti active={showConfetti} />
          <main className="flex min-h-screen flex-col bg-[#fff9f0]">
            <CandyLevelHeader
              title={levelHeaderTitle(currentQuestionId)}
              language={language}
              current={currentQuestionIndex + 1}
              total={questionOrder.length}
              score={totalScore}
              streak={streak}
              onBack={goToPreviousQuestion}
              onChangeLanguage={handleLanguageChange}
            />

            <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8 lg:px-8">
              <div className="rounded-[2rem] border-4 border-[#98f4dd] bg-white px-6 py-10 text-center shadow-[0_8px_20px_-5px_rgba(152,244,221,0.4)]">
                <p className="text-2xl font-medium tracking-tight text-[#bc3c62] sm:text-[2rem]">
                  {t.notHalfCardTitle}
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-lg text-[#554245] sm:text-xl">
                  <button
                    type="button"
                    onClick={() => {
                      sfx.playClick();
                      const id = "notthird-title";
                      if (tts.isActive(id)) { tts.stop(); return; }
                      const text = fractionToWords(`${t.notHalfCardTitle}. ${t.notHalfCardHelper}`, language);
                      tts.speak(id, text, language === "en" ? "en-US" : "id-ID");
                    }}
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#ff85a1] text-[#771b38] shadow-sm transition hover:-translate-y-0.5${tts.isActive("notthird-title") ? " speaking" : ""}`}
                    aria-label={language === "en" ? "Read aloud" : "Bacakan"}
                  >
                    {tts.isActive("notthird-title") ? (
                      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden="true"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 8.5v7a4.49 4.49 0 002.5-3.5zM14 3.23v2.06a6.49 6.49 0 010 13.42v2.06A8.49 8.49 0 0014 3.23z" /></svg>
                    )}
                  </button>
                  <p>{t.notHalfCardHelper}</p>
                </div>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
                {notThirdOptions.map((option) => {
                  const isSelected = answers.notThird === option.id;
                  const isCorrect = currentResult?.correct && option.id === "not-half";
                  const isWrong = currentResult?.correct === false && isSelected;
                  const cardClass = isCorrect
                    ? "border-[#98f4dd] shadow-[0_12px_0_0_#d8f1eb] ring-4 ring-[#98f4dd]/35"
                    : isWrong
                      ? "border-[#ffb1c0] shadow-[0_12px_0_0_#eadadf]"
                      : isSelected
                        ? "border-[#ffd9df] shadow-[0_12px_0_0_#eadadf]"
                        : "border-[#e7e2d9] shadow-[0_12px_0_0_#e7e2d9]";

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => chooseSingleAnswer("notThird", option.id)}
                      disabled={Boolean(currentResult)}
                      className={`flex min-h-[18rem] items-center justify-center rounded-[2rem] border-4 bg-white p-6 transition ${cardClass} ${currentResult ? "cursor-default" : "hover:-translate-y-1 hover:shadow-[0_16px_0_0_#e7e2d9]"}`}
                    >
                      <NotHalfShape optionId={option.id} />
                    </button>
                  );
                })}
              </div>

              <FeedbackPanel
                result={currentResult}
                questionId={currentQuestionId}
                language={language}
                chefAvatar={activeChef.avatar}
                chefName={pickText(activeChef.name, language)}
              />

              <div className="mt-10 flex justify-end">
                <button
                  type="button"
                  onClick={goToNextQuestion}
                  disabled={!currentResult}
                  className="inline-flex items-center gap-2 rounded-[1rem] bg-[#0a7565] px-10 py-4 text-xl font-black text-white shadow-[0_4px_0_0_#004d40,0_12px_20px_rgba(10,117,101,0.18)] transition hover:-translate-y-1 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span>{currentQuestionIndex === questionOrder.length - 1 ? t.finish : t.nextLevel}</span>
                  <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
                    <path d="M13 5l7 7-7 7-1.41-1.41L16.17 13H4v-2h12.17l-4.58-4.59L13 5z" />
                  </svg>
                </button>
              </div>
            </section>

            <footer className="border-t-4 border-[#f9e5ac] bg-[#fceec7] py-8">
              <div className="mx-auto max-w-4xl px-8 text-center">
                <p className="text-lg font-bold text-[#8B4513]">{t.footerBrand}</p>
                <div className="mt-4 flex justify-center gap-6">
                  <a href="#" className="text-sm font-bold text-[#8B4513]/70 transition hover:text-[#8B4513]">{t.privacy}</a>
                  <a href="#" className="text-sm font-bold text-[#8B4513]/70 transition hover:text-[#8B4513]">{t.parentsGuide}</a>
                  <a href="#" className="text-sm font-bold text-[#8B4513]/70 transition hover:text-[#8B4513]">{t.help}</a>
                </div>
              </div>
            </footer>
          </main>
        </>
      );
    }

    if (currentQuestionId === "sorting") {
      const trayItems = sortItems.filter((item) => !answers.sorting[item.id]);
      const halfItems = sortItems.filter((item) => answers.sorting[item.id] === "half");
      const quarterItems = sortItems.filter((item) => answers.sorting[item.id] === "quarter");
      const allPlaced = sortItems.every((item) => answers.sorting[item.id]);

      const fruitImages: Record<SortItemId, string> = {
        watermelon: "https://lh3.googleusercontent.com/aida/ADBb0uh760lPNyT_fotxBIVlcuIL3dNXYgaQ4Shiyke-tFWg9L0b00RTrLH01is-hmr1iQ0nXRqh5Zpu9HbzdHhKdZxNxYnjHETVLS3sctKPE3Ro_-TKycZp0OqoUbrqBzYLjjvoqBDXf-Ybz63BtSAegti4-_tLNny9NNiVONRvFNWVHzrQiNAyvH2suTbq1gE_FIOFJSdNRQsLYNH5r7SC1_2E8GUGCSUYlnwFbaAdswhLh4_o-Ai8RMldQA",
        orange: "https://lh3.googleusercontent.com/aida/ADBb0uiDM7SKxAvIkomoLd6RKkgBskqH36fBCJmSPirpqfAW-3CYzePKQ9Y_GRMUMwr7gfb04iZphJBfhWwevzUC_RloOTQQP61K2jKDWk5NQ3rW4LxrCdUxErn1TAOnVyBXiYfDEOP3AWvXgtCwTypR3Y1yDn5dQgGclN5OEQPCmRD3kwEDax_FDNgANvYWX2EzD41OG4oxaWUYlv9mGIqjWBVAGwA0B3C_pSP8XTq2X6oam5d4rgzzm-zdfA",
        dragonfruit: "https://lh3.googleusercontent.com/aida/ADBb0ujQL8HFsmeaDb-Mc6OQW4GTIZQ5dUYYqgGnDSoAEcfXNGS88lLoubYMblQ8XaUY4-tfBY6oM0cz-_yC1pNKo7AP_owRFjHY1gJDL6U_uYT3secYJzE-gePevlQEDpdT7mLGcYHJD439MEhCaedJS-lhPJVLhTb_yfrmIob9U7h7rx_eb0PnvaEew3FhhYpHfGzrhmjsoXiFQ8WwJBFLz5FzL-DwCX10UCxarNXQfijdizxP0KZj4JCy",
        kiwi: "https://lh3.googleusercontent.com/aida/ADBb0uiKM6tEaD9dF6f6RsdD3Mm2fE7BsRQmJKvf5VVJDQWBwX_AqZNtGVoL7TgCyQ5XowW2V8ZpV4fZEgfo9Q_SU8D7sKgQvtyoQDKCJJg2LiDK_T_wQ9KHDI2cTeeRbIS0KP1qzIvJd5o5TjNi7QR3V0i3e7pKHL2iKi_OSFq7lMil64jFoHJ8gT01cjnvm7d73rmybU1bet8qRiMu4in_ywtvlzpzdF7EXI2hcE0HuHLFb8cYGEuHwnYr3g",
      };

      const renderFruitChip = (item: SortItem, inTray?: boolean) => (
        <button
          key={item.id}
          type="button"
          draggable={!currentResult}
          onDragStart={(e) => e.dataTransfer.setData("text/plain", item.id)}
          onClick={() => !currentResult && cycleSortingPlacement(item.id)}
          disabled={Boolean(currentResult)}
          className={`group relative flex flex-col items-center gap-2 ${
            currentResult ? "cursor-default" : "cursor-grab active:cursor-grabbing"
          }`}
        >
          <div
            className={`relative h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-white shadow-lg transition-transform duration-300 ${
              !currentResult && !inTray ? "group-hover:-translate-y-2" : ""
            }`}
          >
            <Image
              src={fruitImages[item.id]}
              alt={pickText(item.label, language)}
              fill
              sizes="112px"
              className="object-cover"
            />
          </div>
          <span className="rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs font-black text-stone-700 shadow-sm backdrop-blur-sm">
            {pickText(item.label, language)}
          </span>
        </button>
      );

      return (
        <>
          <Confetti active={showConfetti} />
          <main className="lesson-stage min-h-screen">
            <CandyLevelHeader
              title={levelHeaderTitle(currentQuestionId)}
              language={language}
              current={currentQuestionIndex + 1}
              total={questionOrder.length}
              score={totalScore}
              streak={streak}
              onBack={goToPreviousQuestion}
              onChangeLanguage={handleLanguageChange}
            />

            {/* ── Main Workspace ── */}
            <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-10 px-8 py-8 md:gap-16 md:px-16">

              {/* ── Instruction Banner ── */}
              <section className="relative flex w-full items-center gap-6 rounded-[2rem] border-4 border-[#f3ede4] bg-white p-4 shadow-[0_8px_20px_rgba(160,59,86,0.06)] md:p-6">
                <div className="relative h-20 w-20 shrink-0 md:h-24 md:w-24">
                  <Image
                    src="/chef-albie.png"
                    alt={language === "en" ? "Chef Albie" : "Koki Albie"}
                    fill
                    sizes="96px"
                    className="rounded-full border-4 border-[#98f4dd] object-cover shadow-inner"
                  />
                  <div className="absolute -bottom-1 -right-1 rounded-full border border-white bg-[#845400] px-2 py-0.5 text-[10px] font-black text-white shadow-sm">
                    Chef Albie
                  </div>
                </div>
                <div className="flex-1">
                  <h1 className="text-xl font-black leading-tight text-[#a03b56] md:text-2xl">
                    {language === "en"
                      ? "Hi there! Let\u2019s sort these yummy fruity treats into the right trays!"
                      : "Halo! Yuk, kelompokkan irisan buah lezat ini ke nampan yang tepat!"}
                  </h1>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    const id = "sorting-instruction";
                    if (tts.isActive(id)) { tts.stop(); return; }
                    const text = language === "en"
                      ? "Hi there! Let's sort these yummy fruity treats into the right trays!"
                      : "Halo! Yuk, kelompokkan irisan buah lezat ini ke nampan yang tepat!";
                    tts.speak(id, text, language === "en" ? "en-US" : "id-ID");
                  }}
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 border-white bg-[#ffd9df] text-[#a03b56] shadow-[0_4px_0_#a03b56] transition hover:scale-110 active:translate-y-1 active:shadow-none${tts.isActive("sorting-instruction") ? " speaking" : ""}`}
                  aria-label={language === "en" ? "Read instruction" : "Bacakan instruksi"}
                >
                  {tts.isActive("sorting-instruction") ? (
                    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden="true"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 8.5v7a4.49 4.49 0 002.5-3.5zM14 3.23v2.06a6.49 6.49 0 010 13.42v2.06A8.49 8.49 0 0014 3.23z" /></svg>
                  )}
                </button>
              </section>

              {/* ── Sorting Trays ── */}
              <div className="grid flex-1 grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
                {/* 1/2 Tray */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleSortDrop(e, "half")}
                  className="relative flex min-h-[300px] flex-col items-center rounded-[3rem] border-[6px] border-[#ffd9df] bg-[#f9f3ea] p-8 shadow-[inset_0_12px_24px_rgba(0,0,0,0.04),0_12px_30px_rgba(160,59,86,0.05)]"
                >
                  <div className="absolute -top-6 z-10 rounded-full border-4 border-white bg-[#a03b56] px-10 py-3 text-2xl font-black text-white shadow-[0_6px_0_#81233f] md:text-3xl">
                    1/2
                  </div>
                  <div className="flex flex-1 flex-wrap items-center justify-center gap-6 pt-8">
                    {halfItems.length === 0 ? (
                      <div className="flex h-full w-full items-center justify-center rounded-[2rem] border-4 border-dashed border-[#ffb1c0]/50">
                        <p className="text-sm font-black uppercase tracking-widest text-[#a03b56]/30">
                          {language === "en" ? "Drop Here" : "Taruh Di Sini"}
                        </p>
                      </div>
                    ) : (
                      halfItems.map((item) => renderFruitChip(item, true))
                    )}
                  </div>
                </div>

                {/* 1/4 Tray */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleSortDrop(e, "quarter")}
                  className="relative flex min-h-[300px] flex-col items-center rounded-[3rem] border-[6px] border-[#98f4dd] bg-[#f9f3ea] p-8 shadow-[inset_0_12px_24px_rgba(0,0,0,0.04),0_12px_30px_rgba(0,107,90,0.05)]"
                >
                  <div className="absolute -top-6 z-10 rounded-full border-4 border-white bg-[#006b5a] px-10 py-3 text-2xl font-black text-white shadow-[0_6px_0_#004d40] md:text-3xl">
                    1/4
                  </div>
                  <div className="flex flex-1 flex-wrap items-center justify-center gap-6 pt-8">
                    {quarterItems.length === 0 ? (
                      <div className="flex h-full w-full items-center justify-center rounded-[2rem] border-4 border-dashed border-[#7cd7c1]/50">
                        <p className="text-sm font-black uppercase tracking-widest text-[#006b5a]/30">
                          {language === "en" ? "Drop Here" : "Taruh Di Sini"}
                        </p>
                      </div>
                    ) : (
                      quarterItems.map((item) => renderFruitChip(item, true))
                    )}
                  </div>
                </div>
              </div>

              {/* ── Items Tray ── */}
              <section className="w-full">
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleSortDrop(e, null)}
                  className="relative flex min-h-[160px] flex-wrap items-center justify-center gap-10 rounded-[3rem] border-[6px] border-white bg-white/80 p-8 shadow-[0_20px_50px_rgba(160,59,86,0.08)] backdrop-blur-xl"
                >
                  <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-[#e7e2d9] px-6 py-2 text-sm font-black tracking-wide text-[#554245] shadow-sm">
                    {language === "en" ? "Drag items from here" : "Seret dari sini"}
                  </div>
                  {trayItems.length === 0 ? (
                    <p className="text-sm font-black text-stone-400">
                      {language === "en" ? "All items placed! \ud83c\udf89" : "Semua sudah dikelompokkan! \ud83c\udf89"}
                    </p>
                  ) : (
                    trayItems.map((item) => renderFruitChip(item))
                  )}
                </div>

                {/* Incomplete hint */}
                {showIncompleteHint && !currentResult && (
                  <p className="mt-4 rounded-[1.2rem] bg-amber-100 px-4 py-3 text-center text-sm font-bold text-amber-900">
                    {t.incompleteSorting}
                  </p>
                )}

                {/* Feedback panel */}
                <FeedbackPanel
                  result={currentResult}
                  questionId={currentQuestionId}
                  language={language}
                  chefAvatar={activeChef.avatar}
                  chefName={pickText(activeChef.name, language)}
                />

                {/* Buttons row */}
                <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center mb-8">
                  {!currentResult && (
                    <button
                      type="button"
                      onClick={() => setAnswers((prev) => ({ ...prev, sorting: {} }))}
                      className="lesson-secondary-action"
                    >
                      {language === "en" ? "Reset" : "Ulangi"}
                    </button>
                  )}
                  {!currentResult ? (
                    <button
                      type="button"
                      onClick={handleCheckSortingAnswer}
                      disabled={!allPlaced}
                      className="lesson-primary-action flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {language === "en" ? "Check Answer" : "Cek Jawaban"}
                      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                        <path d="M9 16.2l-3.5-3.5L4 14.2l5 5 11-11-1.5-1.5z" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={goToNextQuestion}
                      className="lesson-primary-action flex items-center gap-2"
                    >
                      {currentQuestionIndex === questionOrder.length - 1 ? t.finish : t.nextLevel}
                      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                        <path d="M13 5l7 7-7 7-1.41-1.41L16.17 13H4v-2h12.17l-4.58-4.59L13 5z" />
                      </svg>
                    </button>
                  )}
                </div>
              </section>
            </div>

            {/* Decorative blobs */}
            <div className="pointer-events-none fixed -left-20 top-40 -z-10 h-64 w-64 rounded-full bg-[#ffd9df]/10 blur-3xl" />
            <div className="pointer-events-none fixed -right-20 bottom-40 -z-10 h-80 w-80 rounded-full bg-[#98f4dd]/10 blur-3xl" />

            <footer className="mt-auto w-full border-t-4 border-[#f9e5ac] bg-[#fceec7] py-8">
              <div className="mx-auto flex max-w-4xl flex-col gap-3 px-8 text-center">
                <p className="font-black text-[#845400]">{t.footerBrand}</p>
                <div className="flex justify-center gap-6">
                  <a href="#" className="text-sm font-black text-[#845400]/70 transition hover:text-[#845400]">{t.privacy}</a>
                  <a href="#" className="text-sm font-black text-[#845400]/70 transition hover:text-[#845400]">{t.parentsGuide}</a>
                  <a href="#" className="text-sm font-black text-[#845400]/70 transition hover:text-[#845400]">{t.help}</a>
                </div>
              </div>
            </footer>
          </main>
        </>
      );
    }

    return (
      <>
        <Confetti active={showConfetti} />
        <main className="lesson-stage min-h-screen">
          {currentQuestionId === "pizza" ? (
            <CandyLevelHeader
              title={levelHeaderTitle(currentQuestionId)}
              language={language}
              current={currentQuestionIndex + 1}
              total={questionOrder.length}
              score={totalScore}
              streak={streak}
              onBack={goToPreviousQuestion}
              onChangeLanguage={handleLanguageChange}
            />
          ) : (
            <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-4 pb-4 pt-6 sm:px-6 lg:px-8">
              <button
                type="button"
                onClick={goToPreviousQuestion}
                className="lesson-icon-button"
                aria-label={t.back}
              >
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
              <div className="min-w-[16rem] flex-1">
                <LessonProgressBar
                  current={currentQuestionIndex}
                  total={questionOrder.length}
                  marker={activeChef.avatar}
                />
              </div>
              <button
                type="button"
                onClick={() => handleLanguageChange(language === "en" ? "id" : "en")}
                className="lesson-pill lesson-pill-primary"
                aria-label={t.chooseLanguage}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M12 3a15.3 15.3 0 014 9 15.3 15.3 0 01-4 9 15.3 15.3 0 01-4-9 15.3 15.3 0 014-9z" />
                </svg>
                <span>ID/EN</span>
              </button>
              <StreakBadge streak={streak} />
              <div className="lesson-pill">
                {t.progress} {currentQuestionIndex + 1}/{questionOrder.length}
              </div>
            </header>
          )}

          <section
            key={questionKey}
            className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-4 pt-8 pb-10 sm:px-6 sm:pt-10 lg:px-8"
          >
            <div className="w-full max-w-3xl text-center">
              <div className="flex items-start justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    if (tts.isActive("question-prompt")) {
                      tts.stop();
                    } else {
                      const langCode = language === "en" ? "en-US" : "id-ID";
                      const promptText = fractionToWords(pickText(currentQuestion.prompt, language), language);
                      const helperText = fractionToWords(pickText(currentQuestion.helper, language), language);
                      tts.speak("question-prompt", `${promptText}. ${helperText}`, langCode);
                    }
                  }}
                  className={`lesson-audio-button mt-1${tts.isActive("question-prompt") ? " speaking" : ""}`}
                  aria-label={tts.isActive("question-prompt")
                    ? (language === "en" ? "Stop" : "Berhenti")
                    : (language === "en" ? "Read question aloud" : "Bacakan pertanyaan")}
                >
                  {tts.isActive("question-prompt") ? (
                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 8.5v7a4.49 4.49 0 002.5-3.5zM14 3.23v2.06a6.49 6.49 0 010 13.42v2.06A8.49 8.49 0 0014 3.23z" />
                    </svg>
                  )}
                </button>
                <h1 className="lesson-title">{renderPromptText(pickText(currentQuestion.prompt, language))}</h1>
              </div>
              <p className="lesson-subtitle">{pickText(currentQuestion.helper, language)}</p>
            </div>

            <div className="mt-10 w-full max-w-4xl">{renderQuestionArea()}</div>

            <div className="mt-6 w-full max-w-4xl">
              <FeedbackPanel
                result={currentResult}
                questionId={currentQuestionId}
                language={language}
                chefAvatar={activeChef.avatar}
                chefName={pickText(activeChef.name, language)}
              />
            </div>

            <div className="mt-8 flex w-full max-w-4xl flex-col gap-4">
              {showIncompleteHint && !currentResult && (
                <p className="rounded-[1.2rem] bg-amber-100 px-4 py-3 text-sm font-bold text-amber-900">
                  {getIncompleteMessage(currentQuestionId)}
                </p>
              )}

              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                {currentQuestionId === "sorting" && !currentResult ? (
                  <button
                    type="button"
                    onClick={() => setAnswers((previous) => ({ ...previous, sorting: {} }))}
                    disabled={Boolean(currentResult)}
                    className="lesson-secondary-action"
                  >
                    {t.resetTray}
                  </button>
                ) : (
                  <div />
                )}
                <button
                  type="button"
                  onClick={goToNextQuestion}
                  disabled={!currentResult}
                  className="lesson-primary-action"
                >
                  {currentQuestionIndex === questionOrder.length - 1 ? t.finish : t.nextLevel}
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                    <path d="M13 5l7 7-7 7-1.41-1.41L16.17 13H4v-2h12.17l-4.58-4.59L13 5z" />
                  </svg>
                </button>
              </div>
            </div>
          </section>

          <footer className="lesson-footer">
            <p className="text-center text-sm font-bold text-[#8a5300]">{t.footerBrand}</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-6 text-[#8a5300]">
              <a href="#" className="transition hover:opacity-70">{t.privacy}</a>
              <a href="#" className="transition hover:opacity-70">{t.parentsGuide}</a>
              <a href="#" className="transition hover:opacity-70">{t.help}</a>
            </div>
          </footer>
        </main>
      </>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-5 sm:px-6">
      <div className="floating-orb left-[4%] top-[7%] h-28 w-28 bg-rose-300/50" />
      <div className="floating-orb right-[7%] top-[20%] h-24 w-24 bg-cyan-200/55 [animation-delay:1.5s]" />
      <div className="floating-orb bottom-[7%] left-[12%] h-20 w-20 bg-amber-200/65 [animation-delay:2.4s]" />
      <section className="panel-shell relative z-10 mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-6xl flex-col rounded-[2.6rem] px-5 py-5 sm:px-8 sm:py-6">
        <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-3 rounded-full bg-stone-900 px-4 py-2 text-sm font-black text-white">
              <span>{activeChef.avatar}</span>
              <span>{t.appName}</span>
            </div>
            <p className="mt-3 text-base text-stone-700">{pickText(activeChef.name, language)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full bg-white/85 px-4 py-3 text-sm font-black text-stone-700 shadow-sm">
              {t.progress}: {currentQuestionIndex + 1}/{questionOrder.length}
            </div>
            <div className="rounded-full bg-white/85 px-4 py-3 text-sm font-black text-stone-700 shadow-sm">
              {t.score}: {totalScore}
            </div>
            <LanguageSwitcher language={language} onChange={handleLanguageChange} />
          </div>
        </header>

        <div className="grid flex-1 gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <aside className="rounded-[2.2rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,247,237,0.88))] p-5 shadow-[0_20px_40px_rgba(0,0,0,0.08)]">
            <div
              className={`inline-flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[1.4rem] bg-gradient-to-br ${activeChef.accent} text-4xl shadow-[0_16px_30px_rgba(0,0,0,0.14)]`}
            >
              {activeChef.avatar}
            </div>
            <p className="mt-4 text-sm font-black uppercase tracking-[0.2em] text-stone-500">{t.smartCoach}</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-stone-900">
              {pickText(currentQuestion.prompt, language)}
            </h1>
            <p className="mt-3 text-base leading-7 text-stone-700">{pickText(currentQuestion.helper, language)}</p>

            <div className="mt-6 space-y-3">
              {questionOrder.map((questionId, index) => {
                const result = results[questionId];
                const isActive = questionId === currentQuestionId;

                return (
                  <div
                    key={questionId}
                    className={`rounded-[1.5rem] border-[3px] px-4 py-3 ${isActive
                        ? "border-stone-900 bg-stone-900 text-white"
                        : "border-white/70 bg-white/80 text-stone-700"
                      }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-black">
                        {t.question} {index + 1}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${result
                            ? result.correct
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-rose-100 text-rose-700"
                            : isActive
                              ? "bg-white/15 text-white"
                              : "bg-stone-100 text-stone-500"
                          }`}
                      >
                        {result ? (result.correct ? t.correctChip : t.wrongChip) : `${index + 1}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="coach-note mt-6 rounded-[1.8rem] p-4">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-stone-500">{t.smartCoach}</p>
              <p className="mt-2 text-base leading-7 text-stone-700">{coachLine()}</p>
              {showIncompleteHint && !currentResult && (
                <p className="mt-4 rounded-[1.2rem] bg-amber-100 px-4 py-3 text-sm font-bold text-amber-900">
                  {getIncompleteMessage(currentQuestionId)}
                </p>
              )}
            </div>
          </aside>

          <section className="flex flex-col rounded-[2.2rem] bg-white/82 p-5 shadow-[0_22px_45px_rgba(0,0,0,0.08)]">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-black text-amber-900">
                <span>⭐</span>
                <span>
                  {t.progress} {currentQuestionIndex + 1}
                </span>
              </div>
              {currentResult?.correct && (
                <div className="star-burst text-2xl" aria-hidden="true">
                  <span>⭐</span>
                  <span>ⓨ</span>
                  <span>⭐</span>
                </div>
              )}
            </div>

            <div className="flex-1">{renderQuestionArea()}</div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {currentQuestionId === "sorting" && (
                <button
                  type="button"
                  onClick={() => setAnswers((previous) => ({ ...previous, sorting: {} }))}
                  disabled={Boolean(currentResult)}
                  className="rounded-[1.4rem] bg-stone-100 px-5 py-3 text-sm font-black text-stone-700 transition hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t.resetTray}
                </button>
              )}
              <div className="sm:ml-auto">
                <button
                  type="button"
                  onClick={goToNextQuestion}
                  disabled={!currentResult}
                  className="w-full rounded-[1.6rem] bg-stone-900 px-7 py-4 text-base font-black text-white shadow-[0_24px_45px_rgba(28,25,23,0.24)] transition hover:-translate-y-1 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {currentQuestionIndex === questionOrder.length - 1 ? t.finish : t.nextLevel}
                </button>
              </div>
            </div>
          </section>
        </div>

        <footer className="mt-5 text-center text-sm font-bold text-stone-600">{t.footerNote}</footer>
      </section>
    </main>
  );
}
