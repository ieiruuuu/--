"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // 👈 페이지 이동을 위해 추가
import { Heart, MessageCircle, User, Sparkles, UserPlus, UserCheck, Home as HomeIcon, PlusSquare } from "lucide-react";

// 카드 데이터 타입 정의
type CardData = {
  id: string;
  text: string;
  background?: string;
  date: string;
  author: string;
  authorImg: string;
  likes: number;
  isLiked: boolean;
  comments: { id: string; text: string; author: string }[];
};

export default function Home() {
  const router = useRouter(); // 👈 라우터 사용 설정
  
  const [cards, setCards] = useState<CardData[]>([]);
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});
  const [followingList, setFollowingList] = useState<string[]>([]);
  const [myName, setMyName] = useState("나(Me)");
  const [isLoaded, setIsLoaded] = useState(false); // 로딩 상태 (깜빡임 방지용)

  // 1. 로그인 체크 및 데이터 로딩
  useEffect(() => {
    // 🔒 로그인 체크 (보호 기능)
    const user = localStorage.getItem("currentUser");
    if (!user) {
      router.push("/login"); // 로그인 안 했으면 로그인 페이지로 강제 이동
      return; 
    }

    // 로그인 확인되면 화면 보여주기 시작
    setIsLoaded(true);

    // 2. 저장된 카드 가져오기
    const savedCards = localStorage.getItem("moodCards");
    if (savedCards) {
      setCards(JSON.parse(savedCards));
    } else {
      // 데이터가 없으면 예시 데이터 보여주기
      const dummyData = [{
        id: "demo1",
        text: "가끔은 멈춰 서서 하늘을 바라보는 여유가 필요해요.\n당신의 오늘이 구름처럼 가볍기를.",
        background: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=600&q=80",
        date: "2024.12.18",
        author: "감성지기",
        authorImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
        likes: 42,
        isLiked: false,
        comments: []
      }];
      setCards(dummyData);
      localStorage.setItem("moodCards", JSON.stringify(dummyData));
    }

    // 3. 내 프로필 정보 가져오기 (팔로우 목록 확인용)
    const savedProfile = localStorage.getItem("userProfile");
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      setMyName(profile.name);
      setFollowingList(profile.followingList || []);
    }
  }, []);

  // 좋아요 기능
  const toggleLike = (id: string) => {
    const newCards = cards.map(card => {
      if (card.id === id) {
        return {
          ...card,
          likes: card.isLiked ? card.likes - 1 : card.likes + 1,
          isLiked: !card.isLiked
        };
      }
      return card;
    });
    setCards(newCards);
    localStorage.setItem("moodCards", JSON.stringify(newCards));
  };

  // 댓글 기능
  const addComment = (id: string) => {
    const text = commentInputs[id];
    if (!text?.trim()) return;

    const newCards = cards.map(card => {
      if (card.id === id) {
        return {
          ...card,
          comments: [...card.comments, { id: Date.now().toString(), text, author: myName }]
        };
      }
      return card;
    });
    setCards(newCards);
    setCommentInputs({ ...commentInputs, [id]: "" });
    localStorage.setItem("moodCards", JSON.stringify(newCards));
  };

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
            const isFollowing = followingList.includes(card.author);
            const isMe = card.author === myName;

            return (
              <article key={card.id} className="group relative overflow-hidden rounded-[2rem] bg-white shadow-xl shadow-slate-200/50 transition duration-300 hover:-translate-y-1 hover:shadow-2xl">
                
                {/* 작성자 정보 & 팔로우 버튼 */}
                <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
                  <div className="flex items-center gap-3">
                    <img src={card.authorImg} alt="profile" className="h-10 w-10 rounded-full border-2 border-white/80 bg-white/20 backdrop-blur-md" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white drop-shadow-md text-sm">{card.author}</p>
                        
                        {/* 내가 쓴 글이 아닐 때만 팔로우 버튼 표시 */}
                        {!isMe && (
                          <button 
                            onClick={() => toggleFollow(card.author)}
                            className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold transition-all backdrop-blur-md ${
                              isFollowing 
                                ? "bg-white/20 text-white border border-white/40" 
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
                      <p className="text-[10px] text-white/80 font-medium">{card.date}</p>
                    </div>
                  </div>
                </div>

                {/* 카드 이미지 & 텍스트 */}
                <div
                  className="aspect-[3/4] w-full bg-cover bg-center flex items-center justify-center p-8 text-center relative"
                  style={{
                    backgroundImage: card.background ? `url(${card.background})` : "linear-gradient(135deg, #fce1e5 0%, #e4edff 100%)"
                  }}
                >
                  {card.background && <div className="absolute inset-0 bg-black/20 transition group-hover:bg-black/30" />}
                  <p className={`relative z-10 text-xl font-bold leading-relaxed break-keep whitespace-pre-wrap ${card.background ? 'text-white drop-shadow-lg' : 'text-slate-800'}`}>
                    {card.text}
                  </p>
                </div>

                {/* 하단 액션 버튼 */}
                <div className="bg-white p-5">
                  <div className="flex items-center gap-6 mb-4">
                    <button onClick={() => toggleLike(card.id)} className="flex items-center gap-2 transition active:scale-90">
                      <div className={`p-2 rounded-full ${card.isLiked ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400'}`}>
                        <Heart className={`h-6 w-6 ${card.isLiked ? 'fill-current' : ''}`} />
                      </div>
                      <span className={`font-bold text-lg ${card.isLiked ? 'text-rose-500' : 'text-slate-500'}`}>{card.likes}</span>
                    </button>
                    
                    <div className="flex items-center gap-2 text-slate-500">
                      <div className="p-2 rounded-full bg-slate-50">
                        <MessageCircle className="h-6 w-6" />
                      </div>
                      <span className="font-bold text-lg">{card.comments.length}</span>
                    </div>
                  </div>

                  {/* 댓글 입력창 */}
                  <div className="relative">
                    <input
                      value={commentInputs[card.id] || ""}
                      onChange={(e) => setCommentInputs({ ...commentInputs, [card.id]: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-4 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-rose-100 transition"
                      placeholder="따뜻한 댓글을 남겨주세요..."
                      onKeyDown={(e) => e.key === 'Enter' && addComment(card.id)}
                    />
                    <button 
                      onClick={() => addComment(card.id)}
                      className="absolute right-2 top-2 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-700"
                    >
                      게시
                    </button>
                  </div>

                  {/* 최신 댓글 */}
                  {card.comments.length > 0 && (
                    <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                      {card.comments.slice(-2).map((c) => (
                        <div key={c.id} className="text-sm flex gap-2">
                          <span className="font-bold text-slate-900 shrink-0">{c.author}</span>
                          <span className="text-slate-600 line-clamp-1">{c.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>
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