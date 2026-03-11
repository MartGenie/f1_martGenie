"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearAccessToken, fetchCurrentUser, readAccessToken } from "@/lib/auth";
import AuthModal from "@/src/components/AuthModal";
import Navbar from "@/src/components/Navbar";

const systemHighlights = [
  {
    title: "Multi-agent procurement engine",
    detail: "Buyer and seller agents negotiate against hard constraints instead of producing soft suggestions.",
  },
  {
    title: "Operational transparency",
    detail: "Timeline logs, bundle rationale, and negotiation history stay visible while the system executes.",
  },
  {
    title: "Decision-ready output",
    detail: "Plans are scored, itemized, and kept actionable so the user can bargain or check out without context switching.",
  },
];

const capabilityCards = [
  {
    eyebrow: "Product graph",
    title: "Structured recommendation surface",
    copy: "The system turns product search into ranked bundle options with clear price anchors and fit confidence.",
    image: "/main_page/product.png",
  },
  {
    eyebrow: "Agent dialogue",
    title: "Negotiation as a controllable workflow",
    copy: "Buyer intent, seller response, and guard-rail validation are exposed as a live operating trace.",
    image: "/main_page/negotiate.png",
  },
  {
    eyebrow: "Execution console",
    title: "Chat that behaves like an instrument panel",
    copy: "Pipeline logs and plan generation read like a monitored system, not a generic assistant transcript.",
    image: "/main_page/chat.png",
  },
];

const heroProducts = [
  {
    category: "Lead seating",
    title: '91" Beige Modern Chesterfield Sofa 3-Seater Button Tufted Velvet',
    price: "$1,999.99",
    image:
      "https://img5.su-cdn.com/cdn-cgi/image/width=750,height=750,format=webp/mall/file/2022/06/29/f7a667c79a54d587424a51794e842bf0.jpg",
  },
  {
    category: "Anchor table",
    title: "Modern White Extendable Coffee Table with Ring-shaped Metal Pedestal",
    price: "$649.99",
    image:
      "https://img5.su-cdn.com/cdn-cgi/image/width=750,height=750,format=webp/mall/2021/04/06/e6490b902737494e9bb56e7c6566f4be.jpg",
  },
  {
    category: "Media console",
    title: "Crator Wood Modern Extendable TV Stand Black and Gray Media Console with 3-Drawer",
    price: "$599.99",
    image:
      "https://img5.su-cdn.com/cdn-cgi/image/width=750,height=750,format=webp/mall/file/2022/01/12/1c6ce4a8e77145bf937849583358663a.jpg",
  },
];

const heroProductLayout = [
  { wrapper: "left-12 top-10 w-[64%]", image: "aspect-[0.92/1]", rotation: "-8deg", baseZIndex: 10 },
  { wrapper: "right-8 top-24 w-[42%]", image: "aspect-[0.95/1]", rotation: "6deg", baseZIndex: 30 },
  { wrapper: "bottom-8 right-16 w-[52%]", image: "aspect-[1.08/1]", rotation: "-3deg", baseZIndex: 20 },
];

const executionFeed = [
  "[01] Requirement parsed: living room / two cats / budget-sensitive",
  "[02] Memory profile loaded: pet-safe materials prioritized",
  "[03] 42 candidate SKUs matched across seating, storage, lighting",
  "[04] 3 bundle configurations scored for fit, risk, and spend",
  "[05] Buyer agent armed with target and max acceptable thresholds",
];

