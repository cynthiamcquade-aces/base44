import { useRef, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Target, Sparkles, Mic2, Settings, ChevronLeft } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import PageTransition from "./PageTransition";
import FloatingTimer from "./FloatingTimer";
import FloatingCoachEmail from "./FloatingCoachEmail";
import { CoachEmailProvider } from "./CoachEmailContext";
import SaveReminderBanner from "./SaveReminderBanner";

// Bottom tab bar items (mobile only)
const tabItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/goals", label: "Goals", icon: Target },
  { path: "/toolbox", label: "Toolbox", icon: Sparkles },
  { path: "/speech", label: "Speech", icon: Mic2 },
  { path: "/settings", label: "Settings", icon: Settings },
];

// Full sidebar nav items (desktop)
import { ListChecks, BookOpen, BarChart3 } from "lucide-react";
const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/goals", label: "My Goals", icon: Target },
  { path: "/actions", label: "Action Steps", icon: ListChecks },
  { path: "/toolbox", label: "Toolbox", icon: Sparkles },
  { path: "/journal", label: "Journal", icon: BookOpen },
  { path: "/progress", label: "Progress", icon: BarChart3 },
  { path: "/speech", label: "Speech Coach", icon: Mic2 },
  { path: "/settings", label: "Settings", icon: Settings },
];

const ROOT_PATHS = new Set(["/", "/goals", "/toolbox", "/speech", "/settings"]);

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isRootTab = ROOT_PATHS.has(location.pathname);
  const scrollPositions = useRef({});
  const mainRef = useRef(null);

  // Save scroll position before route changes
  const prevPathRef = useRef(location.pathname);
  useEffect(() => {
    const prevPath = prevPathRef.current;
    // Save previous path scroll before the new path renders
    if (prevPath !== location.pathname) {
      const el = mainRef.current;
      if (el) scrollPositions.current[prevPath] = el.scrollTop;
      prevPathRef.current = location.pathname;
    }
  }, [location.pathname]);

  // Restore scroll position after route change renders
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const saved = scrollPositions.current[location.pathname];
    // Use rAF to wait for the new page to paint before restoring
    requestAnimationFrame(() => {
      el.scrollTop = saved ?? 0;
    });
  }, [location.pathname]);

  // Current tab label for mobile header
  const currentTab = tabItems.find(t => t.path === location.pathname);
  const pageLabel = currentTab?.label
    ?? navItems.find(n => n.path === location.pathname)?.label
    ?? "A.C.E.S.";

  return (
    <CoachEmailProvider>
    <div className="min-h-screen bg-background">
      {/* ── Desktop Sidebar ─────────────────────────────── */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 bg-card border-r border-border px-4 py-6">
          <div className="mb-10 px-2">
            <h1 className="font-heading text-2xl font-semibold text-foreground tracking-tight">
              A.C.E.S.
            </h1>
            <p className="text-xs text-muted-foreground mt-1 font-body">
              Step into your greatness
            </p>
          </div>
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="px-3 py-4 mt-auto">
            <div className="bg-secondary/50 rounded-xl p-4">
              <p className="text-xs font-heading italic text-secondary-foreground/80 leading-relaxed">
                "The seeds of greatness are already within you. Let's rub away the chaff."
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Mobile Header ────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border safe-area-top">
        <div className="flex items-center justify-between px-4 py-3">
          {isRootTab ? (
            <h1 className="font-heading text-xl font-semibold">A.C.E.S.</h1>
          ) : (
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-primary text-sm font-medium select-none"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>
          )}
          <span className="font-heading text-base font-semibold absolute left-1/2 -translate-x-1/2">
            {!isRootTab ? pageLabel : ""}
          </span>
          {/* spacer to keep layout balanced */}
          <div className="w-16" />
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────── */}
      <main ref={mainRef} className="lg:pl-64 pt-[53px] lg:pt-0 pb-[calc(64px+env(safe-area-inset-bottom))] lg:pb-0 overflow-y-auto h-screen lg:h-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SaveReminderBanner />
          <AnimatePresence mode="wait" initial={false}>
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </div>
      </main>

      {/* ── Floating Timer ───────────────────────────────── */}
      <FloatingTimer />

      {/* ── Floating Coach Email ─────────────────────────── */}
      <FloatingCoachEmail />

      {/* ── Mobile Bottom Tab Bar ────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border safe-area-bottom">
        <div className="flex items-stretch" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          {tabItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors select-none ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className={`w-5 h-5 ${active ? "stroke-[2.2px]" : "stroke-[1.8px]"}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
    </CoachEmailProvider>
  );
}