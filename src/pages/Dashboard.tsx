import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboardStats, getApplications, getSkills } from "../store";
import StatusBadge from "../components/StatusBadge";
import type { Application, InterviewPrep } from "../types";
import {
  Briefcase,
  CalendarCheck,
  TrendingUp,
  XCircle,
  Target,
  AlertCircle,
  BookOpen,
  Brain,
} from "lucide-react";

interface Stats {
  totalApplications: number;
  activeApplications: number;
  interviews: number;
  offers: number;
  rejected: number;
  skillsProgress: number;
  upcomingInterviews: InterviewPrep[];
  studyModules: number;
  completedModules: number;
  flashcardsDue: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentApps, setRecentApps] = useState<Application[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    setStats(getDashboardStats());
    setRecentApps(getApplications().slice(0, 5));
  }, []);

  if (!stats) return null;

  const cards = [
    {
      label: "Active Apps",
      value: stats.activeApplications,
      icon: Briefcase,
      color: "bg-blue-500",
      href: "/applications",
    },
    {
      label: "In Progress",
      value: stats.interviews,
      icon: CalendarCheck,
      color: "bg-purple-500",
      href: "/interviews",
    },
    {
      label: "Offers",
      value: stats.offers,
      icon: TrendingUp,
      color: "bg-green-500",
      href: "/applications",
    },
    {
      label: "Rejected",
      value: stats.rejected,
      icon: XCircle,
      color: "bg-red-500",
      href: "/applications",
    },
  ];

  const weakSkills = getSkills()
    .filter((s) => s.level < s.targetLevel)
    .sort((a, b) => b.priority.localeCompare(a.priority))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Your interview prep at a glance</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              onClick={() => navigate(card.href)}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center`}>
                  <Icon size={20} className="text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-sm text-gray-500">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Study Progress Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div
          onClick={() => navigate("/learn")}
          className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
              <BookOpen size={20} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.completedModules}/{stats.studyModules}</p>
              <p className="text-sm text-gray-500">Study Modules</p>
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className="bg-emerald-500 h-1.5 rounded-full"
              style={{ width: `${stats.studyModules > 0 ? (stats.completedModules / stats.studyModules) * 100 : 0}%` }} />
          </div>
        </div>
        <div
          onClick={() => navigate("/flashcards")}
          className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-violet-500 rounded-lg flex items-center justify-center">
              <Brain size={20} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.flashcardsDue}</p>
              <p className="text-sm text-gray-500">Flashcards Due</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">Spaced-repetition review</p>
        </div>
      </div>

      {/* Skills Progress + Weak Areas */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Skills Progress</h2>
            <Target size={18} className="text-gray-400" />
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">{Math.round(stats.skillsProgress)}% complete</span>
              <span className="text-gray-400">{getSkills().filter((s) => s.level >= s.targetLevel).length}/{getSkills().length}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div
                className="bg-indigo-500 h-2.5 rounded-full transition-all"
                style={{ width: `${stats.skillsProgress}%` }}
              />
            </div>
          </div>
          <button
            onClick={() => navigate("/skills")}
            className="text-sm text-indigo-600 hover:text-indigo-700 mt-2"
          >
            View all skills &rarr;
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Needs Work</h2>
            <AlertCircle size={18} className="text-amber-400" />
          </div>
          <div className="space-y-2">
            {weakSkills.length === 0 && (
              <p className="text-sm text-gray-400">All skills at target level!</p>
            )}
            {weakSkills.map((s) => (
              <div key={s.id} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{s.name}</span>
                <span className="text-xs text-gray-400">
                  {s.level}/{s.targetLevel}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Applications */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Recent Applications</h2>
          <button
            onClick={() => navigate("/applications")}
            className="text-sm text-indigo-600 hover:text-indigo-700"
          >
            View all &rarr;
          </button>
        </div>
        <div className="space-y-0">
          {recentApps.length === 0 && (
            <div className="text-center py-8 px-4">
              <Briefcase size={36} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-600 mb-1 font-medium">No applications tracked yet</p>
              <p className="text-xs text-gray-400 mb-4">Paste a JD or add a company to get started.</p>
              <button
                onClick={() => navigate("/evaluate")}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
              >
                Evaluate a Job Description
              </button>
            </div>
          )}
          {recentApps.map((app) => (
            <div
              key={app.id}
              onClick={() => navigate(`/applications/${app.id}`)}
              className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 px-2 -mx-2 rounded-lg cursor-pointer"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{app.role}</p>
                <p className="text-xs text-gray-500">{app.company}</p>
              </div>
              <StatusBadge status={app.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