export default function HomePage() {
  const router = useRouter();
  const [authOpen, setAuthOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeHeroProduct, setActiveHeroProduct] = useState<number | null>(null);

  useEffect(() => {
    async function syncAuthState() {
      const token = readAccessToken();
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      try {
        await fetchCurrentUser(token);
        setIsAuthenticated(true);
      } catch {
        clearAccessToken();
        setIsAuthenticated(false);
      }
    }

    void syncAuthState();
  }, []);

  function handleSignOut() {
    clearAccessToken();
    setIsAuthenticated(false);
  }

  function handleTryNow() {
    if (isAuthenticated) {
      router.push("/chat");
      return;
    }
    setAuthOpen(true);
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050505] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(79,70,229,0.18),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(56,189,248,0.14),transparent_24%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.06),transparent_38%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_12%,transparent_88%,rgba(255,255,255,0.02))]" />

      <div className="relative">
        <Navbar
          isAuthenticated={isAuthenticated}
          onOpenAuth={() => setAuthOpen(true)}
          onSignOut={handleSignOut}
        />

        <section className="mx-auto w-full max-w-[1480px] px-6 pb-12 pt-28" id="hero">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-stretch">
            <div className="flex max-w-4xl flex-col lg:min-h-[620px] lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/70 backdrop-blur-xl">
                  AI-native procurement stack
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.75)]" />
                </div>
                <h1 className="mt-8 max-w-4xl text-5xl font-black tracking-[-0.04em] text-white md:text-7xl md:leading-[0.96]">
                  The Future of Complex Procurement.
                  <span className="mt-3 block bg-[linear-gradient(90deg,#ffffff_0%,#c7d2fe_32%,#7dd3fc_68%,#ffffff_100%)] bg-clip-text text-transparent">
                    Driven by Multi-Agent Negotiation.
                  </span>
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-white/60 md:text-xl">
                  Nexbuy turns product discovery, bundle ranking, and price negotiation into a single
                  controlled workflow. It behaves less like a storefront and more like an execution
                  engine for high-value purchase decisions.
                </p>
                <div className="mt-10 grid gap-3 md:grid-cols-3">
                  {systemHighlights.map((item, index) => (
                    <article
                      className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl transition duration-300 hover:border-indigo-400/35 hover:bg-white/[0.05] hover:shadow-[0_0_60px_rgba(79,70,229,0.15)]"
                      key={item.title}
                      style={{ animation: `fadeUp 0.6s ease ${index * 0.08}s both` }}
                    >
                      <p className="text-sm font-semibold tracking-[-0.02em] text-white">{item.title}</p>
                      <p className="mt-2 text-sm leading-6 text-white/55">{item.detail}</p>
                    </article>
                  ))}
                </div>
              </div>
              <div className="mt-12">
                <div className="flex justify-center lg:justify-end lg:pr-[-2px] xl:pr-[-18px]">
                  <button
                    className="group relative inline-flex min-h-16 items-center justify-center overflow-hidden rounded-[24px] p-[1px] transition duration-300 hover:scale-[1.02] md:min-h-[76px]"
                    onClick={handleTryNow}
                    type="button"
                  >
                    <span
                      aria-hidden="true"
                      className="button-beam pointer-events-none absolute inset-[-35%] rounded-[28px] opacity-80 blur-md transition duration-300 group-hover:opacity-100"
                    />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 rounded-[22px] bg-[radial-gradient(circle_at_center,rgba(125,211,252,0.14),transparent_58%)] opacity-0 transition duration-300 group-hover:opacity-100"
                    />
                    <span className="relative z-10 inline-flex items-center gap-4 rounded-[23px] border border-white/10 bg-[linear-gradient(180deg,#0d1015_0%,#050608_100%)] px-10 py-4 text-xl font-black tracking-[-0.02em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_50px_rgba(0,0,0,0.45)] md:px-14 md:py-5 md:text-2xl">
                      <span className="absolute inset-0 rounded-[23px] bg-[linear-gradient(115deg,transparent_18%,rgba(255,255,255,0.02)_34%,rgba(125,211,252,0.12)_50%,rgba(255,255,255,0.03)_58%,transparent_76%)] opacity-70 transition duration-300 group-hover:opacity-100" />
                      <span className="relative z-10">Initialize Workspace</span>
                      <span className="relative z-10 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-lg text-sky-200 transition duration-300 group-hover:border-sky-300/30 group-hover:bg-sky-300/10 group-hover:text-white">
                        ↗
                      </span>
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <aside
              className="relative h-[620px] rounded-[36px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-2xl shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_40px_120px_rgba(79,70,229,0.12)]"
              onMouseLeave={() => setActiveHeroProduct(null)}
            >
              {heroProducts.map((product, index) => {
                const layout = heroProductLayout[index];
                const isActive = activeHeroProduct === index;
                return (
                  <div
                    className={`absolute ${layout.wrapper} overflow-hidden rounded-[30px] border bg-black/35 transition-all duration-500 ease-out`}
                    key={product.title}
                    onMouseEnter={() => setActiveHeroProduct(index)}
                    style={{
                      zIndex: isActive ? 40 : layout.baseZIndex,
                      transform: `rotate(${layout.rotation}) scale(${isActive ? 1.045 : 1}) translateY(${isActive ? "-10px" : "0px"})`,
                      borderColor: isActive ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.10)",
                      boxShadow: isActive
                        ? "0 35px 120px rgba(79,70,229,0.22), 0 0 0 1px rgba(255,255,255,0.05)"
                        : "0 30px 90px rgba(0,0,0,0.45)",
                      filter: activeHeroProduct !== null && !isActive ? "brightness(0.78) saturate(0.9)" : "none",
                    }}
                  >
                    <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent)] opacity-0 transition duration-300" style={{ opacity: isActive ? 1 : 0 }} />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={product.title}
                      className={`${layout.image} w-full object-cover transition duration-500 ${isActive ? "scale-[1.04]" : "scale-100"}`}
                      src={product.image}
                    />
                  </div>
                );
              })}
              <div className="absolute left-6 top-8 h-40 w-40 rounded-full bg-indigo-500/18 blur-3xl" />
              <div className="absolute bottom-12 right-6 h-36 w-36 rounded-full bg-cyan-400/15 blur-3xl" />
            </aside>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-[1480px] gap-5 px-6 py-6 lg:grid-cols-[0.8fr_1.2fr]" id="system">
          <article className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl">
            <p className="text-xs uppercase tracking-[0.22em] text-white/35">System trace</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white md:text-4xl">
              Built for monitored decisions, not decorative AI.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-8 text-white/58">
              The interface should feel like a procurement terminal. Every recommendation is tied
              to execution state, every bargain is bounded by constraints, and every output is
              structured for action.
            </p>
          </article>
          <article className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-5 backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/35">Execution log</p>
                <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-white">Agent pipeline</h3>
              </div>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 font-mono text-[11px] text-emerald-300">
                RUNNING
              </span>
            </div>
            <div className="mt-4 space-y-3 font-mono text-sm">
              {executionFeed.map((line, index) => (
                <div
                  className="rounded-2xl border border-white/8 bg-black/35 px-4 py-3 text-emerald-300/90"
                  key={line}
                  style={{ animation: `fadeUp 0.55s ease ${index * 0.1}s both` }}
                >
                  {line}
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="mx-auto w-full max-w-[1480px] px-6 py-8">
          <div className="flex flex-col items-start justify-between gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-white/35">Core surfaces</p>
              <h2 className="mt-2 text-4xl font-black tracking-[-0.04em] text-white md:text-5xl">
                A cold, high-contrast interface for agentic commerce.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-white/55 md:text-right">
              Recommendation, negotiation, and execution are presented as linked surfaces with low
              visual noise and high operational density.
            </p>
          </div>
          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {capabilityCards.map((card, index) => (
              <article
                className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-2xl transition duration-300 hover:border-white/18 hover:bg-white/[0.055]"
                key={card.title}
                style={{ animation: `fadeUp 0.7s ease ${index * 0.08}s both` }}
              >
                <div className="pointer-events-none absolute -bottom-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-indigo-500/0 blur-3xl transition duration-300 group-hover:bg-indigo-500/18" />
                <div className="pointer-events-none absolute inset-x-16 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.45),transparent)] opacity-0 transition group-hover:opacity-100" />
                <p className="text-xs uppercase tracking-[0.22em] text-white/35">{card.eyebrow}</p>
                <h3 className="mt-2 text-2xl font-black tracking-[-0.03em] text-white">{card.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/55">{card.copy}</p>
                <div className="mt-5 overflow-hidden rounded-[24px] border border-white/10 bg-black/40">
                  <Image
                    alt={card.title}
                    className="h-auto w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                    height={760}
                    src={card.image}
                    width={1080}
                  />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1480px] px-6 py-14">
          <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] px-6 py-10 backdrop-blur-2xl md:px-10">
            <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-[linear-gradient(90deg,transparent,rgba(125,211,252,0.8),transparent)]" />
            <p className="text-xs uppercase tracking-[0.22em] text-white/35">Final call</p>
            <h2 className="mt-3 max-w-4xl text-4xl font-black tracking-[-0.04em] text-white md:text-6xl">
              Stop browsing like a shopper. Start operating like a buying desk.
            </h2>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-white/58">
              Move from vague product discovery to explicit procurement logic. Search, compare,
              bargain, and order through a single AI-native surface.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                className="inline-flex h-12 items-center rounded-2xl bg-white px-6 text-sm font-bold text-black transition hover:bg-white/90"
                href="/chat"
              >
                Open the Console
              </Link>
              <button
                className="inline-flex h-12 items-center rounded-2xl border border-white/12 bg-white/5 px-6 text-sm font-semibold text-white/80 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/8"
                onClick={() => setAuthOpen(true)}
                type="button"
              >
                Authenticate
              </button>
            </div>
          </div>
        </section>
      </div>

      <AuthModal
        onAuthSuccess={() => {
          setIsAuthenticated(true);
          setStatusMessage("Signed in. You can now open the workspace.");
        }}
        onClose={() => setAuthOpen(false)}
        open={authOpen}
      />

      <style jsx global>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes buttonBeamSpin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .button-beam {
          background: conic-gradient(
            from 90deg,
            rgba(125, 211, 252, 0.02) 0deg,
            rgba(125, 211, 252, 0.24) 60deg,
            rgba(255, 255, 255, 0.06) 120deg,
            rgba(99, 102, 241, 0.22) 200deg,
            rgba(125, 211, 252, 0.02) 360deg
          );
          animation: buttonBeamSpin 7s linear infinite;
        }
      `}</style>
    </main>
  );
}
