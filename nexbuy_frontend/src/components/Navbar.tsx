"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Props = {
  onOpenAuth: () => void;
  onSignOut: () => void;
  isAuthenticated: boolean;
};

const navItems = [
  { label: "Home", href: "/" },
  { label: "Chat", href: "/chat" },
  { label: "Negotiation", href: "/negotiation" },
  { label: "Plaza", href: "/plaza" },
];

export default function Navbar({ onOpenAuth, onSignOut, isAuthenticated }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current) {
        return;
      }
      if (!containerRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-[80]">
      <div className="mx-auto flex w-full max-w-[1480px] items-center justify-between px-4 pt-0 md:px-6">
        <div className="flex h-[72px] w-full items-center justify-between bg-[#111111] px-4 text-[#24180f] md:px-5">
          <Link className="flex items-center" href="/">
            <p className="text-lg font-black uppercase tracking-[0.34em] text-[#d7dbe0] md:text-xl">Nexbuy</p>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-semibold text-[#d1d5db] lg:flex">
            {navItems.map((item) => (
              <Link className="transition hover:text-[#f3f4f6]" href={item.href} key={item.label}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="relative flex items-center gap-2" ref={containerRef}>
            {isAuthenticated ? (
              <div
                className="relative hidden md:block"
                onMouseEnter={() => setProfileOpen(true)}
                onMouseLeave={() => setProfileOpen(false)}
              >
                <button
                  aria-label="Open user menu"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#e5d7c5] bg-white text-[#5f4a35] shadow-[0_10px_25px_rgba(49,35,24,0.08)] transition hover:border-[#d6c0a3] hover:text-[#1f160f]"
                  onClick={() => setProfileOpen((current) => !current)}
                  type="button"
                >
                  <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                    />
                  </svg>
                </button>

                {profileOpen ? (
                  <div className="absolute right-0 top-14 w-[220px] rounded-[24px] border border-[#eadfce] bg-[#fffaf3] p-3 shadow-[0_20px_60px_rgba(49,35,24,0.12)]">
                    <div className="space-y-1">
                      <button
                        className="block w-full rounded-2xl px-3 py-3 text-left text-sm font-semibold text-[#4c3929] transition hover:bg-[#f4ede3]"
                        onClick={() => setProfileOpen(false)}
                        type="button"
                      >
                        Personal Details
                      </button>
                      <button
                        className="block w-full rounded-2xl px-3 py-3 text-left text-sm font-semibold text-[#4c3929] transition hover:bg-[#f4ede3]"
                        onClick={() => setProfileOpen(false)}
                        type="button"
                      >
                        Order Details
                      </button>
                      <button
                        className="block w-full rounded-2xl px-3 py-3 text-left text-sm font-semibold text-[#8b3a2b] transition hover:bg-[#fff1ee]"
                        onClick={() => {
                          setProfileOpen(false);
                          onSignOut();
                        }}
                        type="button"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <button
                className="hidden rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-[#2f2418] shadow-[0_12px_28px_rgba(255,255,255,0.12)] transition hover:bg-[#f5f5f5] md:inline-flex"
                onClick={onOpenAuth}
                type="button"
              >
                Sign in
              </button>
            )}
            <button
              aria-label="Open navigation menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#e5d7c5] bg-white text-sm font-semibold text-[#5f4a35] transition hover:border-[#d6c0a3] hover:bg-[#fffaf3] lg:hidden"
              onClick={() => setMenuOpen((current) => !current)}
              type="button"
            >
              ≡
            </button>

            {menuOpen ? (
              <div className="absolute right-0 top-14 w-[260px] rounded-[24px] border border-[#eadfce] bg-[#fffaf3] p-3 shadow-[0_20px_60px_rgba(49,35,24,0.12)] lg:hidden">
                <div className="space-y-1">
                  {navItems.map((item) => (
                    <Link
                      className="block rounded-2xl px-3 py-2 text-sm font-semibold text-[#4c3929] transition hover:bg-[#f4ede3]"
                      href={item.href}
                      key={item.label}
                      onClick={() => setMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
                {isAuthenticated ? (
                  <div className="mt-3 space-y-1 border-t border-[#efe4d5] pt-3">
                    <button
                      className="block w-full rounded-2xl px-3 py-2 text-left text-sm font-semibold text-[#4c3929] transition hover:bg-[#f4ede3]"
                      onClick={() => setMenuOpen(false)}
                      type="button"
                    >
                      Personal Details
                    </button>
                    <button
                      className="block w-full rounded-2xl px-3 py-2 text-left text-sm font-semibold text-[#4c3929] transition hover:bg-[#f4ede3]"
                      onClick={() => setMenuOpen(false)}
                      type="button"
                    >
                      Order Details
                    </button>
                    <button
                      className="block w-full rounded-2xl px-3 py-2 text-left text-sm font-semibold text-[#8b3a2b] transition hover:bg-[#fff1ee]"
                      onClick={() => {
                        setMenuOpen(false);
                        onSignOut();
                      }}
                      type="button"
                    >
                      Sign out
                    </button>
                  </div>
                ) : (
                  <button
                    className="mt-3 w-full rounded-2xl bg-white px-4 py-2.5 text-left text-sm font-bold text-[#2f2418] shadow-[0_12px_28px_rgba(255,255,255,0.12)]"
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenAuth();
                    }}
                    type="button"
                  >
                    Sign in
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
