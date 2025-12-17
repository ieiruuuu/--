const feedCards = [
  {
    id: 1,
    quote:
      "오늘의 작은 흔들림은 당신이 앞으로 나아가고 있다는 증거예요. 느리게 가도 괜찮아요.",
    bg: "from-rose-100 via-amber-50 to-sky-100"
  },
  {
    id: 2,
    quote:
      "고요한 밤의 숨결 속에서 당신의 마음도 잠시 쉬어가길. 내일의 빛은 이미 준비되고 있어요.",
    bg: "from-indigo-100 via-purple-50 to-pink-100"
  },
  {
    id: 3,
    quote:
      "사소한 친절 하나가 당신의 하루를 밝혔던 것처럼, 당신도 누군가의 빛이 될 수 있어요.",
    bg: "from-emerald-100 via-mint-50 to-white"
  },
  {
    id: 4,
    quote:
      "멈춰 서는 시간도 성장의 일부예요. 지금의 호흡이 당신을 더 단단하게 만들 거예요.",
    bg: "from-sky-50 via-white to-rose-100"
  },
  {
    id: 5,
    quote:
      "당신이 걸어온 길엔 이미 수많은 색이 묻어 있어요. 그 어느 색도 헛되지 않았어요.",
    bg: "from-amber-100 via-rose-50 to-lilac-100"
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blush via-white to-mist px-5 pb-24 pt-10">
      <div className="mx-auto max-w-xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">오늘의 위로 피드</p>
            <h1 className="text-xl font-semibold text-slate-900">따뜻한 글귀 모음</h1>
          </div>
        </header>

        <div className="space-y-5">
          {feedCards.map((card) => (
            <article
              key={card.id}
              className="relative overflow-hidden rounded-3xl shadow-xl bg-white/60 backdrop-blur-md border border-white/60"
            >
              <div className="relative aspect-[3/4] overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${card.bg}`} />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.6),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(255,230,250,0.4),transparent_30%)]" />
                <div className="absolute inset-0 opacity-60 blur-3xl bg-[radial-gradient(circle_at_20%_30%,rgba(255,182,193,0.25),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(173,216,230,0.25),transparent_40%)]" />
                <div className="absolute inset-6 rounded-[24px] border border-white/50 shadow-inner" />

                <div className="absolute inset-0 flex items-center justify-center px-10">
                  <div className="relative w-full max-w-[85%] text-left">
                    <div className="absolute -inset-4 rounded-2xl bg-white/55 backdrop-blur-sm" />
                    <p className="relative z-10 font-display text-base leading-loose text-slate-800 break-keep md:text-lg">
                      {card.quote}
                    </p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

