"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Wand2, RefreshCw, ChevronLeft, Download, Stars } from "lucide-react";
import { toPng } from "html-to-image";
import { RetroCard } from "../components/RetroCard";

type QuoteCard = {
  quote: string;
  author?: string;
  message?: string;
};

const retroImages = [
  "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1438109491414-7198515b166b?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1465101162946-4377e57745c3?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=900&q=80"
];

export default function CreatePage() {
  const [mode, setMode] = useState<"select" | "ai" | "retro">("select");
  const [mood, setMood] = useState("");
  const [card, setCard] = useState<QuoteCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [retroText, setRetroText] = useState("");
  const [selectedImage, setSelectedImage] = useState(retroImages[0]);
  const [showResultModal, setShowResultModal] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null); // live preview
  const modalCardRef = useRef<HTMLDivElement>(null); // capture target

  useEffect(() => {
    if (showResultModal) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [showResultModal]);

  const submitMood = async () => {
    if (!mood.trim()) {
      setError("오늘 기분을 간단히 적어주세요.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "생성에 실패했어요.");
      }
      setCard(data);
      setShowResultModal(true);
    } catch (err) {
      console.error(err);
      setError("카드를 만들지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = async () => {
    const target = modalCardRef.current ?? cardRef.current;
    if (!target) return;
    try {
      const dataUrl = await toPng(target, { cacheBust: true });
      const link = document.createElement("a");
      link.download = "card.png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
      setError("이미지를 저장하지 못했어요. 다시 시도해주세요.");
    }
  };

  const shareKakao = () => {
    const Kakao = (typeof window !== "undefined" && (window as any).Kakao) || null;
    if (!Kakao || !Kakao.isInitialized?.()) {
      alert("카카오 SDK가 설정되지 않았습니다.");
      return;
    }
    const description = mode === "ai" ? card?.quote ?? "" : retroText;
    const imageUrl = mode === "retro" ? selectedImage : retroImages[0];
    Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title: "따뜻한 하루 카드",
        description: description || "마음을 담은 카드",
        imageUrl,
        link: {
          mobileWebUrl: typeof window !== "undefined" ? window.location.href : "https://kakao.com",
          webUrl: typeof window !== "undefined" ? window.location.href : "https://kakao.com"
        }
      }
    });
  };

  const Header = () => (
    <header className="flex items-center gap-3">
      {mode !== "select" && (
        <button
          onClick={() => setMode("select")}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
          aria-label="뒤로가기"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-inner">
        <Sparkles className="h-6 w-6 text-rose-500" />
      </div>
      <div>
        <p className="text-sm text-slate-500">
          {mode === "select" ? "어떤 방식으로 만들까요?" : "카드를 완성해보세요"}
        </p>
        <h1 className="text-xl font-semibold text-slate-900">글귀 생성</h1>
      </div>
    </header>
  );

  const Modal = () =>
    showResultModal ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
        <div className="w-full max-w-md space-y-4">
          <div
            ref={modalCardRef}
            className="relative aspect-[3/4] overflow-hidden rounded-3xl shadow-2xl"
            style={{
              backgroundImage:
                mode === "retro"
                  ? `url(${selectedImage})`
                  : "linear-gradient(135deg, #fce1e5 0%, #e4edff 50%, #fdf5ff 100%)",
              backgroundSize: "cover",
              backgroundPosition: "center"
            }}
          >
            {mode === "retro" && <div className="absolute inset-0 bg-black/18" />}
            <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
              {mode === "retro" ? (
                <RetroCard text={retroText || "여기에 문구를 적어주세요"} />
              ) : (
                <div className="relative space-y-3 text-left">
                  <p className="text-sm uppercase tracking-[0.25em] text-slate-600/80">AI 카드</p>
                  <p className="font-display text-lg leading-loose text-slate-800 break-keep">
                    {card?.quote ?? "기분을 적으면 3~4문장 이상의 따뜻한 에세이를 만들어드려요."}
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={downloadImage}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:shadow-md"
            >
              이미지 저장
            </button>
            <button
              onClick={shareKakao}
              className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 transition hover:shadow-md"
            >
              카톡 공유
            </button>
            <button
              onClick={() => setShowResultModal(false)}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:shadow-md"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-blush via-white to-mist pb-24">
      <div className="mx-auto flex max-w-xl flex-col gap-6 px-5 pb-6 pt-10">
        <Header />

        {mode === "select" && (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setMode("ai")}
              className="group relative flex h-44 flex-col items-start justify-between overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-br from-rose-100 via-amber-50 to-sky-50 p-5 text-left shadow-lg transition hover:shadow-xl"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.9),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(255,210,230,0.7),transparent_30%)]" />
              <div className="relative flex items-center gap-2 text-rose-600">
                <Wand2 className="h-5 w-5" />
                <span className="text-xs font-semibold">AI 기분 카드</span>
              </div>
              <p className="relative text-base font-semibold text-slate-900 leading-snug">
                기분을 적으면
                <br />
                AI가 따뜻한 글귀를
                <br />
                만들어줘요
              </p>
            </button>

            <button
              onClick={() => setMode("retro")}
              className="group relative flex h-44 flex-col items-start justify-between overflow-hidden rounded-3xl border border-white/80 bg-gradient-to-br from-[#2b2d42] via-[#1d1f33] to-[#0c1020] p-5 text-left shadow-2xl transition hover:shadow-[0_20px_40px_-24px_rgba(0,0,0,0.7)]"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.1),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(255,0,140,0.2),transparent_30%),radial-gradient(circle_at_60%_80%,rgba(0,200,255,0.2),transparent_30%)]" />
              <div className="relative flex items-center gap-2 text-amber-200">
                <Stars className="h-5 w-5" />
                <span className="text-xs font-semibold">내 맘대로 꾸미기</span>
              </div>
              <p className="relative text-base font-semibold text-white leading-snug drop-shadow-[0_6px_18px_rgba(0,0,0,0.5)]">
                화려한 꽃 배경과
                <br />
                레트로 폰트로
                <br />
                마음껏 꾸며보세요
              </p>
            </button>
          </div>
        )}

        {mode === "ai" && (
          <section className="flex flex-col gap-4">
            <div className="space-y-3">
              <label className="text-sm text-slate-600" htmlFor="mood">
                오늘의 기분을 적어주세요
              </label>
              <textarea
                id="mood"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                placeholder="예) 마음이 조금 허전하고 포근한 위로가 필요해요."
                className="w-full rounded-2xl border border-slate-200 bg-white/80 p-4 text-base shadow-inner outline-none transition focus:border-rose-200 focus:ring-2 focus:ring-rose-100"
                rows={3}
              />
              <button
                onClick={submitMood}
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-400 to-amber-300 px-4 py-3 text-base font-semibold text-white shadow-md transition hover:shadow-lg disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    만드는 중이에요...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-5 w-5" />
                    AI로 만들기
                  </>
                )}
              </button>
              {error && (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>
              )}
            </div>
          </section>
        )}

        {mode === "retro" && (
          <section className="flex flex-col gap-6">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-800">배경 선택</p>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {retroImages.map((img) => (
                  <button
                    key={img}
                    onClick={() => setSelectedImage(img)}
                    className={`relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl border transition hover:scale-[1.03] ${
                      selectedImage === img ? "border-rose-400 ring-2 ring-rose-100" : "border-slate-200"
                    }`}
                    style={{
                      backgroundImage: `url(${img})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center"
                    }}
                  >
                    <span className="sr-only">배경 선택</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-600" htmlFor="retro-text">
                카드에 넣을 문구
              </label>
              <textarea
                id="retro-text"
                value={retroText}
                onChange={(e) => setRetroText(e.target.value)}
                placeholder="여기에 문구를 적어주세요"
                className="w-full rounded-2xl border border-slate-200 bg-white/85 p-4 text-base shadow-inner outline-none transition focus:border-amber-200 focus:ring-2 focus:ring-amber-100"
                rows={4}
              />
            </div>

            <button
              onClick={() => setShowResultModal(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ff6b6b] via-[#fbbf24] to-[#3b82f6] px-4 py-3 text-base font-semibold text-white shadow-lg transition hover:shadow-xl"
            >
              카드 완성하기
            </button>
          </section>
        )}
      </div>
      <Modal />
    </main>
  );
}

