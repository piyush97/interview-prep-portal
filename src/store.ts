import type { AppData, Application, InterviewPrep, Skill, CompanyResearch, ResumeVersion } from "./types";

const STORAGE_KEY = "interview-prep-portal-data";

const defaultData: AppData = {
  applications: [],
  interviews: [],
  skills: [
    { id: "s1", name: "React / Next.js", category: "frontend", level: 5, targetLevel: 5, priority: "high", notes: "Strong, 6+ years", resources: [] },
    { id: "s2", name: "TypeScript", category: "frontend", level: 5, targetLevel: 5, priority: "high", notes: "Daily driver", resources: [] },
    { id: "s3", name: "Python", category: "backend", level: 4, targetLevel: 5, priority: "high", notes: "AI/ML work", resources: [] },
    { id: "s4", name: "Node.js / Bun", category: "backend", level: 4, targetLevel: 5, priority: "high", notes: "APIs and backends", resources: [] },
    { id: "s5", name: "LangChain / LLMs", category: "ai-ml", level: 4, targetLevel: 5, priority: "high", notes: "MCP, agents, RAG", resources: [] },
    { id: "s6", name: "Azure AI", category: "cloud", level: 3, targetLevel: 4, priority: "high", notes: "Certified AI Engineer", resources: [] },
    { id: "s7", name: "PostgreSQL", category: "database", level: 3, targetLevel: 4, priority: "medium", notes: "Solid basics", resources: [] },
    { id: "s8", name: "Docker / Containers", category: "devops", level: 3, targetLevel: 4, priority: "medium", notes: "Proxmox homelab", resources: [] },
    { id: "s9", name: "MCP / Agentic Workflows", category: "ai-ml", level: 4, targetLevel: 5, priority: "high", notes: "Building MCP servers", resources: [] },
    { id: "s10", name: "System Design", category: "soft-skills", level: 3, targetLevel: 4, priority: "high", notes: "Need more practice", resources: [] },
    { id: "s11", name: "Astro", category: "frontend", level: 4, targetLevel: 4, priority: "medium", notes: "Personal site", resources: [] },
    { id: "s12", name: "Azure OpenAI / GPT", category: "ai-ml", level: 4, targetLevel: 5, priority: "high", notes: "API integration", resources: [] },
    { id: "s13", name: "C# / .NET", category: "backend", level: 2, targetLevel: 3, priority: "low", notes: "BDO background", resources: [] },
    { id: "s14", name: "RAG / Vector DBs", category: "ai-ml", level: 4, targetLevel: 5, priority: "high", notes: "Key interview topic", resources: [] },
    { id: "s15", name: "System Architecture", category: "soft-skills", level: 3, targetLevel: 4, priority: "high", notes: "For solution architect roles", resources: [] },
  ],
  companies: [],
  resumes: [],
};

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultData, ...parsed, skills: parsed.skills || defaultData.skills };
    }
  } catch { /* ignore */ }
  return { ...defaultData, skills: [...defaultData.skills] };
}

function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Store singleton
let _data: AppData | null = null;

function getData(): AppData {
  if (!_data) _data = loadData();
  return _data;
}

function persist(): void {
  if (_data) saveData(_data);
}

