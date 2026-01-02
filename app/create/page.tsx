"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Wand2, Stars, Share2, Upload, X, Home as HomeIcon, PlusSquare, User } from "lucide-react";
import { auth, db } from "../firebase";
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";

// AI 카드용 랜덤 꽃 이미지 목록
const AI_FLOWER_IMAGES: string[] = [
  "https://images.unsplash.com/photo-1490750967868-88dd44867c80?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1507290439931-a861b5a38200?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1477414348463-c0eb7f1359b6?auto=format&fit=crop&w=900&q=80"
];

// 카드 디자인 컴포넌트
type RetroCardProps = { text: string; background?: string; isAiMode?: boolean };
function RetroCard({ text, background, isAiMode }: RetroCardProps) {
  // AI 모드일 때 한 번만 랜덤 이미지 선택
  const randomAiImage = useMemo(
    () =>
      AI_FLOWER_IMAGES[Math.floor(Math.random() * AI_FLOWER_IMAGES.length)],
    []
  );

  const [imgError, setImgError] = useState(false);

  const photoSrc = isAiMode ? randomAiImage : background;
  const hasPhotoBackground = !!photoSrc && !imgError;

  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl shadow-2xl border border-white/40 flex items-center justify-center text-center p-6 bg-gradient-to-br from-rose-50 via-amber-50 to-sky-50">
      {/* 배경 이미지 (사진) */}
      {hasPhotoBackground && (
        <img
          src={photoSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setImgError(true)} // 로드 실패 시 사진 사용 중단
        />
      )}

      {/* 어두운 오버레이 (사진 배경일 때 가독성 확보) */}
      {hasPhotoBackground && <div className="absolute inset-0 bg-black/40" />}

      {/* 내용 */}
      <div className="relative z-10 w-full">
        <p
          className={`font-semibold text-lg leading-relaxed break-keep whitespace-pre-wrap ${
            hasPhotoBackground ? "text-white drop-shadow-md" : "text-slate-800"
          }`}
        >
          {text || "내용이 없습니다."}
        </p>
      </div>
    </div>
  );
}

const retroImages = [
  "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1499346030926-9a72daac6c63?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1504198266287-1659872e6590?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1465101162946-4377e57745c3?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1490750967868-58cb75069ed6?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1493514789931-586cb221d7a7?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1555505019-8c3f1c96c9b9?auto=format&fit=crop&w=600&q=80",
];

type CardData = {
  id: string;
  text: string;
  background?: string;
  date: string;
  author: string;
  authorUid?: string;
  authorImg: string;
  likes: number;
  isLiked: boolean;
  comments: any[];
};

