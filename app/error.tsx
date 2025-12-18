"use client"; // 👈 이 줄이 없어서 에러가 난 겁니다!

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 에러 로그를 남길 수도 있습니다.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <h2 className="text-xl font-bold text-rose-600">
        문제가 발생했습니다.
      </h2>
      <p className="text-slate-600">
        {error.message || "알 수 없는 오류가 발생했습니다."}
      </p>
      <button
        onClick={() => reset()}
        className="rounded-xl bg-slate-800 px-4 py-2 font-bold text-white transition hover:bg-slate-700"
      >
        다시 시도하기
      </button>
    </div>
  );
}