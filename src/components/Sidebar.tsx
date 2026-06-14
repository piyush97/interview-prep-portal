import { NavLink, useLocation } from "react-router-dom";
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
} from "lucide-react";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/applications", label: "Applications", icon: Briefcase },
  { to: "/interviews", label: "Interview Prep", icon: GraduationCap },
  { to: "/learn", label: "Learn", icon: BookOpen },
  { to: "/flashcards", label: "Flashcards", icon: BrainCircuit },
  { to: "/resources", label: "Resources", icon: Globe },
  { to: "/evaluate", label: "JD Evaluator", icon: Search },
  { to: "/reminders", label: "Reminders", icon: Bell },
  { to: "/compare", label: "Compare Jobs", icon: Scale },
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/offers", label: "Offers", icon: Trophy },
  { to: "/journal", label: "Journal", icon: BookOpen },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/skills", label: "Skills", icon: Library },
  { to: "/resume", label: "Resume", icon: FileText },
  { to: "/research", label: "Research", icon: Building2 },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Briefcase size={16} className="text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900 text-sm">Prep Portal</h1>
            <p className="text-xs text-gray-500">Piyush Mehta</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = link.to === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(link.to);
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon size={18} />
              <span>{link.label}</span>
              {isActive && <ChevronRight size={14} className="ml-auto text-indigo-400" />}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">
          Interview Prep Portal v1.0
        </p>
      </div>
    </aside>
  );
}
