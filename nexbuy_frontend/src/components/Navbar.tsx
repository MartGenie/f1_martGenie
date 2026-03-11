"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Props = {
  onOpenAuth: () => void;
  onSignOut: () => void;
  isAuthenticated: boolean;
};

const navItems = [
  { label: "Overview", href: "/#hero" },
  { label: "System", href: "/#system" },
  { label: "Workspace", href: "/chat" },
  { label: "Negotiation", href: "/negotiation" },
];

export default function Navbar({ onOpenAuth, onSignOut, isAuthenticated }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current) {
        return;
      }
      if (!containerRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-[70]">
      <div className="mx-auto flex w-full max-w-[1480px] items-center justify-between px-4 pt-4 md:px-6">
        <div className="flex h-16 w-full items-center justify-between rounded-[24px] border border-white/10 bg-black/45 px-4 backdrop-blur-2xl shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_20px_80px_rgba(0,0,0,0.45)] md:px-5">
          <Link className="flex items-center gap-3" href="/">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-sm font-bold text-white shadow-[0_0_30px_rgba(129,140,248,0.16)]">
              NX
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/42">Nexbuy</p>
              <p className="text-sm font-semibold tracking-[-0.03em] text-white">Agent Commerce Console</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-white/62 lg:flex">
            {navItems.map((item) => (
              <Link className="transition hover:text-white" href={item.href} key={item.label}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="relative flex items-center gap-2" ref={containerRef}>
            <button
              className="hidden rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white/82 transition hover:border-white/16 hover:bg-white/[0.08] md:inline-flex"
              onClick={() => {
                if (isAuthenticated) {
                  onSignOut();
                  setMenuOpen(false);
                  return;
                }
                onOpenAuth();
              }}
              type="button"
            >
              {isAuthenticated ? "Sign out" : "Authenticate"}
            </button>
            <button
              aria-label="Open navigation menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-sm font-semibold text-white/82 transition hover:border-white/16 hover:bg-white/[0.08] lg:hidden"
              onClick={() => setMenuOpen((current) => !current)}
              type="button"
            >
              ≡
            </button>

            {menuOpen ? (
              <div className="absolute right-0 top-14 w-[260px] rounded-[24px] border border-white/10 bg-black/80 p-3 backdrop-blur-2xl shadow-[0_20px_80px_rgba(0,0,0,0.55)] lg:hidden">
                <div className="space-y-1">
                  {navItems.map((item) => (
                    <Link
                      className="block rounded-2xl px-3 py-2 text-sm font-medium text-white/78 transition hover:bg-white/[0.06] hover:text-white"
                      href={item.href}
                      key={item.label}
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
                <button
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-left text-sm font-semibold text-white/85 transition hover:border-white/16 hover:bg-white/[0.08]"
                  onClick={() => {
                    setMenuOpen(false);
                    if (isAuthenticated) {
                      onSignOut();
                      return;
                    }
                    onOpenAuth();
                  }}
                  type="button"
                >
                  {isAuthenticated ? "Sign out" : "Authenticate"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
