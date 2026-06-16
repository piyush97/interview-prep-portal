import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Layout() {
  return (
    <div className="flex h-screen flex-col bg-gray-50 dark:bg-slate-950 transition-colors lg:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-y-auto p-4 lg:p-6">
        <Outlet />
      </main>
    </div>
  );
}
