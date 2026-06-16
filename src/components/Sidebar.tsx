import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Briefcase,
  GraduationCap,
  BookOpen,
  FileText,
  Building2,
  ChevronRight,
  Library,
  BrainCircuit,
  Globe,
  Search,
  Bell,
  Trophy,
  Settings,
  Scale,
  Users,
  Sparkles,
  BookMarked,
} from "lucide-react";
import { getReminders } from "../store";
import { backend, type Profile } from "../lib/backend";

const sections = [
  {
    label: "Pipeline",
    links: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard },
      { to: "/applications", label: "Applications", icon: Briefcase },
      { to: "/compare", label: "Compare Jobs", icon: Scale },
      { to: "/contacts", label: "Contacts", icon: Users },
      { to: "/offers", label: "Offers", icon: Trophy },
      { to: "/journal", label: "Journal", icon: BookOpen },
    ],
  },
  {
    label: "Prep",
    links: [
      { to: "/interviews", label: "Interview Prep", icon: GraduationCap },
      { to: "/stories", label: "Story Bank", icon: BookMarked },
      { to: "/learn", label: "Learn", icon: BookOpen },
      { to: "/flashcards", label: "Flashcards", icon: BrainCircuit },
      { to: "/resources", label: "Resources", icon: Globe },
    ],
  },
  {
    label: "Tools",
    links: [
      { to: "/evaluate", label: "JD Evaluator", icon: Search },
      { to: "/reminders", label: "Reminders", icon: Bell, badge: "reminders" as const },
    ],
  },
  {
    label: "Library",
    links: [
      { to: "/skills", label: "Skills", icon: Library },
      { to: "/resume", label: "Resume", icon: FileText },
      { to: "/research", label: "Research", icon: Building2 },
    ],
  },
  {
    label: "Config",
    links: [
      { to: "/onboarding", label: "Onboarding", icon: Sparkles },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const location = useLocation();
  const [pendingReminders, setPendingReminders] = useState(0);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const update = () => setPendingReminders(getReminders().filter((r) => r.status !== "done").length);
    update();
    const interval = setInterval(update, 5000);
    window.addEventListener("storage", update);

    let profileInterval: ReturnType<typeof setInterval> | null = null;
    backend.getProfile().then((p) => {
      setProfile(p);
      profileInterval = setInterval(() => {
        backend.getProfile().then(setProfile).catch(() => {});
      }, 10_000);
    }).catch(() => {
      setProfile(null);
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", update);
      if (profileInterval) clearInterval(profileInterval);
    };
  }, [location.pathname]);

  const profileName = profile?.identity?.name?.trim() || "";

  return (
    <aside
      aria-label="Primary navigation"
      className="flex w-full shrink-0 flex-col border-b border-gray-200 bg-white transition-colors dark:border-slate-700 dark:bg-slate-900 lg:h-screen lg:w-64 lg:border-b-0 lg:border-r"
    >
      {/* Header */}
      <div className="border-b border-gray-100 p-4 dark:border-slate-700 lg:p-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center">
            <Briefcase size={16} className="text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900 dark:text-slate-100 text-sm">Interview Prep Portal</h1>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {profileName || "Interview Prep Portal"}
            </p>
          </div>
        </div>
      </div>

      {/* Nav grouped by section */}
      <nav aria-label="Primary" className="flex gap-2 overflow-x-auto p-3 lg:block lg:flex-1 lg:space-y-4 lg:overflow-x-visible lg:overflow-y-auto">
        {sections.map((section) => (
          <div key={section.label} className="contents lg:block">
            <div className="hidden px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500 lg:block">
              {section.label}
            </div>
            <div className="flex gap-2 lg:block lg:space-y-0.5">
              {section.links.map((link) => {
                const Icon = link.icon;
                const isActive = link.to === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(link.to);
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors lg:gap-3 ${
                      isActive
                        ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
                        : "text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-200"
                    }`}
                  >
                    <Icon size={16} />
                    <span>{link.label}</span>
                    {link.badge === "reminders" ? (
                      <span className="ml-auto flex items-center gap-2">
                        {pendingReminders > 0 && (
                          <span className="bg-amber-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                            {pendingReminders}
                          </span>
                        )}
                        {isActive && <ChevronRight size={14} className="hidden text-indigo-400 dark:text-indigo-300 lg:block" />}
                      </span>
                    ) : (
                      isActive && <ChevronRight size={14} className="ml-auto hidden text-indigo-400 dark:text-indigo-300 lg:block" />
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="hidden p-4 border-t border-gray-100 dark:border-slate-700 lg:block">
        <p className="text-xs text-gray-400 dark:text-slate-500 text-center">
          Interview Prep Portal
        </p>
      </div>
    </aside>
  );
}
