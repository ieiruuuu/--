import type { Metadata } from "next";
import "./globals.css";
import { Nanum_Myeongjo, Inter } from "next/font/google";
import { BottomNav } from "./components/BottomNav";

const display = Nanum_Myeongjo({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-display"
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: "따뜻한 하루 카드",
  description: "기분에 맞춘 감성 명언 카드를 만들고 공유하세요."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={`${display.variable} ${body.variable}`}>
        <div className="pb-24">{children}</div>
        <BottomNav />
      </body>
    </html>
  );
}

