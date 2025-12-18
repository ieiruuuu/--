import type { Metadata } from "next";
import { BottomNav } from "./components/BottomNav";
import "./globals.css";

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
      <body className="antialiased">
        {children}
        <BottomNav />
      </body>
    </html>
  );
}