// --- Application CRUD ---
export function getApplications(): Application[] {
  return getData().applications.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function addApplication(app: Application): void {
  getData().applications.push(app);
  persist();
}

export function updateApplication(id: string, updates: Partial<Application>): void {
  const data = getData();
  const idx = data.applications.findIndex(a => a.id === id);
  if (idx !== -1) {
    data.applications[idx] = { ...data.applications[idx], ...updates, updatedAt: new Date().toISOString() };
    persist();
  }
}

export function deleteApplication(id: string): void {
  const data = getData();
  data.applications = data.applications.filter(a => a.id !== id);
  data.interviews = data.interviews.filter(i => i.company !== data.applications.find(a => a.id === id)?.company);
  persist();
}

// --- Interview Prep CRUD ---
export function getInterviews(): InterviewPrep[] {
  return getData().interviews.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function addInterview(interview: InterviewPrep): void {
  getData().interviews.push(interview);
  persist();
}

export function updateInterview(id: string, updates: Partial<InterviewPrep>): void {
  const data = getData();
  const idx = data.interviews.findIndex(i => i.id === id);
  if (idx !== -1) {
    data.interviews[idx] = { ...data.interviews[idx], ...updates, updatedAt: new Date().toISOString() };
    persist();
  }
}

export function deleteInterview(id: string): void {
  const data = getData();
  data.interviews = data.interviews.filter(i => i.id !== id);
  persist();
}

// --- Skills CRUD ---
export function getSkills(): Skill[] {
  return getData().skills;
}

export function updateSkill(id: string, updates: Partial<Skill>): void {
  const data = getData();
  const idx = data.skills.findIndex(s => s.id === id);
  if (idx !== -1) {
    data.skills[idx] = { ...data.skills[idx], ...updates };
    persist();
  }
}

export function addSkill(skill: Skill): void {
  getData().skills.push(skill);
  persist();
}

// --- Company Research CRUD ---
export function getCompanies(): CompanyResearch[] {
  return getData().companies.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function addCompany(company: CompanyResearch): void {
  getData().companies.push(company);
  persist();
}

export function updateCompany(id: string, updates: Partial<CompanyResearch>): void {
  const data = getData();
  const idx = data.companies.findIndex(c => c.id === id);
  if (idx !== -1) {
    data.companies[idx] = { ...data.companies[idx], ...updates, updatedAt: new Date().toISOString() };
    persist();
  }
}

export function deleteCompany(id: string): void {
  const data = getData();
  data.companies = data.companies.filter(c => c.id !== id);
  persist();
}

// --- Resume CRUD ---
export function getResumes(): ResumeVersion[] {
  return getData().resumes;
}

export function addResume(resume: ResumeVersion): void {
  getData().resumes.push(resume);
  persist();
}

export function updateResume(id: string, updates: Partial<ResumeVersion>): void {
  const data = getData();
  const idx = data.resumes.findIndex(r => r.id === id);
  if (idx !== -1) {
    data.resumes[idx] = { ...data.resumes[idx], ...updates, lastUpdated: new Date().toISOString() };
    persist();
  }
}

export function deleteResume(id: string): void {
  const data = getData();
  data.resumes = data.resumes.filter(r => r.id !== id);
  persist();
}

// --- Export / Import ---
export function exportData(): string {
  return JSON.stringify(getData(), null, 2);
}

export function importData(json: string): boolean {
  try {
    const parsed = JSON.parse(json);
    if (!parsed.applications || !parsed.skills) return false;
    _data = parsed;
    persist();
    return true;
  } catch {
    return false;
  }
}

export function resetData(): void {
  _data = { ...defaultData, skills: [...defaultData.skills] };
  persist();
}

// --- Dashboard stats ---
export function getDashboardStats() {
  const data = getData();
  const apps = data.applications;
  return {
    totalApplications: apps.length,
    activeApplications: apps.filter(a => !["rejected", "accepted", "withdrawn", "offer"].includes(a.status)).length,
    interviews: apps.filter(a => ["phone-screen", "technical", "onsite"].includes(a.status)).length,
    offers: apps.filter(a => a.status === "offer").length,
    rejected: apps.filter(a => a.status === "rejected").length,
    skillsProgress: data.skills.filter(s => s.level >= s.targetLevel).length / Math.max(data.skills.length, 1) * 100,
    upcomingInterviews: data.interviews.filter(i => new Date(i.date) > new Date()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
  };
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    saved: "bg-gray-100 text-gray-700",
    applied: "bg-blue-100 text-blue-700",
    "phone-screen": "bg-yellow-100 text-yellow-700",
    technical: "bg-purple-100 text-purple-700",
    onsite: "bg-orange-100 text-orange-700",
    offer: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    accepted: "bg-emerald-100 text-emerald-700",
    withdrawn: "bg-gray-100 text-gray-500",
  };
  return colors[status] || "bg-gray-100 text-gray-700";
}
