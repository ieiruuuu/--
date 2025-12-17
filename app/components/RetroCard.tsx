"use client";

type RetroCardProps = {
  text: string;
};

export function RetroCard({ text }: RetroCardProps) {
  return (
    <p className="font-black text-2xl leading-tight text-white drop-shadow-[0_6px_12px_rgba(0,0,0,0.35)] md:text-3xl text-center break-keep">
      {text}
    </p>
  );
}

