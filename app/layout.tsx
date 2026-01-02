import type { Metadata } from "next";
import { BottomNav } from "./components/BottomNav";
import "./globals.css";
import { Gowun_Batang, Nanum_Myeongjo } from "next/font/google";

const gowunBatang = Gowun_Batang({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-gowun-batang",
});

const nanumMyeongjo = Nanum_Myeongjo({
  weight: ["400", "700", "800"],
  subsets: ["latin"],
  variable: "--font-nanum-myeongjo",
});

export const metadata: Metadata = {
  title: "감성 카드 만들기",
  description: "나만의 감성 카드를 만들어보세요.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={`antialiased ${gowunBatang.variable} ${nanumMyeongjo.variable}`}>
        {children}
        <BottomNav />
      </body>
    </html>
  );
}