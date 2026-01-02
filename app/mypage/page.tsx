"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // 👈 페이지 이동용
import {
  ChevronLeft,
  Trash2,
  Heart,
  Camera,
  Share2,
  Edit3,
  Home as HomeIcon,
  PlusSquare,
  User,
  LogOut
} from "lucide-react";
import { auth, db } from "../firebase";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where
} from "firebase/firestore";
import { FeedCard, FeedData } from "../components/FeedCard";

// 데이터 타입 정의
type CardData = {
  id: string;
  text: string;
  background?: string;
  date: string;
  author: string;
  authorImg?: string;
  likes: number;
};

type UserProfile = {
  name: string; // 닉네임
  bio: string; // 프로필 문구
  followers: number;
  following: number;
  profileImg: string;
};

export default function MyPage() {
  const router = useRouter(); // 👈 라우터 초기화

  const [myCards, setMyCards] = useState<CardData[]>([]);
  const [isEditing, setIsEditing] = useState(false); // 프로필 편집 모달
  const [isLoading, setIsLoading] = useState(true); // 프로필/카드 로딩 상태
  const [feedsEmpty, setFeedsEmpty] = useState(false); // 내 피드 데이터 비어있는지 여부
  const [selectedFeedId, setSelectedFeedId] = useState<string | null>(null); // 상세 보기용 선택된 피드 ID
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    bio: "오늘의 기분을 기록합니다.",
    followers: 0,
    following: 0,
    profileImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
  });

  // 편집용 상태 (모달)
  const [editNickname, setEditNickname] = useState("");
  const [editProfileMessage, setEditProfileMessage] = useState("");
  const [editRealName, setEditRealName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [feedLikeCounts, setFeedLikeCounts] = useState<{ [feedId: string]: number }>({});

  // 총 좋아요 수 계산 (useMemo로 최적화)
  const totalReceivedLikes = useMemo(() => {
    return Object.values(feedLikeCounts).reduce((acc, count) => acc + count, 0);
  }, [feedLikeCounts]);

  useEffect(() => {
    const loadProfileAndCards = async () => {
      try {
        const currentUser = auth.currentUser;
        let currentNickname = "";
        let profileImg = "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix";

        if (currentUser) {
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const data = userSnap.data() as any;
            const nickname = data.nickname || "";
            const profileMessage = data.profileMessage || "오늘의 기분을 기록합니다.";
            const realName = data.realName || "";
            const birthDate: string | undefined = data.birthDate;
            profileImg = data.profileImg || profileImg;

            currentNickname = nickname;

            setProfile({
              name: nickname,
              bio: profileMessage,
              followers: 0,
              following: 0,
              profileImg
            });

            // 편집용 초기값 세팅
            setEditNickname(nickname);
            setEditProfileMessage(profileMessage);
            setEditRealName(realName);

            if (birthDate) {
              const [y, m, d] = birthDate.split("-");
              setBirthYear(y || "");
              setBirthMonth(m ? String(parseInt(m, 10)) : "");
              setBirthDay(d ? String(parseInt(d, 10)) : "");
            }
          }
        }

        // 내 카드 불러오기 (Firestore feeds 컬렉션에서)
        if (currentUser) {
          console.log("현재 로그인한 유저 UID:", currentUser.uid);
          const feedsRef = collection(db, "feeds");
          const q = query(
            feedsRef,
            where("authorUid", "==", currentUser.uid),
            orderBy("createdAt", "desc")
          );
          console.log("검색 쿼리 시작함");

          try {
            const snaps = await getDocs(q);
            console.log("가져온 문서 개수:", snaps.size);

            if (snaps.size === 0) {
              setFeedsEmpty(true);
              setMyCards([]);
            } else {
              setFeedsEmpty(false);
              const myPosts: CardData[] = snaps.docs.map((snap) => {
                const data = snap.data() as any;
                return {
                  id: snap.id,
                  text: data.content || "",
                  background: data.imageUrl || undefined,
                  date: data.createdAt?.toDate
                    ? data.createdAt.toDate().toLocaleDateString()
                    : "",
                  author: data.authorName || currentNickname || "",
                  authorImg:
                    data.authorImg ||
                    profileImg ||
                    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
                  likes: data.likes || 0
                };
              });

              setMyCards(myPosts);
            }
          } catch (error) {
            console.error("에러 발생:", error);
          }
        }
      } catch (err) {
        console.error("마이페이지 데이터 로드 중 오류:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileAndCards();
  }, []);

  // 각 게시물의 좋아요 수 실시간 구독
  useEffect(() => {
    if (myCards.length === 0) return;

    const unsubscribes: (() => void)[] = [];

    myCards.forEach((card) => {
      const likesRef = collection(db, "feeds", card.id, "likes");
      const unsub = onSnapshot(likesRef, (snap) => {
        setFeedLikeCounts((prev) => ({
          ...prev,
          [card.id]: snap.size
        }));
      });
      unsubscribes.push(unsub);
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [myCards]);

  // 상세 모달이 열릴 때 선택한 게시물 위치로 스크롤
  useEffect(() => {
    if (!selectedFeedId) return;
    // DOM 렌더링 완료 후 스크롤
    setTimeout(() => {
      const el = document.getElementById(`feed-${selectedFeedId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  }, [selectedFeedId]);

  // 카드 삭제
  const deleteCard = (id: string) => {
    if (!confirm("정말 이 카드를 삭제할까요?")) return;
    // Firestore에서 삭제
    deleteDoc(doc(db, "feeds", id))
      .then(() => {
        setMyCards((prev) => prev.filter((card) => card.id !== id));
      })
      .catch((err) => {
        console.error("카드 삭제 실패:", err);
        alert("카드를 삭제하지 못했어요. 잠시 후 다시 시도해주세요.");
      });
  };

  // 이미지 업로드 (아직 Firestore 저장 X, 로컬 프로필 이미지용)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setProfile((prev) => ({ ...prev, profileImg: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // 프로필 저장 (모달에서)
  const handleSaveProfile = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (!editNickname.trim()) {
      alert("닉네임을 입력해주세요.");
      return;
    }

    if (!birthYear || !birthMonth || !birthDay) {
      alert("생년월일을 모두 선택해주세요.");
      return;
    }

    const birthDate = `${birthYear}-${birthMonth.padStart(2, "0")}-${birthDay.padStart(2, "0")}`;

    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        nickname: editNickname.trim(),
        profileMessage: editProfileMessage.trim() || "오늘의 기분을 기록합니다.",
        realName: editRealName.trim(),
        birthDate
      });

      // 화면 상태 업데이트
      const oldName = profile.name;
      const newName = editNickname.trim();
      const newMessage = editProfileMessage.trim() || "오늘의 기분을 기록합니다.";

      setProfile((prev) => ({
        ...prev,
        name: newName,
        bio: newMessage
      }));

      // 내 카드의 author 이름도 함께 변경 (현재 화면 상태만)
      setMyCards((prev) =>
        prev.map((card) =>
          card.author === oldName ? { ...card, author: newName } : card
        )
      );

      alert("프로필이 업데이트되었습니다! ✅");
      setIsEditing(false);
    } catch (err) {
      console.error("프로필 업데이트 실패:", err);
      alert("프로필 저장 중 오류가 발생했습니다.");
    }
  };

  const handleShareProfile = () => { alert("📢 프로필 공유 기능은 추후 업데이트 예정입니다!"); };

  // ✨ 로그아웃 기능 (핵심!)
  const handleLogout = () => {
    if (confirm("정말 로그아웃 하시겠습니까?")) {
      localStorage.removeItem("currentUser"); // 로그인 정보 삭제
      router.push("/login"); // 로그인 페이지로 이동
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-blue-50 pb-20">
      <div className="mx-auto max-w-xl">
        
        {/* 상단 헤더 */}
        <header className="sticky top-0 z-50 flex items-center justify-between bg-white/60 px-5 py-4 backdrop-blur-md border-b border-white/20">
          <Link href="/" className="rounded-full bg-white/50 p-2 text-slate-700 transition hover:bg-white">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          {isLoading ? (
            <div className="h-5 w-24 rounded-full bg-slate-200 animate-pulse" />
          ) : (
            <h1 className="text-lg font-bold text-slate-900 drop-shadow-sm">
              {profile.name || "알 수 없음"}
            </h1>
          )}
          <div className="w-10 flex justify-end">
            {/* ✨ 로그아웃 버튼 */}
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-rose-500 transition p-1"
              aria-label="로그아웃"
            >
              <LogOut className="h-6 w-6" />
            </button>
          </div>
        </header>

        {/* 프로필 섹션 */}
        <section className="px-6 py-8">
          <div className="flex items-center justify-between gap-6 mb-6">
            <div className="relative">
              <img
                src={profile.profileImg}
                alt="profile"
                className="h-24 w-24 rounded-full border-4 border-white bg-slate-100 object-cover shadow-lg"
              />
              {isEditing && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                    accept="image/*"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 rounded-full bg-slate-800 p-2 text-white shadow-md hover:bg-slate-700"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
            <div className="flex flex-1 justify-around text-center">
              <div><p className="text-xl font-bold text-slate-900">{myCards.length}</p><p className="text-xs text-slate-500 font-medium">게시물</p></div>
              <div><p className="text-xl font-bold text-slate-900">{profile.followers}</p><p className="text-xs text-slate-500 font-medium">팔로워</p></div>
              <div><p className="text-xl font-bold text-slate-900">{profile.following}</p><p className="text-xs text-slate-500 font-medium">팔로잉</p></div>
            </div>
          </div>
          <div className="space-y-1 pl-1 mb-6">
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-5 w-32 rounded-full bg-slate-200 animate-pulse" />
                <div className="h-4 w-52 rounded-full bg-slate-200 animate-pulse" />
              </div>
            ) : (
              <>
                <h2 className="text-lg font-bold text-slate-900">
                  {profile.name || "알 수 없음"}
                </h2>
                <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                  {profile.bio || "오늘의 기분을 기록합니다."}
                </p>
              </>
            )}
          </div>
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setIsEditing(true)}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-200 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-300"
            >
              <Edit3 className="h-4 w-4" /> 프로필 편집
            </button>
            <button
              onClick={handleShareProfile}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-200 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-300"
            >
              <Share2 className="h-4 w-4" /> 프로필 공유
            </button>
          </div>
          <div className="flex items-center justify-center gap-2 rounded-2xl bg-white/60 px-4 py-3 text-sm text-rose-600 font-bold shadow-sm border border-rose-100">
            <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
            <span>지금까지 총 {totalReceivedLikes}개의 위로를 받았어요!</span>
          </div>
        </section>

        {/* 내 카드 리스트 */}
        <div className="border-t border-slate-200/60 bg-white/30 pt-1 min-h-[500px]">
          {feedsEmpty ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center px-6">
              <p>데이터가 0개입니다. (컬렉션 이름이나 필드명을 확인하세요)</p>
            </div>
          ) : myCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <p>아직 작성한 카드가 없어요.</p>
              <Link
                href="/create"
                className="mt-4 rounded-full bg-rose-500 px-6 py-2 text-sm font-bold text-white shadow-lg hover:bg-rose-600"
              >
                첫 카드 만들기
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5">
              {myCards.map((card) => (
                <div
                  key={card.id}
                  className="group relative aspect-square bg-slate-100 overflow-hidden cursor-pointer"
                  onClick={() => setSelectedFeedId(card.id)}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-110"
                    style={{
                      backgroundImage: card.background
                        ? `url(${card.background})`
                        : "linear-gradient(135deg, #fce1e5 0%, #e4edff 100%)"
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 transition group-hover:opacity-100 flex flex-col items-center justify-center p-2 text-center backdrop-blur-[2px]">
                    <div className="flex items-center gap-1 text-white text-sm font-bold mb-2">
                      <Heart className="w-4 h-4 fill-white" /> {card.likes}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCard(card.id);
                      }}
                      className="rounded-full bg-white/20 p-2 text-white hover:bg-rose-500 hover:text-white transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 상세 보기 모달 */}
      {selectedFeedId && (
        <div className="fixed inset-0 z-[9999] bg-gradient-to-b from-rose-50 via-white to-blue-50 overflow-y-auto">
          <div className="mx-auto max-w-xl px-5 pt-10 pb-28">
            {/* 모달 헤더 (홈 화면과 동일한 스타일) */}
            <header className="mb-8 flex items-center gap-3">
              <button
                onClick={() => setSelectedFeedId(null)}
                className="rounded-full bg-white/50 p-2 text-slate-700 transition hover:bg-white"
                aria-label="뒤로가기"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <div>
                <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                  내 게시물
                </h1>
                <p className="text-sm text-slate-500 mt-1">내가 작성한 감성 카드들</p>
              </div>
            </header>

            {/* 피드 리스트 (홈 화면과 동일한 간격 및 FeedCard 사용) */}
            <div className="space-y-10">
              {myCards.map((card) => (
                <div
                  key={card.id}
                  id={`feed-${card.id}`}
                  className="relative"
                >
                  <FeedCard data={card as FeedData} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 프로필 편집 모달 */}
      {isEditing && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-6">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-lg font-bold text-slate-900">프로필 편집</h2>
            <div className="space-y-4">
              {/* 닉네임 */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">닉네임</label>
                <input
                  type="text"
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
                />
              </div>
              {/* 프로필 문구 */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">프로필 문구</label>
                <textarea
                  value={editProfileMessage}
                  onChange={(e) => setEditProfileMessage(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 resize-none"
                  placeholder="오늘의 기분을 기록합니다."
                />
              </div>
              {/* 본명 */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">본명</label>
                <input
                  type="text"
                  value={editRealName}
                  onChange={(e) => setEditRealName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
                />
              </div>
              {/* 생년월일 */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">생년월일</label>
                <div className="flex gap-2">
                  {/* 년 */}
                  <select
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
                  >
                    <option value="">년</option>
                    {Array.from({ length: new Date().getFullYear() - 1949 }, (_, i) => {
                      const year = new Date().getFullYear() - i;
                      return (
                        <option key={year} value={year.toString()}>
                          {year}년
                        </option>
                      );
                    })}
                  </select>
                  {/* 월 */}
                  <select
                    value={birthMonth}
                    onChange={(e) => setBirthMonth(e.target.value)}
                    className="w-20 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
                  >
                    <option value="">월</option>
                    {Array.from({ length: 12 }, (_, i) => {
                      const month = i + 1;
                      return (
                        <option key={month} value={month.toString()}>
                          {month}월
                        </option>
                      );
                    })}
                  </select>
                  {/* 일 */}
                  <select
                    value={birthDay}
                    onChange={(e) => setBirthDay(e.target.value)}
                    className="w-20 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
                  >
                    <option value="">일</option>
                    {Array.from({ length: 31 }, (_, i) => {
                      const day = i + 1;
                      return (
                        <option key={day} value={day.toString()}>
                          {day}일
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setIsEditing(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                취소
              </button>
              <button
                onClick={handleSaveProfile}
                className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-600"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 하단 네비게이션 바 */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-100 bg-white/80 pb-6 pt-3 backdrop-blur-lg">
        <div className="mx-auto flex max-w-xl justify-around">
          <Link href="/" className="flex flex-col items-center gap-1 text-slate-400 hover:text-rose-400 transition">
            <HomeIcon className="h-6 w-6" />
            <span className="text-[10px] font-medium">홈</span>
          </Link>
          <Link href="/create" className="flex flex-col items-center gap-1 text-slate-400 hover:text-rose-400 transition">
            <PlusSquare className="h-6 w-6" />
            <span className="text-[10px] font-medium">글귀 생성</span>
          </Link>
          <Link href="/mypage" className="flex flex-col items-center gap-1 text-rose-500">
            <User className="h-6 w-6 fill-rose-100" />
            <span className="text-[10px] font-bold">마이페이지</span>
          </Link>
        </div>
      </nav>
    </main>
  );
}