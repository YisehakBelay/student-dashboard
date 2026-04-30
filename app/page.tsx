"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";

// ── Types ──────────────────────────────────────────────────────────────────
interface Student {
  _id: string;
  name: string;
  email: string;
  age: number;
}

interface FormData {
  name: string;
  email: string;
  age: string;
}

interface ToastItem {
  id: number;
  message: string;
  type: "success" | "error";
}

type Tab = "dashboard" | "students" | "analytics" | "settings";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

// ── Utilities ──────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500",
  "bg-rose-500", "bg-cyan-500", "bg-pink-500", "bg-indigo-500",
];

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

// ── Sidebar ────────────────────────────────────────────────────────────────
function Sidebar({
  activeTab,
  onTabChange,
  onLogout,
}: {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onLogout: () => void;
}) {
  const navItems: { id: Tab; label: string; icon: string }[] = [
    { id: "dashboard", label: "Dashboard", icon: "▦" },
    { id: "students", label: "Students", icon: "👥" },
    { id: "analytics", label: "Analytics", icon: "📊" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <aside className="w-64 bg-slate-900 flex flex-col h-screen fixed left-0 top-0 z-20 flex-shrink-0">
      {/* Brand */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md">
            S
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">StudentHub</p>
            <p className="text-slate-400 text-xs">Management System</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-3 px-3">
          Main Menu
        </p>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-colors text-left ${
              activeTab === item.id
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* User + logout */}
      <div className="p-4 border-t border-slate-800 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
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

// ── StatCard ───────────────────────────────────────────────────────────────
function StatCard({
  label, value, icon, bg, sub,
}: { label: string; value: string | number; icon: string; bg: string; sub: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
          <p className="text-slate-400 text-xs mt-1">{sub}</p>
        </div>
        <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center text-xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ── StudentModal ───────────────────────────────────────────────────────────
function StudentModal({
  open, onClose, onSubmit, editing, saving,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (d: FormData) => void;
  editing: Student | null;
  saving: boolean;
}) {
  const [form, setForm] = useState<FormData>({ name: "", email: "", age: "" });
  const [errors, setErrors] = useState<Partial<FormData>>({});

  useEffect(() => {
    setForm(editing
      ? { name: editing.name, email: editing.email, age: String(editing.age) }
      : { name: "", email: "", age: "" });
    setErrors({});
  }, [editing, open]);

  function validate() {
    const e: Partial<FormData> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    const n = parseInt(form.age);
    if (!form.age) e.age = "Age is required";
    else if (isNaN(n) || n < 1 || n > 120) e.age = "Age must be 1–120";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (validate()) onSubmit(form);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {editing ? "Edit Student" : "Add New Student"}
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">
              {editing ? "Update student information" : "Fill in the details below"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Jane Smith"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                errors.name
                  ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-100"
                  : "border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              }`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="e.g. jane@school.edu"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                errors.email
                  ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-100"
                  : "border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              }`}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Age</label>
            <input
              type="number"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
              placeholder="e.g. 20"
              min="1"
              max="120"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                errors.age
                  ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-100"
                  : "border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              }`}
            />
            {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-60 shadow-sm"
            >
              {saving ? "Saving…" : editing ? "Save Changes" : "Add Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── DeleteModal ────────────────────────────────────────────────────────────
function DeleteModal({
  student, onConfirm, onCancel, deleting,
}: {
  student: Student | null;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  if (!student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
          🗑️
        </div>
        <h2 className="text-lg font-bold text-slate-900">Delete Student?</h2>
        <p className="text-slate-500 text-sm mt-2 mb-6">
          Are you sure you want to remove{" "}
          <span className="font-semibold text-slate-700">{student.name}</span>?
          <br />This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-60 shadow-sm"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Toasts ─────────────────────────────────────────────────────────────────
function Toasts({ items, onRemove }: { items: ToastItem[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {items.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-medium min-w-72 pointer-events-auto transition-all ${
            t.type === "success" ? "bg-emerald-500" : "bg-red-500"
          }`}
        >
          <span className="text-base">{t.type === "success" ? "✓" : "✕"}</span>
          <span className="flex-1">{t.message}</span>
          <button onClick={() => onRemove(t.id)} className="opacity-60 hover:opacity-100 transition-opacity text-xs">
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

// ── SortIcon ───────────────────────────────────────────────────────────────
function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  return (
    <span className={`ml-1 text-xs ${active ? "text-indigo-500" : "text-slate-300"}`}>
      {active ? (dir === "asc" ? "↑" : "↓") : "↕"}
    </span>
  );
}

// ── DashboardView ──────────────────────────────────────────────────────────
function DashboardView({
  students,
  onGoToStudents,
  onAddStudent,
}: {
  students: Student[];
  onGoToStudents: () => void;
  onAddStudent: () => void;
}) {
  const stats = useMemo(() => {
    if (!students.length) return { total: 0, avg: "–", youngest: "–", oldest: "–" };
    const ages = students.map((s) => s.age);
    return {
      total: students.length,
      avg: (ages.reduce((a, b) => a + b, 0) / ages.length).toFixed(1),
      youngest: Math.min(...ages),
      oldest: Math.max(...ages),
    };
  }, [students]);

  const recent = students.slice(-5).reverse();
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="flex-1 overflow-auto p-8">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl p-6 mb-8 text-white shadow-lg shadow-indigo-500/20">
        <p className="text-indigo-200 text-sm">{today}</p>
        <h2 className="text-2xl font-bold mt-1">Welcome back, Administrator!</h2>
        <p className="text-indigo-200 text-sm mt-1">
          Here&apos;s an overview of your student management system.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Students" value={stats.total} icon="👥" bg="bg-indigo-50" sub="Enrolled" />
        <StatCard label="Average Age" value={stats.avg} icon="📊" bg="bg-emerald-50" sub="Years" />
        <StatCard label="Youngest" value={stats.youngest} icon="🌱" bg="bg-amber-50" sub="Years old" />
        <StatCard label="Oldest" value={stats.oldest} icon="🎓" bg="bg-rose-50" sub="Years old" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent students */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Recent Students</h3>
            <button
              onClick={onGoToStudents}
              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors"
            >
              View all →
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {recent.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm">No students yet</div>
            ) : (
              recent.map((s) => (
                <div key={s._id} className="flex items-center gap-3 px-6 py-3.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${getAvatarColor(s.name)}`}
                  >
                    {getInitials(s.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{s.name}</p>
                    <p className="text-xs text-slate-400 truncate">{s.email}</p>
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0">{s.age} yrs</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={onAddStudent}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-left transition-colors group"
            >
              <span className="text-xl">➕</span>
              <div>
                <p className="text-sm font-medium text-indigo-700">Add New Student</p>
                <p className="text-xs text-indigo-400">Register a new student record</p>
              </div>
            </button>
            <button
              onClick={onGoToStudents}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-left transition-colors"
            >
              <span className="text-xl">👥</span>
              <div>
                <p className="text-sm font-medium text-slate-700">Manage Students</p>
                <p className="text-xs text-slate-400">Browse, search, and edit records</p>
              </div>
            </button>
            <div className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 text-left opacity-50 cursor-not-allowed">
              <span className="text-xl">📤</span>
              <div>
                <p className="text-sm font-medium text-slate-700">Export Data</p>
                <p className="text-xs text-slate-400">Coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── StudentsView ───────────────────────────────────────────────────────────
const PAGE_SIZE = 8;

function StudentsView({
  students,
  fetching,
  onEdit,
  onDelete,
}: {
  students: Student[];
  fetching: boolean;
  onEdit: (s: Student) => void;
  onDelete: (s: Student) => void;
}) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<keyof Student>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return students
      .filter((s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
      .sort((a, b) => {
        const va = a[sortField], vb = b[sortField];
        const cmp = typeof va === "number" ? (va - (vb as number)) : String(va).localeCompare(String(vb));
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [students, search, sortField, sortDir]);

  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  function toggleSort(field: keyof Student) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  }

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 gap-4">
          <div className="relative flex-1 max-w-sm">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
            {search && (
              <button
                onClick={() => { setSearch(""); setPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
          <span className="text-slate-400 text-sm whitespace-nowrap">
            {filtered.length} {filtered.length === 1 ? "student" : "students"}
          </span>
        </div>

        {/* Table */}
        {fetching ? (
          <div className="py-24 flex flex-col items-center gap-4 text-slate-400">
            <div className="w-8 h-8 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Loading students…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 flex flex-col items-center gap-3">
            <div className="text-5xl">🎓</div>
            <p className="text-slate-700 font-semibold">No students found</p>
            <p className="text-slate-400 text-sm">
              {search ? "Try a different search term" : 'Click "Add Student" to get started'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {(["name", "email", "age"] as (keyof Student)[]).map((field) => (
                      <th
                        key={field}
                        onClick={() => toggleSort(field)}
                        className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors select-none"
                      >
                        {field.charAt(0).toUpperCase() + field.slice(1)}
                        <SortIcon active={sortField === field} dir={sortDir} />
                      </th>
                    ))}
                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((s) => (
                    <tr key={s._id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${getAvatarColor(s.name)}`}
                          >
                            {getInitials(s.name)}
                          </div>
                          <span className="font-semibold text-slate-900 text-sm">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-sm">{s.email}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600">
                          {s.age} yrs
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onEdit(s)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onDelete(s)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                <p className="text-sm text-slate-400">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of{" "}
                  {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    ←
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                      if (idx > 0 && (arr[idx - 1] as number) !== p - 1) acc.push("…");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === "…" ? (
                        <span key={`ell-${i}`} className="px-2 text-slate-400 text-sm">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPage(p as number)}
                          className={`w-9 py-1.5 rounded-lg border text-sm transition-colors ${
                            page === p
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                              : "border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── AnalyticsView ──────────────────────────────────────────────────────────
function AnalyticsView({ students }: { students: Student[] }) {
  const data = useMemo(() => {
    if (!students.length) return null;

    const ages = students.map((s) => s.age).sort((a, b) => a - b);
    const sum = ages.reduce((a, b) => a + b, 0);
    const mid = Math.floor(ages.length / 2);
    const median =
      ages.length % 2 === 0 ? (ages[mid - 1] + ages[mid]) / 2 : ages[mid];

    const buckets = [
      { label: "Under 18", min: 0, max: 17, color: "bg-violet-500" },
      { label: "18 – 22", min: 18, max: 22, color: "bg-indigo-500" },
      { label: "23 – 27", min: 23, max: 27, color: "bg-blue-500" },
      { label: "28 – 35", min: 28, max: 35, color: "bg-emerald-500" },
      { label: "Over 35", min: 36, max: 999, color: "bg-amber-500" },
    ].map((b) => ({
      ...b,
      count: students.filter((s) => s.age >= b.min && s.age <= b.max).length,
    }));

    const domainMap: Record<string, number> = {};
    students.forEach((s) => {
      const d = s.email.split("@")[1] ?? "unknown";
      domainMap[d] = (domainMap[d] ?? 0) + 1;
    });
    const domains = Object.entries(domainMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([domain, count]) => ({ domain, count }));

    return {
      total: students.length,
      avg: (sum / ages.length).toFixed(1),
      median,
      min: ages[0],
      max: ages[ages.length - 1],
      buckets,
      domains,
    };
  }, [students]);

  if (!data) {
    return (
      <div className="flex-1 overflow-auto p-8 flex flex-col items-center justify-center text-slate-400 gap-3">
        <span className="text-5xl">📊</span>
        <p className="font-semibold text-slate-600">No data yet</p>
        <p className="text-sm">Add some students to see analytics.</p>
      </div>
    );
  }

  const maxBucket = Math.max(...data.buckets.map((b) => b.count), 1);
  const maxDomain = Math.max(...data.domains.map((d) => d.count), 1);
  const domainColors = ["bg-indigo-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-cyan-500"];

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Analytics</h2>
        <p className="text-slate-400 text-sm">Insights derived from student data</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Students" value={data.total} icon="👥" bg="bg-indigo-50" sub="Enrolled" />
        <StatCard label="Average Age" value={data.avg} icon="📊" bg="bg-emerald-50" sub="Years" />
        <StatCard label="Median Age" value={data.median} icon="📐" bg="bg-blue-50" sub="Years" />
        <StatCard label="Age Range" value={`${data.min}–${data.max}`} icon="📏" bg="bg-amber-50" sub="Years" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Age distribution */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-semibold text-slate-900 mb-0.5">Age Distribution</h3>
          <p className="text-slate-400 text-xs mb-6">Students grouped by age range</p>
          <div className="space-y-4">
            {data.buckets.map((b) => (
              <div key={b.label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-600 font-medium">{b.label}</span>
                  <span className="text-slate-400">
                    {b.count} student{b.count !== 1 ? "s" : ""}&nbsp;
                    ({data.total ? Math.round((b.count / data.total) * 100) : 0}%)
                  </span>
                </div>
                <div className="h-7 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${b.color} rounded-full transition-all duration-700 flex items-center justify-end pr-2.5`}
                    style={{ width: b.count === 0 ? "0%" : `${Math.max((b.count / maxBucket) * 100, 5)}%` }}
                  >
                    {b.count > 0 && (
                      <span className="text-white text-xs font-bold">{b.count}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Email domains */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-semibold text-slate-900 mb-0.5">Email Domains</h3>
          <p className="text-slate-400 text-xs mb-6">Top domains used by students</p>
          {data.domains.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No domain data available</p>
          ) : (
            <div className="space-y-4">
              {data.domains.map((d, i) => (
                <div key={d.domain}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-600 font-medium font-mono">@{d.domain}</span>
                    <span className="text-slate-400">
                      {d.count} student{d.count !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="h-7 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${domainColors[i % domainColors.length]} rounded-full transition-all duration-700 flex items-center justify-end pr-2.5`}
                      style={{ width: `${Math.max((d.count / maxDomain) * 100, 5)}%` }}
                    >
                      <span className="text-white text-xs font-bold">{d.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── SettingsView ───────────────────────────────────────────────────────────
function SettingsView({ onLogout }: { onLogout: () => void }) {
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState(true);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Settings</h2>
        <p className="text-slate-400 text-sm">Manage your account and preferences</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Profile */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Profile</h3>
            <p className="text-slate-400 text-xs mt-0.5">Update your account information</p>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500 flex items-center justify-center text-white text-xl font-bold shadow-md">
                AD
              </div>
              <div>
                <p className="font-semibold text-slate-900">Administrator</p>
                <p className="text-slate-400 text-sm">admin@school.edu</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-xs font-medium mt-1.5">
                  Admin
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Full Name</label>
                <input
                  defaultValue="Administrator"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Email</label>
                <input
                  defaultValue="admin@school.edu"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>
            </div>
            <button
              onClick={handleSave}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-all shadow-sm ${
                saved
                  ? "bg-emerald-500 text-white"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
            >
              {saved ? "✓ Saved!" : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Preferences</h3>
            <p className="text-slate-400 text-xs mt-0.5">Customize your experience</p>
          </div>
          <div className="divide-y divide-slate-50">
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-medium text-slate-900">Email Notifications</p>
                <p className="text-xs text-slate-400 mt-0.5">Receive alerts for student activity</p>
              </div>
              <button
                onClick={() => setNotifications((v) => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  notifications ? "bg-indigo-600" : "bg-slate-200"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    notifications ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between px-6 py-4 opacity-50">
              <div>
                <p className="text-sm font-medium text-slate-900">Dark Mode</p>
                <p className="text-xs text-slate-400 mt-0.5">Coming soon</p>
              </div>
              <div className="relative w-11 h-6 rounded-full bg-slate-200 cursor-not-allowed">
                <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow" />
              </div>
            </div>
          </div>
        </div>

        {/* System info */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">System</h3>
          </div>
          <div className="divide-y divide-slate-50">
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-medium text-slate-900">API Endpoint</p>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">{API_URL}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-medium text-slate-900">Version</p>
                <p className="text-xs text-slate-400 mt-0.5">StudentHub v1.0.0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Account / logout */}
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-red-100">
            <h3 className="font-semibold text-red-500">Account</h3>
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Sign Out</p>
              <p className="text-xs text-slate-400 mt-0.5">End your current session</p>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-xl transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [students, setStudents] = useState<Student[]>([]);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [toDelete, setToDelete] = useState<Student | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    if (!localStorage.getItem("sh_auth")) {
      router.replace("/login");
    } else {
      setAuthed(true);
    }
  }, [router]);

  const toast = useCallback((message: string, type: ToastItem["type"]) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback(
    (id: number) => setToasts((p) => p.filter((t) => t.id !== id)),
    [],
  );

  const fetchStudents = useCallback(async () => {
    try {
      setFetching(true);
      const res = await fetch(`${API_URL}/api/students`);
      if (!res.ok) throw new Error();
      setStudents(await res.json());
    } catch {
      toast("Failed to load students. Is the API running?", "error");
    } finally {
      setFetching(false);
    }
  }, [toast]);

  useEffect(() => {
    if (authed) fetchStudents();
  }, [authed, fetchStudents]);

  function handleLogout() {
    localStorage.removeItem("sh_auth");
    router.replace("/login");
  }

  async function handleSubmit(data: FormData) {
    setSaving(true);
    const payload = { name: data.name, email: data.email, age: parseInt(data.age) };
    try {
      if (editing) {
        const res = await fetch(`${API_URL}/api/students/${editing._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        toast(`${data.name} updated successfully`, "success");
      } else {
        const res = await fetch(`${API_URL}/api/students`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        toast(`${data.name} added successfully`, "success");
      }
      setModalOpen(false);
      fetchStudents();
    } catch {
      toast("Operation failed. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/api/students/${toDelete._id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast(`${toDelete.name} removed`, "success");
      setToDelete(null);
      fetchStudents();
    } catch {
      toast("Failed to delete. Please try again.", "error");
    } finally {
      setDeleting(false);
    }
  }

  const headerMeta: Record<Tab, { title: string; sub: string }> = {
    dashboard: { title: "Dashboard", sub: "Welcome back, Administrator" },
    students: { title: "Student Management", sub: "Manage and track all enrolled students" },
    analytics: { title: "Analytics", sub: "Student data insights and statistics" },
    settings: { title: "Settings", sub: "Manage your account and preferences" },
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />

      <div className="ml-64 flex-1 flex flex-col min-h-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{headerMeta[activeTab].title}</h1>
            <p className="text-slate-400 text-sm">{headerMeta[activeTab].sub}</p>
          </div>
          {activeTab === "students" && (
            <button
              onClick={() => { setEditing(null); setModalOpen(true); }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
            >
              <span className="text-lg leading-none">+</span>
              Add Student
            </button>
          )}
        </header>

        {/* Tab content */}
        {activeTab === "dashboard" && (
          <DashboardView
            students={students}
            onGoToStudents={() => setActiveTab("students")}
            onAddStudent={() => { setEditing(null); setModalOpen(true); setActiveTab("students"); }}
          />
        )}
        {activeTab === "students" && (
          <StudentsView
            students={students}
            fetching={fetching}
            onEdit={(s) => { setEditing(s); setModalOpen(true); }}
            onDelete={setToDelete}
          />
        )}
        {activeTab === "analytics" && <AnalyticsView students={students} />}
        {activeTab === "settings" && <SettingsView onLogout={handleLogout} />}
      </div>

      <StudentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        editing={editing}
        saving={saving}
      />
      <DeleteModal
        student={toDelete}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setToDelete(null)}
        deleting={deleting}
      />
      <Toasts items={toasts} onRemove={removeToast} />
    </div>
  );
}
