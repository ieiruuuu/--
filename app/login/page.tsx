"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Mail, Lock, User, ArrowRight, CheckCircle, XCircle } from "lucide-react";
// ✨ Firebase 기능 가져오기
import { auth, db } from "../firebase"; // 아까 만든 설정 파일
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

export default function LoginPage() {
  const router = useRouter();
  const [isLoginMode, setIsLoginMode] = useState(true);

  // 입력값
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [realName, setRealName] = useState(""); // 본명
  const [birthYear, setBirthYear] = useState(""); // 출생년도
  const [birthMonth, setBirthMonth] = useState(""); // 출생월
  const [birthDay, setBirthDay] = useState(""); // 출생일
  const [nickname, setNickname] = useState(""); // 닉네임
  const [passwordConfirm, setPasswordConfirm] = useState(""); // 비밀번호 재확인
  const [error, setError] = useState("");
  
  // 닉네임 중복 확인 상태
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [nicknameChecking, setNicknameChecking] = useState(false);
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(null);

  // 닉네임 중복 확인 함수
  const checkNicknameDuplicate = async () => {
    if (!nickname.trim()) {
      setError("닉네임을 입력해주세요.");
      return;
    }

    setNicknameChecking(true);
    setError("");

    try {
      const q = query(collection(db, "users"), where("nickname", "==", nickname.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // 중복 없음
        setNicknameAvailable(true);
        setNicknameChecked(true);
        setError("");
      } else {
        // 중복 있음
        setNicknameAvailable(false);
        setNicknameChecked(false);
        setError("이미 사용 중인 닉네임입니다.");
      }
    } catch (err: any) {
      console.error(err);
      setError("닉네임 확인 중 오류가 발생했습니다.");
      setNicknameAvailable(null);
      setNicknameChecked(false);
    } finally {
      setNicknameChecking(false);
    }
  };

  // 닉네임이 변경되면 중복 확인 상태 초기화
  const handleNicknameChange = (value: string) => {
    setNickname(value);
    setNicknameChecked(false);
    setNicknameAvailable(null);
  };

  // 🔵 회원가입 처리 (Firebase)
  const handleSignup = async () => {
    // 필수 입력값 검증
    if (!email || !password || !realName || !nickname || !passwordConfirm) {
      setError("모든 정보를 입력해주세요.");
      return;
    }

    // 생년월일 선택 여부 확인
    if (!birthYear || !birthMonth || !birthDay) {
      alert("생년월일을 모두 선택해주세요.");
      setError("생년월일을 모두 선택해주세요.");
      return;
    }

    // 비밀번호 일치 확인
    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    // 닉네임 중복 확인 여부 확인
    if (!nicknameChecked || !nicknameAvailable) {
      setError("닉네임 중복 확인을 해주세요.");
      return;
    }

    setError(""); // 에러 초기화

    try {
      // 1. Firebase Auth에 이메일/비번으로 계정 생성
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 생년월일 문자열 조합 (YYYY-MM-DD)
      const birthDate = `${birthYear}-${birthMonth.padStart(2, "0")}-${birthDay.padStart(2, "0")}`;

      // 2. 프로필 이름 업데이트 (닉네임 사용)
      await updateProfile(user, {
        displayName: nickname,
        photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${nickname}`
      });

      // 3. Firestore 데이터베이스에 유저 상세 정보 저장
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        realName: realName, // 본명
        birthDate: birthDate, // 출생일 (YYYY-MM-DD)
        nickname: nickname, // 닉네임
        email: email,
        profileImg: user.photoURL,
        createdAt: new Date().toISOString()
      });

      // 4. 로컬스토리지에도 저장 (기존 홈 화면 호환성 유지를 위해 임시로 둠)
      localStorage.setItem("currentUser", JSON.stringify({
        uid: user.uid,
        name: nickname, // 닉네임을 name으로 저장 (기존 코드 호환성)
        email: email,
        profileImg: user.photoURL
      }));

      alert(`환영합니다, ${nickname}님! 회원가입 성공! 🎉`);
      router.push("/"); // 홈으로 이동

    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setError("이미 가입된 이메일입니다.");
      } else if (err.code === "auth/weak-password") {
        setError("비밀번호는 6자리 이상이어야 합니다.");
      } else {
        setError("회원가입 실패: " + err.message);
      }
    }
  };

  // 🟠 로그인 처리 (Firebase)
  const handleLogin = async () => {
    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    setError("");

    try {
      // 1. Firebase Auth로 로그인 시도
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Firestore에서 유저 추가 정보 가져오기
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data() as any;
        const nickname: string | undefined =
          userData.nickname || userData.name || undefined;
        
        // 3. 로컬스토리지 업데이트 (기존 홈 호환성 유지)
        localStorage.setItem("currentUser", JSON.stringify(userData));
        
        // 마이페이지 프로필도 최신화
        localStorage.setItem("userProfile", JSON.stringify({
           name: nickname || "",
           bio: "오늘의 기분을 기록합니다.",
           followers: 0,
           following: 0,
           profileImg: userData.profileImg
        }));

        // 4. 닉네임 기반 인사 메시지
        if (nickname) {
          alert(`반가워요! ${nickname}님 👋`);
        } else {
          alert("반가워요!");
        }
        router.push("/");
      } else {
        // 정보가 없을 경우 (예외 처리)
        alert("로그인은 됐는데 유저 정보가 없네요?");
        router.push("/");
      }

    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("이메일이나 비밀번호가 틀렸습니다.");
      } else {
        setError("로그인 실패: " + err.message);
      }
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-blue-50 p-6">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 border border-white/50 animate-in zoom-in duration-300">
        
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-full bg-rose-50 mb-4">
            <Sparkles className="w-8 h-8 text-rose-500 fill-rose-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">오늘의 위로</h1>
          <p className="text-slate-500 text-sm mt-1">
            {isLoginMode ? "당신의 감성을 기록하러 오셨나요?" : "새로운 감성 여행을 시작해보세요"}
          </p>
        </div>

        <div className="space-y-4">
          {!isLoginMode && (
            <>
              {/* 본명 */}
              <div className="relative">
                <User className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="본명" 
                  value={realName} 
                  onChange={(e) => setRealName(e.target.value)} 
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 transition" 
                />
              </div>

              {/* 생년월일 (년/월/일) */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-500 pl-1">생년월일</p>
                <div className="flex gap-2">
                  {/* 년 */}
                  <div className="relative flex-1">
                    <select
                      value={birthYear}
                      onChange={(e) => setBirthYear(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-4 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 transition"
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
                  </div>
                  {/* 월 */}
                  <div className="relative w-20">
                    <select
                      value={birthMonth}
                      onChange={(e) => setBirthMonth(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-2 pr-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 transition"
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
                  </div>
                  {/* 일 */}
                  <div className="relative w-20">
                    <select
                      value={birthDay}
                      onChange={(e) => setBirthDay(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-2 pr-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 transition"
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

              {/* 닉네임 (중복 확인 버튼 포함) */}
              <div className="space-y-2">
                <div className="relative flex gap-2">
                  <div className="relative flex-1">
                    <User className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="닉네임" 
                      value={nickname} 
                      onChange={(e) => handleNicknameChange(e.target.value)} 
                      className={`w-full rounded-2xl border py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 transition ${
                        nicknameAvailable === true 
                          ? "border-green-300 bg-green-50 focus:ring-green-200" 
                          : nicknameAvailable === false
                          ? "border-red-300 bg-red-50 focus:ring-red-200"
                          : "border-slate-200 bg-slate-50 focus:ring-rose-200"
                      }`}
                    />
                    {nicknameAvailable === true && (
                      <CheckCircle className="absolute right-4 top-3.5 h-5 w-5 text-green-500" />
                    )}
                    {nicknameAvailable === false && (
                      <XCircle className="absolute right-4 top-3.5 h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <button
                    onClick={checkNicknameDuplicate}
                    disabled={nicknameChecking || !nickname.trim()}
                    className="px-4 py-3.5 rounded-2xl bg-rose-500 text-white text-sm font-semibold whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed transition hover:bg-rose-600"
                  >
                    {nicknameChecking ? "확인 중..." : "중복 확인"}
                  </button>
                </div>
              </div>
            </>
          )}
          
          {/* 이메일 */}
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

          {/* 비밀번호 */}
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
            <input 
              type="password" 
              placeholder="비밀번호 (6자리 이상)" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 transition" 
              onKeyDown={(e) => e.key === 'Enter' && (isLoginMode ? handleLogin() : handleSignup())} 
            />
          </div>

          {/* 비밀번호 재확인 (회원가입 모드일 때만) */}
          {!isLoginMode && (
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
              <input 
                type="password" 
                placeholder="비밀번호 재확인" 
                value={passwordConfirm} 
                onChange={(e) => setPasswordConfirm(e.target.value)} 
                className={`w-full rounded-2xl border py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 transition ${
                  passwordConfirm && password !== passwordConfirm
                    ? "border-red-300 bg-red-50 focus:ring-red-200"
                    : passwordConfirm && password === passwordConfirm
                    ? "border-green-300 bg-green-50 focus:ring-green-200"
                    : "border-slate-200 bg-slate-50 focus:ring-rose-200"
                }`}
                onKeyDown={(e) => e.key === 'Enter' && handleSignup()} 
              />
              {passwordConfirm && password === passwordConfirm && (
                <CheckCircle className="absolute right-4 top-3.5 h-5 w-5 text-green-500" />
              )}
              {passwordConfirm && password !== passwordConfirm && (
                <XCircle className="absolute right-4 top-3.5 h-5 w-5 text-red-500" />
              )}
            </div>
          )}
        </div>

        {error && <p className="text-rose-500 text-xs font-bold text-center mt-4">{error}</p>}

        <button onClick={isLoginMode ? handleLogin : handleSignup} className="w-full mt-8 rounded-2xl bg-gradient-to-r from-rose-400 to-orange-300 py-4 font-bold text-white shadow-lg transition hover:scale-[1.02] hover:shadow-xl flex items-center justify-center gap-2">
          {isLoginMode ? "로그인하기" : "회원가입하기"}
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="mt-6 text-center">
          <button 
            onClick={() => { 
              setIsLoginMode(!isLoginMode); 
              setError(""); 
              // 회원가입 모드로 전환 시 입력값 초기화
              if (!isLoginMode) {
                setRealName("");
                setBirthYear("");
                setBirthMonth("");
                setBirthDay("");
                setNickname("");
                setPasswordConfirm("");
                setNicknameChecked(false);
                setNicknameAvailable(null);
              }
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