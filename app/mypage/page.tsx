const gallery = [
  { id: 1, quote: "오늘 하루를 견뎌낸 당신에게 조용한 박수를 보냅니다.", bg: "from-rose-100 via-sky-50 to-purple-100" },
  { id: 2, quote: "잠시 멈춰 쉬어도 괜찮아요. 숨 고르는 시간도 여정의 일부니까요.", bg: "from-amber-100 via-rose-50 to-white" },
  { id: 3, quote: "당신이 흘린 땀방울만큼 내일의 빛은 더 환할 거예요.", bg: "from-indigo-100 via-blue-50 to-sky-100" },
  { id: 4, quote: "작은 친절이 큰 온기가 되어 돌아옵니다. 오늘도 따뜻함을 남겨주세요.", bg: "from-emerald-100 via-mint-50 to-white" },
  { id: 5, quote: "당신의 걸음은 충분히 아름다워요. 급히 걷지 않아도 괜찮습니다.", bg: "from-lilac-100 via-rose-50 to-white" },
  { id: 6, quote: "어둠 속에서도 당신의 마음은 빛을 기억합니다. 잊지 마세요.", bg: "from-slate-50 via-white to-rose-100" }
];

export default function MyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blush via-white to-mist px-5 pb-24 pt-10">
      <div className="mx-auto max-w-xl space-y-6">
        <header className="flex items-center gap-4 rounded-3xl bg-white/70 p-5 shadow-sm backdrop-blur-md">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-rose-200 to-amber-200 shadow-inner" />
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-slate-900">따뜻한 하루</h1>
            <p className="text-sm text-slate-500">오늘도 마음을 기록하는 중</p>
            <div className="mt-2 flex gap-4 text-sm text-slate-700">
              <span className="font-semibold text-rose-500">1.2k</span> 팔로워
              <span className="font-semibold text-amber-500">320</span> 팔로잉
            </div>
          </div>
        </header>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">내가 만든 카드</h2>
            <span className="text-xs text-slate-500">최근 작업</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {gallery.map((item) => (
              <div
                key={item.id}
                className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-sm backdrop-blur-md"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${item.bg}`} />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.6),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(255,230,250,0.4),transparent_30%)]" />
                <div className="absolute inset-0 opacity-60 blur-3xl bg-[radial-gradient(circle_at_20%_30%,rgba(255,182,193,0.25),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(173,216,230,0.25),transparent_40%)]" />
                <div className="absolute inset-3 rounded-[18px] border border-white/50 shadow-inner" />
                <div className="absolute inset-0 flex items-center justify-center px-4">
                  <p className="font-display text-sm leading-relaxed text-slate-800 drop-shadow-sm break-keep">
                    {item.quote}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

