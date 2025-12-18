"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusSquare, User } from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const items: NavItem[] = [
  { href: "/", label: "홈", icon: <Home className="h-5 w-5" /> },
  { href: "/create", label: "글귀 생성", icon: <PlusSquare className="h-5 w-5" /> },
  { href: "/mypage", label: "마이페이지", icon: <User className="h-5 w-5" /> }
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 mx-auto max-w-xl border-t border-white/70 bg-white/80 px-4 py-3 backdrop-blur-lg shadow-[0_-6px_30px_-18px_rgba(0,0,0,0.25)]">
      <div className="grid grid-cols-3 gap-2 text-sm font-medium text-slate-500">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-center gap-2 rounded-2xl px-3 py-2 transition ${
                active
                  ? "bg-gradient-to-r from-rose-200 to-amber-100 text-slate-900 shadow-inner"
                  : "hover:bg-slate-100"
              }`}
            >
              <span className={active ? "text-rose-600" : "text-slate-500"}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

