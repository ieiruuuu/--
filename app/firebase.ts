import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 👇 여기에 선생님의 Firebase 키를 넣어야 합니다!
const firebaseConfig = {
  apiKey: "AIzaSyDlsZgxktpOTyi1gWkS6ls2HqQvbpi-3sk", 
  authDomain: "todayscomfort-b3267.firebaseapp.com",
  projectId: "todayscomfort-b3267",
  storageBucket: "todayscomfort-b3267.firebasestorage.app",
  messagingSenderId: "841188418670",
  appId: "1:841188418670:web:433100557be08aaad4727f"
};

// Firebase 시작!
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); // 로그인 담당
export const db = getFirestore(app); // 데이터 저장 담당