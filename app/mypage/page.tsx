"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // 👈 페이지 이동용
import { ChevronLeft, Trash2, Heart, Check, X, Camera, Share2, Edit3, Home as HomeIcon, PlusSquare, User, LogOut } from "lucide-react";

// 데이터 타입 정의
type CardData = { id: string; text: string; background?: string; date: string; author: string; authorImg?: string; likes: number; };
type UserProfile = { name: string; bio: string; followers: number; following: number; profileImg: string; };

export default function MyPage() {
  const router = useRouter(); // 👈 라우터 초기화
  
  const [myCards, setMyCards] = useState<CardData[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<UserProfile>({ name: "나(Me)", bio: "오늘의 기분을 기록합니다.", followers: 0, following: 0, profileImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" });
  const [editForm, setEditForm] = useState<UserProfile>(profile);
  
  const totalReceivedLikes = myCards.reduce((acc, card) => acc + card.likes, 0);

  useEffect(() => {
    // 1. 내 카드 불러오기
    const savedCards = localStorage.getItem("moodCards");
    const savedProfile = localStorage.getItem("userProfile");
    const currentName = savedProfile ? JSON.parse(savedProfile).name : "나(Me)";

    if (savedCards) {
      const allCards: CardData[] = JSON.parse(savedCards);
      // 작성자가 '현재 내 이름' 이거나 '나(Me)' 인 것들 가져오기
      const filtered = allCards.filter(card => card.author === currentName || card.author === "나(Me)");
      setMyCards(filtered);
    }

    // 2. 프로필 정보 불러오기
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      setProfile(parsed);
      setEditForm(parsed);
    } else {
      const initialProfile = { name: "나(Me)", bio: "오늘의 기분을 기록합니다.", followers: 128, following: 54, profileImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" };
      setProfile(initialProfile);
      setEditForm(initialProfile);
      localStorage.setItem("userProfile", JSON.stringify(initialProfile));
    }
  }, []);

  // 카드 삭제
  const deleteCard = (id: string) => {
    if (!confirm("정말 이 카드를 삭제할까요?")) return;
    const savedCards = localStorage.getItem("moodCards");
    if (savedCards) {
      const allCards: CardData[] = JSON.parse(savedCards);
      const newAllCards = allCards.filter(card => card.id !== id);
      localStorage.setItem("moodCards", JSON.stringify(newAllCards));
      setMyCards(myCards.filter(card => card.id !== id));
    }
  };

  // 이미지 업로드
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setEditForm(prev => ({ ...prev, profileImg: reader.result as string })); };
      reader.readAsDataURL(file);
    }
  };

  // 프로필 저장
  const saveProfile = () => {
    setProfile(editForm);
    localStorage.setItem("userProfile", JSON.stringify(editForm));
    const savedCards = localStorage.getItem("moodCards");
    if (savedCards) {
      const allCards: CardData[] = JSON.parse(savedCards);
      const updatedCards = allCards.map(card => {
        if (card.author === profile.name || card.author === "나(Me)") {
          return { ...card, author: editForm.name, authorImg: editForm.profileImg };
        }
        return card;
      });
      localStorage.setItem("moodCards", JSON.stringify(updatedCards));
      setMyCards(updatedCards.filter(card => card.author === editForm.name));
    }
    setIsEditing(false); 
    alert("프로필과 게시물 정보가 수정되었습니다! ✅");
  };

  const cancelEdit = () => { setEditForm(profile); setIsEditing(false); };
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
          <h1 className="text-lg font-bold text-slate-900 drop-shadow-sm">
            {isEditing ? "프로필 수정" : profile.name}
          </h1>
          
          <div className="w-10 flex justify-end">
            {isEditing ? (
              <div className="flex gap-2">
                <button onClick={cancelEdit} className="text-rose-500 hover:bg-rose-50 rounded-full p-1"><X className="h-6 w-6" /></button>
                <button onClick={saveProfile} className="text-blue-600 hover:bg-blue-50 rounded-full p-1"><Check className="h-6 w-6" /></button>
              </div>
            ) : (
              // ✨ 로그아웃 버튼 (편집 모드가 아닐 때 보임)
              <button onClick={handleLogout} className="text-slate-400 hover:text-rose-500 transition p-1" aria-label="로그아웃">
                <LogOut className="h-6 w-6" />
              </button>
            )}
          </div>
        </header>

        {/* 프로필 섹션 */}
        <section className="px-6 py-8">
          <div className="flex items-center justify-between gap-6 mb-6">
            <div className="relative">
              <img src={editForm.profileImg} alt="profile" className="h-24 w-24 rounded-full border-4 border-white bg-slate-100 object-cover shadow-lg" />
              {isEditing && (<><input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" /><button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 rounded-full bg-slate-800 p-2 text-white shadow-md hover:bg-slate-700"><Camera className="h-4 w-4" /></button></>)}
            </div>
            <div className="flex flex-1 justify-around text-center">
              <div><p className="text-xl font-bold text-slate-900">{myCards.length}</p><p className="text-xs text-slate-500 font-medium">게시물</p></div>
              <div><p className="text-xl font-bold text-slate-900">{profile.followers}</p><p className="text-xs text-slate-500 font-medium">팔로워</p></div>
              <div><p className="text-xl font-bold text-slate-900">{profile.following}</p><p className="text-xs text-slate-500 font-medium">팔로잉</p></div>
            </div>
          </div>
          <div className="space-y-1 pl-1 mb-6">
            {isEditing ? (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div><label className="text-xs font-bold text-slate-400 ml-1">이름</label><input value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="w-full rounded-xl border border-rose-200 bg-white/50 px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-200" /></div>
                <div><label className="text-xs font-bold text-slate-400 ml-1">자기소개</label><textarea value={editForm.bio} onChange={(e) => setEditForm({...editForm, bio: e.target.value})} className="w-full rounded-xl border border-rose-200 bg-white/50 px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-200 resize-none" rows={3} /></div>
              </div>
            ) : (<><h2 className="text-lg font-bold text-slate-900">{profile.name}</h2><p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{profile.bio}</p></>)}
          </div>
          {!isEditing && (<div className="flex gap-3 mb-6"><button onClick={() => setIsEditing(true)} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-200 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-300"><Edit3 className="h-4 w-4" /> 프로필 편집</button><button onClick={handleShareProfile} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-200 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-300"><Share2 className="h-4 w-4" /> 프로필 공유</button></div>)}
          {!isEditing && (<div className="flex items-center justify-center gap-2 rounded-2xl bg-white/60 px-4 py-3 text-sm text-rose-600 font-bold shadow-sm border border-rose-100"><Heart className="h-4 w-4 fill-rose-500 text-rose-500" /><span>지금까지 총 {totalReceivedLikes}개의 위로를 받았어요!</span></div>)}
        </section>

        {/* 내 카드 리스트 */}
        <div className="border-t border-slate-200/60 bg-white/30 pt-1 min-h-[500px]">
          {myCards.length === 0 ? (<div className="flex flex-col items-center justify-center py-20 text-slate-400"><p>아직 작성한 카드가 없어요.</p><Link href="/create" className="mt-4 rounded-full bg-rose-500 px-6 py-2 text-sm font-bold text-white shadow-lg hover:bg-rose-600">첫 카드 만들기</Link></div>) : (
            <div className="grid grid-cols-3 gap-0.5">
              {myCards.map((card) => (
                <div key={card.id} className="group relative aspect-square bg-slate-100 overflow-hidden cursor-pointer">
                  <div className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-110" style={{ backgroundImage: card.background ? `url(${card.background})` : "linear-gradient(135deg, #fce1e5 0%, #e4edff 100%)" }} />
                  <div className="absolute inset-0 bg-black/40 opacity-0 transition group-hover:opacity-100 flex flex-col items-center justify-center p-2 text-center backdrop-blur-[2px]">
                    <div className="flex items-center gap-1 text-white text-sm font-bold mb-2"><Heart className="w-4 h-4 fill-white" /> {card.likes}</div>
                    <button onClick={(e) => { e.stopPropagation(); deleteCard(card.id); }} className="rounded-full bg-white/20 p-2 text-white hover:bg-rose-500 hover:text-white transition"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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