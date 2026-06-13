import { useEffect, useState } from "react";
import { getResources } from "../store";
import type { CuratedResource } from "../types";
import { ExternalLink, Search } from "lucide-react";

const categories = [
  { key: "all", label: "All" },
  { key: "ai-ml", label: "AI / ML" },
  { key: "frontend", label: "Frontend" },
  { key: "backend", label: "Backend" },
  { key: "cloud", label: "Cloud" },
  { key: "devops", label: "DevOps" },
  { key: "soft-skills", label: "Career & Soft Skills" },
];

const typeColors: Record<string, string> = {
  article: "bg-blue-50 text-blue-600",
  video: "bg-red-50 text-red-600",
  course: "bg-purple-50 text-purple-600",
  book: "bg-amber-50 text-amber-600",
  repo: "bg-gray-50 text-gray-600",
  tool: "bg-green-50 text-green-600",
  newsletter: "bg-pink-50 text-pink-600",
  doc: "bg-indigo-50 text-indigo-600",
};

export default function Resources() {
  const [resources, setResources] = useState<CuratedResource[]>([]);
  const [filtered, setFiltered] = useState<CuratedResource[]>([]);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");

  useEffect(() => {
    setResources(getResources());
    setFiltered(getResources());
  }, []);

  useEffect(() => {
    let f = resources;
    if (catFilter !== "all") f = f.filter((r) => r.category === catFilter);
    if (search) f = f.filter((r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase()) ||
      r.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
    );
    setFiltered(f);
  }, [search, catFilter, resources]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Resources</h1>
        <p className="text-gray-500 mt-1">Curated learning materials — {resources.length} resources</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCatFilter(cat.key)}
              className={`px-3 py-2 text-sm rounded-lg whitespace-nowrap ${
                catFilter === cat.key
                  ? "bg-indigo-50 text-indigo-700 font-medium"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((r) => (
          <a
            key={r.id}
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-indigo-200 transition-all group"
          >
            <div className="flex items-start justify-between mb-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[r.type] || "bg-gray-50 text-gray-600"}`}>
                {r.type}
              </span>
              <ExternalLink size={14} className="text-gray-300 group-hover:text-indigo-500 transition-colors" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
              {r.title}
            </h3>
            <p className="text-xs text-gray-500 mb-2 line-clamp-2">{r.description}</p>
            <div className="flex flex-wrap gap-1">
              {r.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                  #{tag}
                </span>
              ))}
              {r.tags.length > 3 && (
                <span className="text-xs text-gray-300">+{r.tags.length - 3}</span>
              )}
            </div>
          </a>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
            {search || catFilter !== "all" ? "No resources match your filters." : "No resources yet."}
          </div>
        )}
      </div>
    </div>
  );
}
