"use client";

import { useEffect, useState } from "react";
import { Heart, MessageCircle, X } from "lucide-react";
import { auth, db } from "../firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc
} from "firebase/firestore";

export type FeedData = {
  id: string;
  text: string;
  background?: string;
  date: string;
  author: string;
  authorUid?: string;
  authorImg: string;
};

type FeedCardProps = {
  data: FeedData;
};

type Comment = {
  id: string;
  text: string;
  author: string;
  uid?: string;
  createdAt?: Date;
};

export function FeedCard({ data }: FeedCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState("");

  // 좋아요 실시간 구독
  useEffect(() => {
    if (!data.id) return;
    const likesRef = collection(db, "feeds", data.id, "likes");

    const unsub = onSnapshot(likesRef, (snap) => {
      const uid = auth.currentUser?.uid;
      setLikeCount(snap.size);
      if (uid) {
        setIsLiked(snap.docs.some((d) => d.id === uid));
      } else {
        setIsLiked(false);
      }
    });

    return () => unsub();
  }, [data.id]);

  // 댓글 실시간 구독
  useEffect(() => {
    if (!data.id) return;
    const commentsRef = collection(db, "feeds", data.id, "comments");

    const unsub = onSnapshot(commentsRef, (snap) => {
      const list: Comment[] = snap.docs
        .map((docSnap) => {
          const d = docSnap.data() as any;
          return {
            id: docSnap.id,
            text: d.text || "",
            author: d.authorName || d.author || "익명",
            uid: d.uid || undefined,
            createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : undefined
          };
        })
        .sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return a.createdAt.getTime() - b.createdAt.getTime();
        });
      setComments(list);
    });

    return () => unsub();
  }, [data.id]);

  const handleToggleLike = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    const likeRef = doc(db, "feeds", data.id, "likes", user.uid);
    const prevLiked = isLiked;

    // Optimistic UI
    setIsLiked(!prevLiked);
    setLikeCount((prev) => prev + (prevLiked ? -1 : 1));

    try {
      if (prevLiked) {
        await deleteDoc(likeRef);
      } else {
        await setDoc(likeRef, {
          uid: user.uid,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("좋아요 처리 실패:", error);
      // rollback
      setIsLiked(prevLiked);
      setLikeCount((prev) => prev + (prevLiked ? 1 : -1));
    }
  };

  const handleAddComment = async () => {
    const text = commentInput.trim();
    if (!text) return;

    const user = auth.currentUser;
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    // Firestore users 컬렉션에서 닉네임 가져오기
    let authorName = "익명";
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data() as any;
        authorName = userData.nickname || userData.name || "익명";
      }
    } catch (e) {
      console.error("댓글 작성자 이름 불러오기 실패:", e);
    }

    const commentsRef = collection(db, "feeds", data.id, "comments");
    setCommentInput("");

    try {
      await addDoc(commentsRef, {
        text,
        author: authorName,
        authorName: authorName, // 명시적으로 authorName 필드도 저장
        uid: user.uid,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("댓글 저장 실패:", error);
      alert("댓글을 저장하지 못했어요. 잠시 후 다시 시도해주세요.");
      setCommentInput(text); // 입력 복구
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    try {
      const commentRef = doc(db, "feeds", data.id, "comments", commentId);
      await deleteDoc(commentRef);
      // onSnapshot이 자동으로 화면을 갱신해줄 것
    } catch (error) {
      console.error("댓글 삭제 실패:", error);
      alert("댓글을 삭제하지 못했어요. 잠시 후 다시 시도해주세요.");
    }
  };

  return (
    <article className="group relative overflow-hidden rounded-[2rem] bg-white shadow-xl shadow-slate-200/50 transition duration-300 hover:-translate-y-1 hover:shadow-2xl">
      {/* 상단 그라데이션 오버레이에 작성자 정보 */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center gap-3">
          <img
            src={data.authorImg}
            alt="profile"
            className="h-10 w-10 rounded-full border-2 border-white/80 bg-white/20 backdrop-blur-md"
          />
          <div>
            <p className="font-bold text-white drop-shadow-md text-sm">
              {data.author}
            </p>
            <p className="text-[10px] text-white/80 font-medium">{data.date}</p>
          </div>
        </div>
      </div>

      {/* 카드 이미지 & 텍스트 */}
      <div
        className="aspect-[3/4] w-full bg-cover bg-center flex items-center justify-center p-8 text-center relative"
        style={{
          backgroundImage: data.background
            ? `url(${data.background})`
            : "linear-gradient(135deg, #fce1e5 0%, #e4edff 100%)"
        }}
      >
        {data.background && (
          <div className="absolute inset-0 bg-black/20 transition group-hover:bg-black/30" />
        )}
        <p
          className={`relative z-10 text-xl font-bold leading-relaxed break-keep whitespace-pre-wrap ${
            data.background ? "text-white drop-shadow-lg" : "text-slate-800"
          }`}
        >
          {data.text}
        </p>
      </div>

      {/* 하단 액션 + 댓글 */}
      <div className="bg-white p-5">
        <div className="flex items-center gap-6 mb-4">
          <button
            onClick={handleToggleLike}
            className="flex items-center gap-2 transition active:scale-90"
          >
            <div
              className={`p-2 rounded-full ${
                isLiked ? "bg-rose-50 text-rose-500" : "bg-slate-50 text-slate-400"
              }`}
            >
              <Heart
                className={`h-6 w-6 ${isLiked ? "fill-current" : ""}`}
              />
            </div>
            <span
              className={`font-bold text-lg ${
                isLiked ? "text-rose-500" : "text-slate-500"
              }`}
            >
              {likeCount}
            </span>
          </button>

          <div className="flex items-center gap-2 text-slate-500">
            <div className="p-2 rounded-full bg-slate-50">
              <MessageCircle className="h-6 w-6" />
            </div>
            <span className="font-bold text-lg">{comments.length}</span>
          </div>
        </div>

        {/* 댓글 입력창 */}
        <div className="relative">
          <input
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-4 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-rose-100 transition"
            placeholder="따뜻한 댓글을 남겨주세요..."
            onKeyDown={(e) => {
              // 한글 IME 조합 중일 때는 전송하지 않음
              if (e.nativeEvent.isComposing) return;
              if (e.key === "Enter") {
                handleAddComment();
              }
            }}
          />
          <button
            onClick={handleAddComment}
            className="absolute right-2 top-2 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-700"
          >
            게시
          </button>
        </div>

        {/* 댓글 목록 (최신순) */}
        {comments.length > 0 && (
          <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 max-h-40 overflow-y-auto">
            {comments.map((c) => {
              const currentUser = auth.currentUser;
              const canDelete =
                currentUser &&
                (c.uid === currentUser.uid ||
                  data.authorUid === currentUser.uid);

              return (
                <div key={c.id} className="text-sm flex items-start gap-2 group">
                  <span className="font-bold text-slate-900 shrink-0">
                    {c.author}
                  </span>
                  <span className="text-slate-600 flex-1">{c.text}</span>
                  {canDelete && (
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-rose-500 shrink-0 ml-1"
                      aria-label="댓글 삭제"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
}


