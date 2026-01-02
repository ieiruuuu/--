"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // 👈 페이지 이동을 위해 추가
import { User, Sparkles, UserPlus, UserCheck, Home as HomeIcon, PlusSquare } from "lucide-react";
import { auth, db } from "./firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { FeedCard, FeedData } from "./components/FeedCard";

// 카드 데이터 타입 정의
type CardData = FeedData & {
  authorUid?: string;
  // likes, comments 등은 FeedCard 내부에서 Firestore 기준으로 관리
};

export default function Home() {
  const router = useRouter(); // 👈 라우터 사용 설정
  
  const [cards, setCards] = useState<CardData[]>([]);
  const [followingList, setFollowingList] = useState<string[]>([]);
  const [myName, setMyName] = useState("");
  const [myUid, setMyUid] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false); // 로딩 상태 (깜빡임 방지용)

  // 1. 로그인 체크 및 데이터 로딩
  useEffect(() => {
    const init = async () => {
      // 🔒 로그인 체크 (보호 기능)
      const storedUser = localStorage.getItem("currentUser");
      if (!storedUser) {
        router.push("/login"); // 로그인 안 했으면 로그인 페이지로 강제 이동
        return; 
      }

      const parsedUser = JSON.parse(storedUser);
      setMyUid(parsedUser.uid || null);

      // 3. 내 프로필 정보 가져오기 (팔로우 목록 확인용)
      const savedProfile = localStorage.getItem("userProfile");
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        setMyName(profile.name || "");
        setFollowingList(profile.followingList || []);
      }

      // 2. Firestore에서 피드 가져오기
      try {
        const feedQuery = query(
          collection(db, "feeds"),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(feedQuery);

        if (!snap.empty) {
          const list: CardData[] = snap.docs.map((docSnap) => {
            const data = docSnap.data() as any;
            return {
              id: docSnap.id,
              text: data.content || "",
              background: data.imageUrl || undefined,
              date: data.createdAt?.toDate
                ? data.createdAt.toDate().toLocaleDateString()
                : "",
              author: data.authorName || "알 수 없음",
              authorUid: data.authorUid || "",
              authorImg:
                data.authorImg ||
                "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
            };
          });
          setCards(list);
        } else {
          // 데이터가 없으면 예시 데이터 보여주기
          const dummyData: CardData[] = [
            {
              id: "demo1",
              text: "가끔은 멈춰 서서 하늘을 바라보는 여유가 필요해요.\n당신의 오늘이 구름처럼 가볍기를.",
              background:
                "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=600&q=80",
              date: "2024.12.18",
              author: "감성지기",
              authorUid: "",
              authorImg:
                "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
            }
          ];
          setCards(dummyData);
        }
      } catch (err) {
        console.error("피드 불러오기 실패:", err);
      } finally {
        // 로그인 및 데이터 로딩 완료
        setIsLoaded(true);
      }
    };

    init();
  }, [router]);

  // 팔로우 토글 기능
  const toggleFollow = (authorName: string) => {
    let newList;
    if (followingList.includes(authorName)) {
      newList = followingList.filter(name => name !== authorName);
    } else {
      newList = [...followingList, authorName];
    }
    setFollowingList(newList);

    const savedProfile = localStorage.getItem("userProfile");
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      profile.followingList = newList;
      profile.following = newList.length;
      localStorage.setItem("userProfile", JSON.stringify(profile));
    }
  };

  // 로딩 중이거나 로그인이 안 된 상태면 아무것도 안 보여줌 (깜빡임 방지)
  if (!isLoaded) return null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-blue-50 pb-28">
      <div className="mx-auto max-w-xl px-5 pt-10">
        
        {/* 상단 헤더 */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              오늘의 위로 <Sparkles className="h-5 w-5 text-yellow-400 fill-yellow-400" />
            </h1>
            <p className="text-sm text-slate-500 mt-1">다른 사람들의 감성을 만나보세요</p>
          </div>
        </header>

        {/* 피드 리스트 */}
        <div className="space-y-10">
          {cards.map((card) => {
            const isMine = card.authorUid && myUid && card.authorUid === myUid;
            const isFollowing = followingList.includes(card.author);

            return (
              <div key={card.id} className="relative">
                {/* 팔로우 버튼은 상단에 별도 오버레이로 유지 */}
                <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-end p-3">
                  {!isMine && (
                    <button
                      onClick={() => toggleFollow(card.author)}
                      className={`pointer-events-auto flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold transition-all backdrop-blur-md ${
                        isFollowing
                          ? "bg-white/20 text-slate-900 border border-white/40"
                          : "bg-rose-500 text-white shadow-sm hover:bg-rose-600"
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="h-3 w-3" /> 팔로잉
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-3 w-3" /> 팔로우
                        </>
                      )}
                    </button>
                  )}
                </div>

                <FeedCard data={card} />
              </div>
            );
          })}
        </div>
      </div>

      {/* 하단 네비게이션 바 (통일됨) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-100 bg-white/80 pb-6 pt-3 backdrop-blur-lg">
        <div className="mx-auto flex max-w-xl justify-around">
          <Link href="/" className="flex flex-col items-center gap-1 text-rose-500">
            <HomeIcon className="h-6 w-6 fill-rose-100" />
            <span className="text-[10px] font-bold">홈</span>
          </Link>
          <Link href="/create" className="flex flex-col items-center gap-1 text-slate-400 hover:text-rose-400 transition">
            <PlusSquare className="h-6 w-6" />
            <span className="text-[10px] font-medium">글귀 생성</span>
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