export default function CreatePage() {
  const router = useRouter();
  const [mode, setMode] = useState<"select" | "ai" | "retro">("select");
  const [mood, setMood] = useState("");
  const [generatedQuote, setGeneratedQuote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retroText, setRetroText] = useState("");
  const [selectedImage, setSelectedImage] = useState(retroImages[0]);
  const [showResultModal, setShowResultModal] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = showResultModal ? "hidden" : "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [showResultModal]);

  const submitMood = async () => {
    if (!mood.trim()) { setError("오늘 기분을 간단히 적어주세요."); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mood }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "생성 실패");
      setGeneratedQuote(data.quote); setShowResultModal(true);
    } catch (err) { console.error(err); setError("카드를 만들지 못했어요. 잠시 후 다시 시도해주세요."); } finally { setLoading(false); }
  };

  const handlePostToFeed = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("로그인이 필요합니다.");
      router.push("/login");
      return;
    }

    // 1. Firestore에서 최신 닉네임 가져오기
    let authorName = "이름 없음";
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data() as any;
        authorName = data.nickname || data.name || "이름 없음";
      }
    } catch (e) {
      console.error("작성자 정보 불러오기 실패:", e);
    }

    // 2. 카드 내용 및 이미지 URL 설정
    const content = mode === "retro" ? retroText : generatedQuote;
    const imageUrl =
      mode === "retro"
        ? selectedImage
        : AI_FLOWER_IMAGES[Math.floor(Math.random() * AI_FLOWER_IMAGES.length)];

    if (!content.trim()) {
      alert("카드 내용이 비어 있어요.");
      return;
    }

    try {
      await addDoc(collection(db, "feeds"), {
        authorUid: user.uid,
        authorName: authorName,
        content,
        imageUrl,
        createdAt: serverTimestamp()
      });

      alert("피드에 성공적으로 게시되었습니다! 🎉");
      router.push("/");
    } catch (e) {
      console.error("게시물 업로드 실패:", e);
      alert("게시물 업로드 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  const Modal = () => {
    if (!showResultModal) return null;
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
        <div className="w-full max-w-md space-y-5 animate-in fade-in zoom-in duration-300">
          <div ref={cardRef}><RetroCard text={mode === "retro" ? retroText : generatedQuote} background={mode === "retro" ? selectedImage : undefined} isAiMode={mode === 'ai'} /></div>
          <div className="grid grid-cols-3 gap-3">
            <button onClick={() => setShowResultModal(false)} className="flex items-center justify-center gap-1 rounded-xl bg-slate-700 py-3 text-sm font-bold text-white transition hover:bg-slate-600"><X className="h-4 w-4" /> 닫기</button>
            <button onClick={() => alert("🚧 카카오톡 공유 기능은 추후 업데이트 예정입니다!")} className="flex items-center justify-center gap-1 rounded-xl bg-[#FEE500] py-3 text-sm font-bold text-[#191919] transition hover:bg-[#FDD835]"><Share2 className="h-4 w-4" /> 카톡 공유</button>
            <button onClick={handlePostToFeed} className="flex items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-pink-300 to-purple-400 py-3 text-sm font-bold text-white shadow-md transition hover:scale-105 hover:shadow-lg"><Upload className="h-4 w-4" /> 게시물 올리기</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    // ✨ pb-32: 하단 네비게이션 공간 확보
    // ✨ min-h-screen: 화면 전체 높이 사용
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-rose-50 via-white to-blue-50 pb-32">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-5 pt-10">
        
        {/* 상단 헤더 */}
        <header className="flex items-center gap-3">
          {mode !== "select" && <button onClick={() => setMode("select")} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:bg-slate-50"><ChevronLeft className="h-5 w-5" /></button>}
          <h1 className="text-xl font-bold text-slate-900">감성 카드 만들기</h1>
        </header>

        {/* ✨ 버튼 선택 화면: 세로 배치 & 중앙 정렬 적용 */}
        {mode === "select" && (
          <div className="flex flex-1 flex-col justify-center gap-6 pb-10">
            <button onClick={() => setMode("ai")} className="relative h-48 w-full overflow-hidden rounded-3xl bg-gradient-to-br from-rose-100 to-amber-50 p-6 text-left shadow-lg transition hover:scale-[1.02] border border-white/50 group">
              <div className="flex items-start justify-between">
                <div>
                  <Wand2 className="mb-3 h-10 w-10 text-rose-500" />
                  <h3 className="text-xl font-bold text-slate-900">AI 기분 카드</h3>
                  <p className="text-sm text-slate-600 mt-1">오늘 기분을 말하면<br/>AI가 위로해줘요</p>
                </div>
                {/* 장식용 아이콘 */}
                <Wand2 className="h-24 w-24 text-rose-500/10 absolute -bottom-4 -right-4 group-hover:scale-110 transition" />
              </div>
            </button>
            
            <button onClick={() => setMode("retro")} className="relative h-48 w-full overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-left shadow-lg transition hover:scale-[1.02] border border-white/10 group">
              <div className="flex items-start justify-between">
                <div>
                  <Stars className="mb-3 h-10 w-10 text-yellow-400" />
                  <h3 className="text-xl font-bold text-white">내 맘대로 꾸미기</h3>
                  <p className="text-sm text-slate-300 mt-1">예쁜 배경에<br/>직접 글을 써봐요</p>
                </div>
                {/* 장식용 아이콘 */}
                <Stars className="h-24 w-24 text-yellow-400/10 absolute -bottom-4 -right-4 group-hover:scale-110 transition" />
              </div>
            </button>
          </div>
        )}

        {/* AI 모드 화면 */}
        {mode === "ai" && (
          <div className="flex-1 flex flex-col space-y-4 animate-in slide-in-from-right duration-300">
            <textarea value={mood} onChange={(e) => setMood(e.target.value)} placeholder="지금 어떤 기분이신가요?" className="w-full h-48 rounded-2xl border border-rose-200 bg-white/50 p-4 text-lg focus:outline-none focus:ring-2 focus:ring-rose-200 resize-none" />
            <button onClick={submitMood} disabled={loading} className="w-full rounded-2xl bg-gradient-to-r from-rose-400 to-rose-500 py-4 font-bold text-white shadow-lg disabled:opacity-50 transition hover:scale-[1.02]">{loading ? "AI가 고민중..." : "카드 만들기"}</button>
          </div>
        )}

        {/* 꾸미기 모드 화면 */}
        {mode === "retro" && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300 pb-10">
            <div className="grid grid-cols-6 gap-2">
              {retroImages.map((img) => <button key={img} onClick={() => setSelectedImage(img)} className={`aspect-square w-full rounded-xl bg-cover bg-center border-2 transition-all ${selectedImage === img ? 'border-rose-500 scale-105 shadow-md z-10' : 'border-transparent opacity-70 hover:opacity-100'}`} style={{ backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} />)}
            </div>
            <textarea value={retroText} onChange={(e) => setRetroText(e.target.value)} placeholder="여기에 문구를 입력하세요" className="w-full h-32 rounded-2xl border border-rose-200 bg-white/80 p-4 text-lg focus:outline-none focus:ring-2 focus:ring-rose-200 placeholder:text-slate-400" />
            <button onClick={() => setShowResultModal(true)} className="w-full rounded-2xl bg-gradient-to-r from-rose-400 to-orange-300 py-4 font-bold text-white shadow-lg transition hover:scale-[1.02] hover:shadow-xl">완성하기</button>
          </div>
        )}
      </div>
      <Modal />

      {/* 하단 네비게이션 바 */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-100 bg-white/80 pb-6 pt-3 backdrop-blur-lg">
        <div className="mx-auto flex max-w-xl justify-around">
          <Link href="/" className="flex flex-col items-center gap-1 text-slate-400 hover:text-rose-400 transition">
            <HomeIcon className="h-6 w-6" />
            <span className="text-[10px] font-medium">홈</span>
          </Link>
          <Link href="/create" className="flex flex-col items-center gap-1 text-rose-500">
            <PlusSquare className="h-6 w-6 fill-rose-100" />
            <span className="text-[10px] font-bold">글귀 생성</span>
          </Link>
          <Link href="/mypage" className="flex flex-col items-center gap-1 text-slate-400 hover:text-rose-400 transition">
            <User className="h-6 w-6" />
            <span className="text-[10px] font-medium">마이페이지</span>
          </Link>
        </div>
      </nav>
    </main>
  );
}