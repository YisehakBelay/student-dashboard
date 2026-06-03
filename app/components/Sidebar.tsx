"use client";

import { Tab } from "../types";

export function Sidebar({
  activeTab,
  onTabChange,
  onLogout,
}: {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onLogout: () => void;
}) {
  const navItems: { id: Tab; label: string; icon: string }[] = [
    { id: "dashboard",  label: "Dashboard",  icon: "▦"  },
    { id: "students",   label: "Students",   icon: "👥" },
    { id: "classes",    label: "Classes",    icon: "🏫" },
    { id: "grades",     label: "Grades",     icon: "📝" },
    { id: "attendance", label: "Attendance", icon: "📅" },
    { id: "fees",       label: "Fees",       icon: "💰" },
    { id: "analytics",  label: "Analytics",  icon: "📊" },
    { id: "settings",   label: "Settings",   icon: "⚙️" },
  ];

  return (
    <aside className="w-64 bg-slate-900 flex flex-col h-screen fixed left-0 top-0 z-20 flex-shrink-0">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md">
            S
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">StudentHub</p>
            <p className="text-slate-400 text-xs">High School System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-3 px-3">
          Main Menu
        </p>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-colors text-left ${
              activeTab === item.id
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            AD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">Administrator</p>
            <p className="text-slate-400 text-xs truncate">admin@school.edu</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-red-400 text-sm transition-colors"
        >
          <span>↩</span> Sign Out
        </button>
      </div>
    </aside>
  );
}
