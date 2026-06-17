import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboardStats, getApplications, getSkills } from "../store";
import StatusBadge from "../components/StatusBadge";
import { backend, type BackendHealth, type Profile } from "../lib/backend";
import type { Application, DashboardStats } from "../types";
import {
  Briefcase,
  CalendarCheck,
  TrendingUp,
  XCircle,
  Target,
  AlertCircle,
  BookOpen,
  Brain,
  ClipboardCheck,
  ArrowRight,
  ShieldCheck,
  Bot,
  KeyRound,
  PlugZap,
  Terminal,
  CheckCircle2,
} from "lucide-react";

const skillPriorityRank = {
  high: 3,
  medium: 2,
  low: 1,
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentApps, setRecentApps] = useState<Application[]>([]);
  const [agentHealth, setAgentHealth] = useState<BackendHealth | null>(null);
  const [agentProfile, setAgentProfile] = useState<Profile | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setStats(getDashboardStats());
    setRecentApps(getApplications().slice(0, 5));
    backend.health().then(async (health) => {
      setAgentHealth(health);
      if (!health?.ok) return;
      try {
        setAgentProfile(await backend.getProfile());
      } catch {
        setAgentProfile(null);
      }
    });
  }, []);

  if (!stats) return null;

  const cards = [
    { label: "Active Apps", value: stats.activeApplications, icon: Briefcase, color: "bg-blue-500", href: "/applications" },
    { label: "In Progress", value: stats.interviews, icon: CalendarCheck, color: "bg-purple-500", href: "/interviews" },
    { label: "Offers", value: stats.offers, icon: TrendingUp, color: "bg-green-500", href: "/applications" },
    { label: "Rejected", value: stats.rejected, icon: XCircle, color: "bg-red-500", href: "/applications" },
  ];

  const weakSkills = getSkills()
    .filter((s) => s.level < s.targetLevel)
    .sort((a, b) => skillPriorityRank[b.priority] - skillPriorityRank[a.priority])
    .slice(0, 5);
  const launchChecklist = buildAgentLaunchChecklist(agentHealth, agentProfile);
  const completedLaunchItems = launchChecklist.filter((item) => item.complete).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Dashboard</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">Hermes/OpenClaw-native job-search command center</p>
      </div>

      {/* Agent Runtime */}
      <div className="bg-slate-950 dark:bg-slate-900 rounded-lg border border-slate-800 p-5 text-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Bot size={20} className="text-cyan-300" />
              <h2 className="font-semibold">Agent Runtime</h2>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${agentHealth?.ok ? "bg-emerald-400/15 text-emerald-200" : "bg-amber-400/15 text-amber-200"}`}>
                {agentHealth?.ok ? "Backend connected" : "Backend offline"}
              </span>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Bring Hermes Agent, OpenClaw gateway, Codex, Claude, or a custom AI subscription. The portal keeps profile, pipeline, prep, and offers local while the backend calls your chosen agent.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate("/settings")}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-300"
            >
              <KeyRound size={15} /> Configure AI Keys
            </button>
            <button
              onClick={() => navigate("/onboarding")}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-800"
            >
              <PlugZap size={15} /> Agent Setup
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <AgentRuntimeTile
            icon={<Terminal size={16} />}
            label="Active Agent"
            value={agentHealth?.agent ? agentLabel(agentHealth.agent) : "Start backend"}
            detail={agentHealth?.ok ? `REST + MCP ready at ${backend.url}` : "Run: uv run python -m backend.cli serve"}
          />
          <AgentRuntimeTile
            icon={<Bot size={16} />}
            label="Configured Provider"
            value={configuredProvider(agentProfile)}
            detail={providerDetail(agentProfile)}
          />
          <AgentRuntimeTile
            icon={<KeyRound size={16} />}
            label="Key / Subscription"
            value={keyStatus(agentProfile)}
            detail="Raw API keys stay in your shell env, not browser storage or backups."
          />
        </div>

        <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900/80 p-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">AI Launch Checklist</h3>
              <p className="text-xs text-slate-400">Make Hermes, OpenClaw, or your AI gateway ready before interview workflows depend on it.</p>
            </div>
            <span className="text-xs font-medium text-cyan-200">{completedLaunchItems}/{launchChecklist.length} ready</span>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-2">
            {launchChecklist.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.href)}
                className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-left hover:border-cyan-500/60 hover:bg-slate-900"
              >
                {item.complete ? (
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-300" />
                ) : (
                  <AlertCircle size={17} className="mt-0.5 shrink-0 text-amber-300" />
                )}
                <span>
                  <span className="block text-sm font-medium text-slate-100">{item.title}</span>
                  <span className="block text-xs text-slate-400">{item.detail}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Readiness + Next Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(220px,0.8fr)_minmax(0,1.2fr)] gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Search Readiness</p>
              <p className="text-4xl font-bold text-gray-900 dark:text-slate-100 mt-1">{stats.readinessScore}%</p>
            </div>
            <div className="w-11 h-11 bg-cyan-500 rounded-lg flex items-center justify-center">
              <ClipboardCheck size={22} className="text-white" />
            </div>
          </div>
          <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2">
            <div
              className="bg-cyan-500 h-2 rounded-full transition-all"
              style={{ width: `${stats.readinessScore}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-3">
            Based on profile, resume, pipeline, research, practice, and network coverage.
          </p>
          <button
            onClick={() => navigate("/settings")}
            className={`mt-4 w-full flex items-start gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
              stats.backupNeeded
                ? "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-100"
                : "border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:border-emerald-500/40 dark:bg-emerald-950/30 dark:text-emerald-100"
            }`}
          >
            <ShieldCheck size={18} className="mt-0.5 shrink-0" />
            <span>
              <span className="block text-sm font-medium">
                {stats.backupNeeded ? "Backup recommended" : "Backup current"}
              </span>
              <span className="block text-xs opacity-80">{backupLabel(stats.lastBackup)}</span>
            </span>
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 dark:text-slate-100">Next Best Actions</h2>
            <button
              onClick={() => navigate(stats.nextActions[0]?.href || "/onboarding")}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              Start <ArrowRight size={14} className="inline ml-1" />
            </button>
          </div>
          <div className="space-y-2">
            {stats.nextActions.map((action) => (
              <button
                key={action.id}
                onClick={() => navigate(action.href)}
                className="w-full text-left p-3 rounded-lg border border-gray-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/30 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${priorityDot(action.priority)}`} />
                  <span className="text-sm font-medium text-gray-900 dark:text-slate-100">{action.title}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 pl-4">{action.detail}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              onClick={() => navigate(card.href)}
              className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 hover:shadow-md dark:hover:shadow-slate-900/50 transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center`}>
                  <Icon size={20} className="text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{card.value}</p>
              <p className="text-sm text-gray-500 dark:text-slate-400">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Study Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div onClick={() => navigate("/learn")}
          className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 hover:shadow-md dark:hover:shadow-slate-900/50 transition-shadow cursor-pointer">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
              <BookOpen size={20} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{stats.completedModules}/{stats.studyModules}</p>
              <p className="text-sm text-gray-500 dark:text-slate-400">Study Modules</p>
            </div>
          </div>
          <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-1.5">
            <div className="bg-emerald-500 h-1.5 rounded-full"
              style={{ width: `${stats.studyModules > 0 ? (stats.completedModules / stats.studyModules) * 100 : 0}%` }} />
          </div>
        </div>
        <div onClick={() => navigate("/flashcards")}
          className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 hover:shadow-md dark:hover:shadow-slate-900/50 transition-shadow cursor-pointer">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-violet-500 rounded-lg flex items-center justify-center">
              <Brain size={20} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{stats.flashcardsDue}</p>
              <p className="text-sm text-gray-500 dark:text-slate-400">Flashcards Due</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 dark:text-slate-500">Spaced-repetition review</p>
        </div>
      </div>

      {/* Skills Progress + Weak Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 dark:text-slate-100">Skills Progress</h2>
            <Target size={18} className="text-gray-400 dark:text-slate-500" />
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-slate-400">{Math.round(stats.skillsProgress)}% complete</span>
              <span className="text-gray-400 dark:text-slate-500">{getSkills().filter((s) => s.level >= s.targetLevel).length}/{getSkills().length}</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2.5">
              <div className="bg-indigo-500 h-2.5 rounded-full transition-all"
                style={{ width: `${stats.skillsProgress}%` }} />
            </div>
          </div>
          <button onClick={() => navigate("/skills")}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mt-2">
            View all skills &rarr;
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 dark:text-slate-100">Needs Work</h2>
            <AlertCircle size={18} className="text-amber-400 dark:text-amber-300" />
          </div>
          <div className="space-y-2">
            {weakSkills.length === 0 && (
              <p className="text-sm text-gray-400 dark:text-slate-500">All skills at target level!</p>
            )}
            {weakSkills.map((s) => (
              <div key={s.id} className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-slate-300">{s.name}</span>
                <span className="text-xs text-gray-400 dark:text-slate-500">{s.level}/{s.targetLevel}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Applications */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-slate-100">Recent Applications</h2>
          <button onClick={() => navigate("/applications")}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
            View all &rarr;
          </button>
        </div>
        <div className="space-y-0">
          {recentApps.length === 0 && (
            <div className="text-center py-8 px-4">
              <Briefcase size={36} className="mx-auto mb-3 text-gray-300 dark:text-slate-600" />
              <p className="text-sm text-gray-600 dark:text-slate-400 mb-1 font-medium">No applications tracked yet</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">Paste a JD or add a company to get started.</p>
              <button onClick={() => navigate("/evaluate")}
                className="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-400">
                Evaluate a Job Description
              </button>
            </div>
          )}
          {recentApps.map((app) => (
            <div key={app.id} onClick={() => navigate(`/applications/${app.id}`)}
              className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-slate-700 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-700/50 px-2 -mx-2 rounded-lg cursor-pointer">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{app.role}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">{app.company}</p>
              </div>
              <StatusBadge status={app.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function priorityDot(priority: "critical" | "high" | "medium" | "low") {
  const colors = {
    critical: "bg-red-500",
    high: "bg-amber-500",
    medium: "bg-sky-500",
    low: "bg-slate-300 dark:bg-slate-500",
  };
  return colors[priority];
}

function backupLabel(lastBackup?: string) {
  if (!lastBackup) return "No backup recorded yet";
  const backupDate = new Date(lastBackup);
  if (Number.isNaN(backupDate.getTime())) return "Backup date unavailable";
  const days = Math.floor((Date.now() - backupDate.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Backed up today";
  if (days === 1) return "Backed up yesterday";
  return `Last backup ${days} days ago`;
}

function AgentRuntimeTile({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
        <span className="text-cyan-300">{icon}</span>
        {label}
      </div>
      <p className="mt-2 text-sm font-semibold text-slate-100">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{detail}</p>
    </div>
  );
}

function agentLabel(agent: string) {
  const labels: Record<string, string> = {
    hermes: "Hermes Agent",
    http: "OpenClaw / HTTP gateway",
    claude: "Claude Code",
    codex: "Codex CLI",
    offline: "Offline fallback",
  };
  return labels[agent] || agent;
}

function configuredProvider(profile: Profile | null) {
  if (!profile) return "Profile unavailable";
  if (profile.agent.backend === "http") {
    return isOpenClawEndpoint(profile.agent.endpoint) ? "OpenClaw gateway" : "HTTP AI gateway";
  }
  return agentLabel(profile.agent.backend);
}

function providerDetail(profile: Profile | null) {
  if (!profile) return "Open Settings after backend connects.";
  if (profile.agent.backend === "http") {
    return profile.agent.endpoint || "Set gateway endpoint in Settings.";
  }
  if (profile.agent.backend === "offline") return "Switch to Hermes, OpenClaw/HTTP, Codex, or Claude for AI output.";
  return profile.agent.model || "Uses local CLI login/subscription.";
}

function keyStatus(profile: Profile | null) {
  if (!profile) return "Not configured";
  if (profile.agent.backend !== "http") return "CLI login";
  return profile.agent.api_key_env ? `Env: ${profile.agent.api_key_env}` : "Env var needed";
}

function isOpenClawEndpoint(endpoint: string) {
  return endpoint.toLowerCase().includes("openclaw");
}

type AgentLaunchChecklistItem = {
  id: string;
  title: string;
  detail: string;
  complete: boolean;
  href: string;
};

function buildAgentLaunchChecklist(
  health: BackendHealth | null,
  profile: Profile | null,
): AgentLaunchChecklistItem[] {
  const backendConnected = Boolean(health?.ok);
  const agent = profile?.agent;
  const providerConfigured = Boolean(agent && agent.backend !== "offline");
  const isHttpProvider = agent?.backend === "http";
  const hasEndpoint = !isHttpProvider || Boolean(agent.endpoint?.trim());
  const hasCredentialPath = Boolean(agent && (
    agent.backend !== "http" || agent.api_key_env.trim()
  ));
  const hasProfileGrounding = Boolean(profile && (
    profile.target_roles?.length ||
    profile.career?.current_title?.trim() ||
    profile.skills?.core?.length
  ));

  return [
    {
      id: "backend",
      title: "Start local backend",
      detail: backendConnected ? `${agentLabel(health?.agent || "offline")} responding` : "Run uv run python -m backend.cli serve",
      complete: backendConnected,
      href: "/settings",
    },
    {
      id: "provider",
      title: "Choose AI provider",
      detail: providerConfigured ? configuredProvider(profile) : "Select Hermes, OpenClaw/HTTP, Codex, Claude, or custom gateway.",
      complete: providerConfigured,
      href: "/settings",
    },
    {
      id: "credentials",
      title: "Connect subscription credentials",
      detail: !agent
        ? "Connect backend so the portal can read credential settings."
        : agent.backend === "http"
          ? agent.api_key_env ? `Backend will read ${agent.api_key_env} from shell env.` : "Add the env var name for your OpenClaw/custom key."
          : agent.backend === "offline"
            ? "Switch away from offline mode to use an AI subscription."
            : "CLI login/subscription handles credentials.",
      complete: hasCredentialPath && providerConfigured,
      href: "/settings",
    },
    {
      id: "endpoint",
      title: "Set gateway endpoint",
      detail: isHttpProvider
        ? agent.endpoint || "Set OpenClaw/custom endpoint URL."
        : "Local CLI providers do not need an HTTP endpoint.",
      complete: hasEndpoint && providerConfigured,
      href: "/settings",
    },
    {
      id: "profile",
      title: "Ground AI in your profile",
      detail: hasProfileGrounding ? "Target role, career, or core skills are available." : "Add target roles, current title, or core skills.",
      complete: hasProfileGrounding,
      href: "/settings",
    },
  ];
}
