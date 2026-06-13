import { useEffect, useState } from "react";
import { getLearningPaths, toggleModuleComplete, getLearningPathProgress } from "../store";
import type { LearningPath } from "../types";
import { CheckCircle, Circle, ChevronDown, ChevronRight, ExternalLink, Clock } from "lucide-react";

export default function Learn() {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { setPaths(getLearningPaths()); }, []);

  const refresh = () => setPaths(getLearningPaths());

  const totalModules = paths.reduce((s, p) => s + p.modules.length, 0);
  const completedModules = paths.reduce((s, p) => s + p.completedModules.length, 0);
  const overallPct = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Learning Paths</h1>
        <p className="text-gray-500 mt-1">Structured curriculum to upskill for your target roles</p>
      </div>

      {/* Overall progress */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm text-gray-500">{completedModules}/{totalModules} modules</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div className="bg-indigo-500 h-3 rounded-full transition-all" style={{ width: `${overallPct}%` }} />
        </div>
      </div>

      <div className="space-y-4">
        {paths.map((path) => {
          const prog = getLearningPathProgress(path.id);
          const isExpanded = expanded === path.id;
          return (
            <div key={path.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Header */}
              <div
                onClick={() => setExpanded(isExpanded ? null : path.id)}
                className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50"
              >
                <div className="flex items-center gap-3 flex-1">
                  {isExpanded ? <ChevronDown size={18} className="text-gray-400 shrink-0" /> : <ChevronRight size={18} className="text-gray-400 shrink-0" />}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{path.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        path.priority === "high" ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-500"
                      }`}>{path.priority}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{path.description}</p>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-sm font-medium text-gray-900">{prog.percent}%</p>
                  <p className="text-xs text-gray-400">{prog.completed}/{prog.total}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="px-5 pb-2">
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${prog.percent}%` }} />
                </div>
              </div>

              {/* Modules */}
              {isExpanded && (
                <div className="border-t border-gray-100 px-5 py-3 space-y-2">
                  {path.modules.map((mod) => {
                    const done = path.completedModules.includes(mod.id);
                    return (
                      <div key={mod.id} className={`p-4 rounded-lg border ${done ? "border-green-200 bg-green-50" : "border-gray-100 bg-gray-50"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleModuleComplete(path.id, mod.id); refresh(); }}
                              className="mt-0.5 shrink-0"
                            >
                              {done
                                ? <CheckCircle size={20} className="text-green-500" />
                                : <Circle size={20} className="text-gray-300 hover:text-gray-400" />
                              }
                            </button>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{mod.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{mod.description}</p>
                            </div>
                          </div>
                          <span className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                            <Clock size={12} /> {mod.duration}
                          </span>
                        </div>

                        {/* Resources */}
                        <div className="mt-3 ml-9 space-y-1">
                          {mod.resources.map((r, i) => (
                            <a
                              key={i}
                              href={r.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-xs text-indigo-600 hover:text-indigo-700"
                            >
                              <span className="px-1.5 py-0.5 bg-indigo-50 rounded text-[10px] uppercase font-medium">{r.type}</span>
                              {r.title}
                              <ExternalLink size={10} />
                            </a>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
