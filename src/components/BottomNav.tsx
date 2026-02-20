"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, Crown, Layers, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/watch')) {
    return null;
  }

  const navItems = [
    {
      href: "/",
      icon: Home,
      label: "Home",
      active: pathname === "/",
    },
    {
      href: "/chat",
      icon: MessageCircle,
      label: "Chat",
      active: pathname === "/chat",
    },
    {
      href: "/favorites",
      icon: Layers,
      label: "Library",
      active: pathname === "/favorites" || pathname === "/bookmarks",
    },
    {
      href: "/upgrade",
      icon: Crown,
      label: "VIP",
      active: pathname === "/upgrade",
    },
    {
      href: user ? "/profile" : "/login",
      icon: User,
      label: user ? "Akun" : "Masuk",
      active: pathname === "/profile" || pathname === "/login",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-bottom">
      <div className="mx-3 mb-3">
        <div className="bg-card/90 backdrop-blur-xl rounded-2xl border border-white/5 shadow-lg shadow-black/20">
          <div className="flex items-stretch h-16">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all relative ${
                    item.active
                      ? "text-white"
                      : "text-muted-foreground"
                  }`}
                >
                  <div className={`p-2 rounded-xl transition-all ${
                    item.active 
                      ? "bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30"
                      : ""
                  }`}>
                    <Icon className="w-5 h-5" strokeWidth={item.active ? 2.5 : 2} />
                  </div>
                  <span className={`text-[10px] font-medium ${item.active ? 'text-white' : ''}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
