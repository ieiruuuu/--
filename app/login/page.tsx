"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Mail, Lock, User, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isLoginMode, setIsLoginMode] = useState(true); // 로그인 vs 회원가입 모드 전환

  // 입력값 상태
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  // 이미 로그인 되어있으면 홈으로 보냄
  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
      router.push("/");
    }
  }, []);

  // 🔵 회원가입 처리
  const handleSignup = () => {
    if (!email || !password || !name) {
      setError("모든 정보를 입력해주세요.");
      return;
    }

    // 기존 유저 목록 가져오기
    const users = JSON.parse(localStorage.getItem("users") || "[]");

    // 이메일 중복 확인
    if (users.find((u: any) => u.email === email)) {
      setError("이미 가입된 이메일입니다.");
      return;
    }

    // 새 유저 저장
    const newUser = { email, password, name, profileImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=" + name };
    localStorage.setItem("users", JSON.stringify([...users, newUser]));
    
    alert("회원가입 성공! 🎉 로그인해주세요.");
    setIsLoginMode(true); // 로그인 화면으로 전환
    setError("");
  };

  // 🟠 로그인 처리
  const handleLogin = () => {
    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    const users = JSON.parse(localStorage.getItem("users") || "[]");
    
    // 유저 찾기
    const user = users.find((u: any) => u.email === email && u.password === password);

    if (user) {
      // 로그인 성공: 현재 사용자 정보 저장 (세션)
      // 비밀번호는 제외하고 저장하는 것이 관례
      const { password, ...userInfo } = user;
      localStorage.setItem("currentUser", JSON.stringify(userInfo));
      
      // 내 프로필 정보도 초기화 (기존 마이페이지 로직과 연동)
      localStorage.setItem("userProfile", JSON.stringify({
        name: user.name,
        bio: "오늘의 기분을 기록합니다.",
        followers: 0,
        following: 0,
        profileImg: user.profileImg
      }));

      router.push("/"); // 홈으로 이동
    } else {
      setError("이메일 또는 비밀번호가 틀렸습니다.");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-blue-50 p-6">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 border border-white/50 animate-in zoom-in duration-300">
        
        {/* 로고 영역 */}
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-full bg-rose-50 mb-4">
            <Sparkles className="w-8 h-8 text-rose-500 fill-rose-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">오늘의 위로</h1>
          <p className="text-slate-500 text-sm mt-1">
            {isLoginMode ? "당신의 감성을 기록하러 오셨나요?" : "새로운 감성 여행을 시작해보세요"}
          </p>
        </div>

        {/* 입력 폼 */}
        <div className="space-y-4">
          {!isLoginMode && (
            <div className="relative">
              <User className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="이름 (닉네임)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 transition"
              />
            </div>
          )}
          
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
            <input
              type="email"
              placeholder="이메일 주소"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 transition"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 transition"
              onKeyDown={(e) => e.key === 'Enter' && (isLoginMode ? handleLogin() : handleSignup())}
            />
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && <p className="text-rose-500 text-xs font-bold text-center mt-4">{error}</p>}

        {/* 메인 버튼 */}
        <button
          onClick={isLoginMode ? handleLogin : handleSignup}
          className="w-full mt-8 rounded-2xl bg-gradient-to-r from-rose-400 to-orange-300 py-4 font-bold text-white shadow-lg transition hover:scale-[1.02] hover:shadow-xl flex items-center justify-center gap-2"
        >
          {isLoginMode ? "로그인하기" : "회원가입하기"}
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* 모드 전환 */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setError("");
              setEmail("");
              setPassword("");
              setName("");
            }}
            className="text-sm text-slate-500 hover:text-rose-500 font-medium transition"
          >
            {isLoginMode ? "계정이 없으신가요? 회원가입" : "이미 계정이 있나요? 로그인"}
          </button>
        </div>
      </div>
    </main>
  );
}