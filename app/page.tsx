"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";

// ── Types ──────────────────────────────────────────────────────────────────
interface Student {
  _id: string;
  name: string;
  email: string;
  age: number;
  gradeLevel: 9 | 10 | 11 | 12;
  studentId?: string;
  gpa?: number | null;
}

interface Course {
  _id: string;
  name: string;
  subject: string;
  teacherName: string;
  gradeLevel: 9 | 10 | 11 | 12;
  period?: number;
  credits: number;
  semester: "Fall" | "Spring";
  year: number;
  description?: string;
  enrollmentCount?: number;
}

interface Enrollment {
  _id: string;
  student: Student;
  course: Course;
  grade: number | null;
  gradeSubmitted: boolean;
  submittedAt?: string;
}

interface FormData {
  name: string;
  email: string;
  age: string;
  gradeLevel: string;
}

interface CourseFormData {
  name: string;
  subject: string;
  teacherName: string;
  gradeLevel: string;
  period: string;
  credits: string;
  semester: string;
  year: string;
  description: string;
}

interface ToastItem {
  id: number;
  message: string;
  type: "success" | "error";
}

type Tab = "dashboard" | "students" | "classes" | "grades" | "analytics" | "settings";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

// ── Constants ──────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500",
  "bg-rose-500", "bg-cyan-500", "bg-pink-500", "bg-indigo-500",
];

const GRADE_LABELS: Record<number, { short: string; full: string }> = {
  9:  { short: "9th",  full: "9th · Freshman"  },
  10: { short: "10th", full: "10th · Sophomore" },
  11: { short: "11th", full: "11th · Junior"    },
  12: { short: "12th", full: "12th · Senior"    },
};

const GRADE_LEVEL_COLORS: Record<number, string> = {
  9:  "bg-violet-100 text-violet-700",
  10: "bg-blue-100 text-blue-700",
  11: "bg-emerald-100 text-emerald-700",
  12: "bg-amber-100 text-amber-700",
};

const GRADE_LEVEL_BAR: Record<number, string> = {
  9:  "bg-violet-500",
  10: "bg-blue-500",
  11: "bg-emerald-500",
  12: "bg-amber-500",
};

// ── Utilities ──────────────────────────────────────────────────────────────
function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function letterGrade(n: number): { letter: string; color: string; points: number } {
  if (n >= 90) return { letter: "A", color: "bg-emerald-100 text-emerald-700", points: 4.0 };
  if (n >= 80) return { letter: "B", color: "bg-blue-100 text-blue-700",       points: 3.0 };
  if (n >= 70) return { letter: "C", color: "bg-amber-100 text-amber-700",     points: 2.0 };
  if (n >= 60) return { letter: "D", color: "bg-orange-100 text-orange-700",   points: 1.0 };
  return             { letter: "F", color: "bg-red-100 text-red-700",          points: 0.0 };
}

function formatGPA(gpa: number | null | undefined): string {
  if (gpa === null || gpa === undefined) return "—";
  return gpa.toFixed(2);
}

// ── Sidebar ────────────────────────────────────────────────────────────────
function Sidebar({
  activeTab, onTabChange, onLogout,
}: {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onLogout: () => void;
}) {
  const navItems: { id: Tab; label: string; icon: string }[] = [
    { id: "dashboard", label: "Dashboard",  icon: "▦"  },
    { id: "students",  label: "Students",   icon: "👥" },
    { id: "classes",   label: "Classes",    icon: "🏫" },
    { id: "grades",    label: "Grades",     icon: "📝" },
    { id: "analytics", label: "Analytics",  icon: "📊" },
    { id: "settings",  label: "Settings",   icon: "⚙️" },
  ];

  return (
    <aside className="w-64 bg-slate-900 flex flex-col h-screen fixed left-0 top-0 z-20 flex-shrink-0">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md">
            S
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">StudentHub</p>
            <p className="text-slate-400 text-xs">High School System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-3 px-3">Main Menu</p>
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
  const empty: FormData = { name: "", email: "", age: "", gradeLevel: "" };
  const [form, setForm] = useState<FormData>(empty);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  useEffect(() => {
    setForm(editing
      ? { name: editing.name, email: editing.email, age: String(editing.age), gradeLevel: String(editing.gradeLevel) }
      : empty);
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
    if (!form.gradeLevel) e.gradeLevel = "Grade level is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (validate()) onSubmit(form);
  }

  if (!open) return null;

  const field = (
    label: string,
    key: keyof FormData,
    props: React.InputHTMLAttributes<HTMLInputElement>
  ) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <input
        {...props}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${
          errors[key]
            ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-100"
            : "border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        }`}
      />
      {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{editing ? "Edit Student" : "Add New Student"}</h2>
            <p className="text-slate-500 text-sm mt-0.5">{editing ? "Update student information" : "Fill in the details below"}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 text-sm">✕</button>
        </div>

        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          {field("Full Name", "name", { type: "text", placeholder: "e.g. Jane Smith" })}
          {field("Email Address", "email", { type: "email", placeholder: "e.g. jane@school.edu" })}

          <div className="grid grid-cols-2 gap-3">
            {field("Age", "age", { type: "number", placeholder: "e.g. 16", min: "1", max: "120" })}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Grade Level</label>
              <select
                value={form.gradeLevel}
                onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                  errors.gradeLevel
                    ? "border-red-400 bg-red-50"
                    : "border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                }`}
              >
                <option value="">Select grade</option>
                {[9, 10, 11, 12].map((g) => (
                  <option key={g} value={g}>{GRADE_LABELS[g].full}</option>
                ))}
              </select>
              {errors.gradeLevel && <p className="text-red-500 text-xs mt-1">{errors.gradeLevel}</p>}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-60 shadow-sm">
              {saving ? "Saving…" : editing ? "Save Changes" : "Add Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── CourseModal ────────────────────────────────────────────────────────────
function CourseModal({
  open, onClose, onSubmit, editing, saving,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (d: CourseFormData) => void;
  editing: Course | null;
  saving: boolean;
}) {
  const currentYear = new Date().getFullYear();
  const empty: CourseFormData = {
    name: "", subject: "", teacherName: "", gradeLevel: "",
    period: "", credits: "1", semester: "Fall", year: String(currentYear), description: "",
  };
  const [form, setForm] = useState<CourseFormData>(empty);
  const [errors, setErrors] = useState<Partial<CourseFormData>>({});

  useEffect(() => {
    setForm(editing ? {
      name: editing.name,
      subject: editing.subject,
      teacherName: editing.teacherName,
      gradeLevel: String(editing.gradeLevel),
      period: String(editing.period ?? ""),
      credits: String(editing.credits ?? 1),
      semester: editing.semester,
      year: String(editing.year),
      description: editing.description ?? "",
    } : empty);
    setErrors({});
  }, [editing, open]);

  function validate() {
    const e: Partial<CourseFormData> = {};
    if (!form.name.trim()) e.name = "Course name is required";
    if (!form.subject.trim()) e.subject = "Subject is required";
    if (!form.teacherName.trim()) e.teacherName = "Teacher name is required";
    if (!form.gradeLevel) e.gradeLevel = "Grade level is required";
    const y = parseInt(form.year);
    if (!form.year || isNaN(y) || y < 2000 || y > 2100) e.year = "Enter a valid year";
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
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{editing ? "Edit Course" : "Add New Course"}</h2>
            <p className="text-slate-500 text-sm mt-0.5">{editing ? "Update course details" : "Fill in the course information"}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 text-sm">✕</button>
        </div>

        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Course Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Algebra II" className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.name ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"}`} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject</label>
            <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Mathematics" className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.subject ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"}`} />
            {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Teacher Name</label>
            <input type="text" value={form.teacherName} onChange={(e) => setForm({ ...form, teacherName: e.target.value })} placeholder="e.g. Mr. Johnson" className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.teacherName ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"}`} />
            {errors.teacherName && <p className="text-red-500 text-xs mt-1">{errors.teacherName}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Grade Level</label>
              <select value={form.gradeLevel} onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })} className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.gradeLevel ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"}`}>
                <option value="">Select grade</option>
                {[9, 10, 11, 12].map((g) => <option key={g} value={g}>{GRADE_LABELS[g].full}</option>)}
              </select>
              {errors.gradeLevel && <p className="text-red-500 text-xs mt-1">{errors.gradeLevel}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Period</label>
              <select value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all">
                <option value="">Select period</option>
                {[1,2,3,4,5,6,7,8].map((p) => <option key={p} value={p}>Period {p}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Semester</label>
              <select value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all">
                <option value="Fall">Fall</option>
                <option value="Spring">Spring</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Year</label>
              <input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} min="2000" max="2100" className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.year ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"}`} />
              {errors.year && <p className="text-red-500 text-xs mt-1">{errors.year}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Credits</label>
              <input type="number" value={form.credits} onChange={(e) => setForm({ ...form, credits: e.target.value })} min="0.5" max="4" step="0.5" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description <span className="text-slate-400 font-normal">(optional)</span></label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief course description…" rows={2} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all resize-none" />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-60 shadow-sm">
              {saving ? "Saving…" : editing ? "Save Changes" : "Add Course"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── ConfirmDelete (generic) ────────────────────────────────────────────────
function ConfirmDelete({
  name, entity, onConfirm, onCancel, deleting,
}: {
  name: string | null;
  entity: string;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  if (!name) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🗑️</div>
        <h2 className="text-lg font-bold text-slate-900">Delete {entity}?</h2>
        <p className="text-slate-500 text-sm mt-2 mb-6">
          Are you sure you want to remove <span className="font-semibold text-slate-700">{name}</span>?
          <br />This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={onConfirm} disabled={deleting} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-60 shadow-sm">
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
        <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-medium min-w-72 pointer-events-auto ${t.type === "success" ? "bg-emerald-500" : "bg-red-500"}`}>
          <span className="text-base">{t.type === "success" ? "✓" : "✕"}</span>
          <span className="flex-1">{t.message}</span>
          <button onClick={() => onRemove(t.id)} className="opacity-60 hover:opacity-100 text-xs">✕</button>
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
  students, courses, onGoToStudents, onGoToClasses, onAddStudent,
}: {
  students: Student[];
  courses: Course[];
  onGoToStudents: () => void;
  onGoToClasses: () => void;
  onAddStudent: () => void;
}) {
  const stats = useMemo(() => {
    const withGPA = students.filter((s) => s.gpa !== null && s.gpa !== undefined) as (Student & { gpa: number })[];
    const avgGPA = withGPA.length
      ? (withGPA.reduce((a, s) => a + s.gpa, 0) / withGPA.length).toFixed(2)
      : "—";
    return { total: students.length, courses: courses.length, avgGPA };
  }, [students, courses]);

  const recent = students.slice(-5).reverse();
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl p-6 mb-8 text-white shadow-lg shadow-indigo-500/20">
        <p className="text-indigo-200 text-sm">{today}</p>
        <h2 className="text-2xl font-bold mt-1">Welcome back, Administrator!</h2>
        <p className="text-indigo-200 text-sm mt-1">Here&apos;s an overview of your high school management system.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Students" value={stats.total}   icon="👥" bg="bg-indigo-50"  sub="Enrolled" />
        <StatCard label="Total Courses"  value={stats.courses} icon="🏫" bg="bg-violet-50"  sub="Active"   />
        <StatCard label="Average GPA"    value={stats.avgGPA}  icon="📊" bg="bg-emerald-50" sub="Across all grades" />
        <StatCard label="Grade Levels"   value="9–12"          icon="🎓" bg="bg-amber-50"   sub="Freshman–Senior" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Recent Students</h3>
            <button onClick={onGoToStudents} className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">View all →</button>
          </div>
          <div className="divide-y divide-slate-50">
            {recent.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm">No students yet</div>
            ) : recent.map((s) => (
              <div key={s._id} className="flex items-center gap-3 px-6 py-3.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${getAvatarColor(s.name)}`}>
                  {getInitials(s.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{s.name}</p>
                  <p className="text-xs text-slate-400 truncate">{s.email}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${GRADE_LEVEL_COLORS[s.gradeLevel] ?? "bg-slate-100 text-slate-600"}`}>
                  {GRADE_LABELS[s.gradeLevel]?.short ?? s.gradeLevel}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button onClick={onAddStudent} className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-left transition-colors">
              <span className="text-xl">➕</span>
              <div><p className="text-sm font-medium text-indigo-700">Add New Student</p><p className="text-xs text-indigo-400">Register a new student record</p></div>
            </button>
            <button onClick={onGoToClasses} className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-left transition-colors">
              <span className="text-xl">🏫</span>
              <div><p className="text-sm font-medium text-slate-700">Manage Classes</p><p className="text-xs text-slate-400">Add courses and enroll students</p></div>
            </button>
            <button onClick={onGoToStudents} className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-left transition-colors">
              <span className="text-xl">👥</span>
              <div><p className="text-sm font-medium text-slate-700">View All Students</p><p className="text-xs text-slate-400">Browse and manage records</p></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── StudentsView ───────────────────────────────────────────────────────────
const PAGE_SIZE = 8;
type SortField = "name" | "email" | "age" | "gradeLevel" | "gpa";

function StudentsView({
  students, fetching, onEdit, onDelete,
}: {
  students: Student[];
  fetching: boolean;
  onEdit: (s: Student) => void;
  onDelete: (s: Student) => void;
}) {
  const [search, setSearch]       = useState("");
  const [sortField, setSortField] = useState<SortField>("gradeLevel");
  const [sortDir, setSortDir]     = useState<"asc" | "desc">("asc");
  const [page, setPage]           = useState(1);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return students
      .filter((s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
      .sort((a, b) => {
        const va = a[sortField] ?? null;
        const vb = b[sortField] ?? null;
        if (va === null && vb === null) return 0;
        if (va === null) return sortDir === "asc" ? 1 : -1;
        if (vb === null) return sortDir === "asc" ? -1 : 1;
        const cmp = typeof va === "number" ? (va - (vb as number)) : String(va).localeCompare(String(vb));
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [students, search, sortField, sortDir]);

  const paginated   = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);
  const totalPages  = Math.ceil(filtered.length / PAGE_SIZE);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  }

  const cols: { label: string; field: SortField }[] = [
    { label: "Name",        field: "name"       },
    { label: "Grade Level", field: "gradeLevel" },
    { label: "Email",       field: "email"      },
    { label: "GPA",         field: "gpa"        },
    { label: "Age",         field: "age"        },
  ];

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 gap-4">
          <div className="relative flex-1 max-w-sm">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">🔍</span>
            <input
              type="text" placeholder="Search by name or email…" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
            {search && (
              <button onClick={() => { setSearch(""); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">✕</button>
            )}
          </div>
          <span className="text-slate-400 text-sm whitespace-nowrap">{filtered.length} {filtered.length === 1 ? "student" : "students"}</span>
        </div>

        {fetching ? (
          <div className="py-24 flex flex-col items-center gap-4 text-slate-400">
            <div className="w-8 h-8 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Loading students…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 flex flex-col items-center gap-3">
            <div className="text-5xl">🎓</div>
            <p className="text-slate-700 font-semibold">No students found</p>
            <p className="text-slate-400 text-sm">{search ? "Try a different search term" : 'Click "Add Student" to get started'}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {cols.map(({ label, field }) => (
                      <th key={field} onClick={() => toggleSort(field)} className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600 transition-colors select-none">
                        {label}<SortIcon active={sortField === field} dir={sortDir} />
                      </th>
                    ))}
                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((s) => (
                    <tr key={s._id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${getAvatarColor(s.name)}`}>
                            {getInitials(s.name)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{s.name}</p>
                            {s.studentId && <p className="text-xs text-slate-400 font-mono">{s.studentId}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${GRADE_LEVEL_COLORS[s.gradeLevel] ?? "bg-slate-100 text-slate-600"}`}>
                          {GRADE_LABELS[s.gradeLevel]?.full ?? s.gradeLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-sm">{s.email}</td>
                      <td className="px-6 py-4">
                        {s.gpa !== null && s.gpa !== undefined ? (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${letterGrade(s.gpa * 25).color}`}>
                            {formatGPA(s.gpa)}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600">{s.age} yrs</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => onEdit(s)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors">Edit</button>
                          <button onClick={() => onDelete(s)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors">Delete</button>
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
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">←</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                      if (idx > 0 && (arr[idx - 1] as number) !== p - 1) acc.push("…");
                      acc.push(p); return acc;
                    }, [])
                    .map((p, i) => p === "…"
                      ? <span key={`e${i}`} className="px-2 text-slate-400 text-sm">…</span>
                      : <button key={p} onClick={() => setPage(p as number)} className={`w-9 py-1.5 rounded-lg border text-sm transition-colors ${page === p ? "bg-indigo-600 border-indigo-600 text-white shadow-sm" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{p}</button>
                    )}
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">→</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── ClassesView ────────────────────────────────────────────────────────────
function ClassesView({
  courses, fetching, onEdit, onDelete, onViewGrades,
}: {
  courses: Course[];
  fetching: boolean;
  onEdit: (c: Course) => void;
  onDelete: (c: Course) => void;
  onViewGrades: (courseId: string) => void;
}) {
  const [filterSemester,   setFilterSemester]   = useState("");
  const [filterGradeLevel, setFilterGradeLevel] = useState("");

  const filtered = useMemo(() => courses.filter((c) => {
    if (filterSemester   && c.semester            !== filterSemester)            return false;
    if (filterGradeLevel && c.gradeLevel           !== parseInt(filterGradeLevel)) return false;
    return true;
  }), [courses, filterSemester, filterGradeLevel]);

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <select value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 transition-all bg-white">
          <option value="">All Semesters</option>
          <option value="Fall">Fall</option>
          <option value="Spring">Spring</option>
        </select>
        <select value={filterGradeLevel} onChange={(e) => setFilterGradeLevel(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 transition-all bg-white">
          <option value="">All Grade Levels</option>
          {[9, 10, 11, 12].map((g) => <option key={g} value={g}>{GRADE_LABELS[g].full}</option>)}
        </select>
        <span className="text-slate-400 text-sm ml-auto">{filtered.length} course{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {fetching ? (
        <div className="py-24 flex flex-col items-center gap-4 text-slate-400">
          <div className="w-8 h-8 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Loading courses…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 flex flex-col items-center gap-3">
          <div className="text-5xl">🏫</div>
          <p className="text-slate-700 font-semibold">No courses found</p>
          <p className="text-slate-400 text-sm">{courses.length === 0 ? 'Click "Add Course" to create the first course' : "Try adjusting your filters"}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Course", "Teacher", "Grade", "Period", "Semester", "Enrolled", "Actions"].map((h) => (
                    <th key={h} className={`px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider ${h === "Actions" ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c._id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs flex-shrink-0">
                          {c.subject.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{c.name}</p>
                          <p className="text-xs text-slate-400">{c.subject} · {c.credits} cr</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-sm">{c.teacherName}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${GRADE_LEVEL_COLORS[c.gradeLevel] ?? "bg-slate-100 text-slate-600"}`}>
                        {GRADE_LABELS[c.gradeLevel]?.short ?? c.gradeLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">{c.period ? `Period ${c.period}` : "—"}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${c.semester === "Fall" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                        {c.semester} {c.year}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-700">{c.enrollmentCount ?? 0}</span>
                      <span className="text-xs text-slate-400 ml-1">student{(c.enrollmentCount ?? 0) !== 1 ? "s" : ""}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => onViewGrades(c._id)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors">Grades</button>
                        <button onClick={() => onEdit(c)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors">Edit</button>
                        <button onClick={() => onDelete(c)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── GradesView ─────────────────────────────────────────────────────────────
function GradesView({
  courses, students, toast, initCourseId, onGradeChanged,
}: {
  courses: Course[];
  students: Student[];
  toast: (msg: string, type: ToastItem["type"]) => void;
  initCourseId: string | null;
  onGradeChanged: () => void;
}) {
  const [selectedCourseId, setSelectedCourseId] = useState(initCourseId ?? "");
  const [enrollments,      setEnrollments]       = useState<Enrollment[]>([]);
  const [fetching,         setFetching]          = useState(false);
  const [gradeInputs,      setGradeInputs]       = useState<Record<string, string>>({});
  const [submitting,       setSubmitting]        = useState<Record<string, boolean>>({});
  const [removingId,       setRemovingId]        = useState<string | null>(null);
  const [enrollOpen,       setEnrollOpen]        = useState(false);
  const [enrollStudent,    setEnrollStudent]     = useState("");
  const [enrolling,        setEnrolling]         = useState(false);

  useEffect(() => {
    if (initCourseId) setSelectedCourseId(initCourseId);
  }, [initCourseId]);

  useEffect(() => {
    if (!selectedCourseId) { setEnrollments([]); return; }
    let cancelled = false;
    (async () => {
      setFetching(true);
      try {
        const res = await fetch(`${API_URL}/api/courses/${selectedCourseId}/enrollments`);
        if (!res.ok) throw new Error();
        const data: Enrollment[] = await res.json();
        if (cancelled) return;
        setEnrollments(data);
        const inputs: Record<string, string> = {};
        data.forEach((e) => { if (e.grade !== null) inputs[e._id] = String(e.grade); });
        setGradeInputs(inputs);
      } catch {
        toast("Failed to load enrollments.", "error");
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedCourseId, toast]);

  async function submitGrade(enrollmentId: string, studentName: string) {
    const val = gradeInputs[enrollmentId];
    const grade = parseFloat(val);
    if (isNaN(grade) || grade < 0 || grade > 100) { toast("Grade must be 0–100.", "error"); return; }
    setSubmitting((p) => ({ ...p, [enrollmentId]: true }));
    try {
      const res = await fetch(`${API_URL}/api/enrollments/${enrollmentId}/grade`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade }),
      });
      if (!res.ok) throw new Error();
      const updated: Enrollment = await res.json();
      setEnrollments((prev) => prev.map((e) => e._id === enrollmentId ? updated : e));
      toast(`Grade saved for ${studentName}`, "success");
      onGradeChanged();
    } catch {
      toast("Failed to save grade.", "error");
    } finally {
      setSubmitting((p) => ({ ...p, [enrollmentId]: false }));
    }
  }

  async function handleEnroll() {
    if (!enrollStudent || !selectedCourseId) return;
    setEnrolling(true);
    try {
      const res = await fetch(`${API_URL}/api/enrollments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student: enrollStudent, course: selectedCourseId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setEnrollments((prev) => [...prev, data]);
      setEnrollOpen(false);
      setEnrollStudent("");
      toast(`${data.student.name} enrolled successfully`, "success");
      onGradeChanged();
    } catch (e: unknown) {
      toast((e as Error).message || "Failed to enroll student.", "error");
    } finally {
      setEnrolling(false);
    }
  }

  async function handleRemove(enrollmentId: string, studentName: string) {
    setRemovingId(enrollmentId);
    try {
      const res = await fetch(`${API_URL}/api/enrollments/${enrollmentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setEnrollments((prev) => prev.filter((e) => e._id !== enrollmentId));
      toast(`${studentName} removed from course`, "success");
      onGradeChanged();
    } catch {
      toast("Failed to remove enrollment.", "error");
    } finally {
      setRemovingId(null);
    }
  }

  const selectedCourse = courses.find((c) => c._id === selectedCourseId);
  const enrolledIds    = new Set(enrollments.map((e) => e.student._id));
  const available      = students.filter((s) => !enrolledIds.has(s._id));

  return (
    <div className="flex-1 overflow-auto p-8">
      {/* Course selector */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Select Course</label>
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="w-full max-w-lg px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all bg-white"
        >
          <option value="">— Choose a course —</option>
          {courses.map((c) => (
            <option key={c._id} value={c._id}>
              {c.semester} {c.year} · {c.name} ({GRADE_LABELS[c.gradeLevel]?.short}) · {c.teacherName}
            </option>
          ))}
        </select>
      </div>

      {!selectedCourseId ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
          <span className="text-5xl">📝</span>
          <p className="font-semibold text-slate-600">Select a course to manage grades</p>
          <p className="text-sm">Choose a course from the dropdown above</p>
        </div>
      ) : fetching ? (
        <div className="py-16 flex items-center justify-center gap-3 text-slate-400">
          <div className="w-7 h-7 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Loading enrollments…</p>
        </div>
      ) : selectedCourse && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Course header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-sm">
                {selectedCourse.period ?? "—"}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{selectedCourse.name}</p>
                <p className="text-xs text-slate-400">
                  {selectedCourse.subject} · {selectedCourse.teacherName} · {selectedCourse.semester} {selectedCourse.year} · {selectedCourse.credits} credit{selectedCourse.credits !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">{enrollments.length} enrolled</span>
              <button
                onClick={() => setEnrollOpen(true)}
                disabled={available.length === 0}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + Enroll Student
              </button>
            </div>
          </div>

          {enrollments.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
              <span className="text-4xl">👥</span>
              <p className="font-semibold text-slate-600">No students enrolled</p>
              <p className="text-sm">Click &quot;Enroll Student&quot; to add students to this course.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {["Student", "ID", "Score (0–100)", "Letter / GPA", "Status", "Actions"].map((h) => (
                      <th key={h} className={`px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider ${h === "Actions" ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((e) => {
                    const val       = gradeInputs[e._id] ?? "";
                    const numeric   = parseFloat(val);
                    const gradeInfo = !isNaN(numeric) && numeric >= 0 && numeric <= 100 ? letterGrade(numeric) : null;

                    return (
                      <tr key={e._id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${getAvatarColor(e.student.name)}`}>
                              {getInitials(e.student.name)}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 text-sm">{e.student.name}</p>
                              <p className="text-xs text-slate-400">{e.student.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">{e.student.studentId ?? "—"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number" min="0" max="100" value={val} placeholder="0–100"
                            onChange={(ev) => setGradeInputs((p) => ({ ...p, [e._id]: ev.target.value }))}
                            className="w-20 px-3 py-1.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                          />
                        </td>
                        <td className="px-6 py-4">
                          {gradeInfo ? (
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${gradeInfo.color}`}>
                              {gradeInfo.letter} · {gradeInfo.points.toFixed(1)}
                            </span>
                          ) : <span className="text-slate-300 text-sm">—</span>}
                        </td>
                        <td className="px-6 py-4">
                          {e.gradeSubmitted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-medium">✓ Submitted</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600 text-xs font-medium">Pending</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => submitGrade(e._id, e.student.name)}
                              disabled={!val || submitting[e._id]}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
                            >
                              {submitting[e._id] ? "…" : e.gradeSubmitted ? "Update" : "Submit"}
                            </button>
                            <button
                              onClick={() => handleRemove(e._id, e.student.name)}
                              disabled={removingId === e._id}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-40 transition-colors"
                            >
                              {removingId === e._id ? "…" : "Remove"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Enroll modal */}
      {enrollOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setEnrollOpen(false); setEnrollStudent(""); }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-0.5">Enroll Student</h2>
            <p className="text-slate-500 text-sm mb-5">
              Select a student to enroll in <span className="font-semibold text-slate-700">{selectedCourse?.name}</span>
            </p>
            {available.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">All students are already enrolled in this course.</p>
            ) : (
              <select
                value={enrollStudent}
                onChange={(e) => setEnrollStudent(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all mb-4 bg-white"
              >
                <option value="">— Select student —</option>
                {available.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} · {GRADE_LABELS[s.gradeLevel]?.short ?? s.gradeLevel} · {s.studentId ?? s.email}
                  </option>
                ))}
              </select>
            )}
            <div className="flex gap-3">
              <button onClick={() => { setEnrollOpen(false); setEnrollStudent(""); }} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={handleEnroll} disabled={!enrollStudent || enrolling} className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-60 shadow-sm">
                {enrolling ? "Enrolling…" : "Enroll"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── AnalyticsView ──────────────────────────────────────────────────────────
function AnalyticsView({ students }: { students: Student[] }) {
  const data = useMemo(() => {
    if (!students.length) return null;

    const ages = students.map((s) => s.age).sort((a, b) => a - b);
    const sum  = ages.reduce((a, b) => a + b, 0);
    const mid  = Math.floor(ages.length / 2);
    const median = ages.length % 2 === 0 ? (ages[mid - 1] + ages[mid]) / 2 : ages[mid];

    const ageBuckets = [
      { label: "Under 14", min: 0,  max: 13, color: "bg-violet-500" },
      { label: "14–15",    min: 14, max: 15, color: "bg-indigo-500" },
      { label: "16–17",    min: 16, max: 17, color: "bg-blue-500"   },
      { label: "18+",      min: 18, max: 99, color: "bg-emerald-500"},
    ].map((b) => ({ ...b, count: students.filter((s) => s.age >= b.min && s.age <= b.max).length }));

    const gradeLevelBuckets = [9, 10, 11, 12].map((g) => ({
      label: GRADE_LABELS[g].full,
      count: students.filter((s) => s.gradeLevel === g).length,
      color: GRADE_LEVEL_BAR[g],
    }));

    const withGPA = students.filter((s) => s.gpa !== null && s.gpa !== undefined) as (Student & { gpa: number })[];
    const gpaBuckets = [
      { label: "3.5–4.0 (A avg)", min: 3.5, max: 4.0, color: "bg-emerald-500" },
      { label: "2.5–3.4 (B avg)", min: 2.5, max: 3.4, color: "bg-blue-500"    },
      { label: "1.5–2.4 (C avg)", min: 1.5, max: 2.4, color: "bg-amber-500"   },
      { label: "0.5–1.4 (D avg)", min: 0.5, max: 1.4, color: "bg-orange-500"  },
      { label: "0.0–0.4 (F avg)", min: 0.0, max: 0.4, color: "bg-red-500"     },
    ].map((b) => ({ ...b, count: withGPA.filter((s) => s.gpa >= b.min && s.gpa <= b.max).length }));

    const domainMap: Record<string, number> = {};
    students.forEach((s) => {
      const d = s.email.split("@")[1] ?? "unknown";
      domainMap[d] = (domainMap[d] ?? 0) + 1;
    });
    const domains = Object.entries(domainMap).sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([domain, count]) => ({ domain, count }));

    const avgGPA = withGPA.length
      ? (withGPA.reduce((a, s) => a + s.gpa, 0) / withGPA.length).toFixed(2)
      : null;

    return { total: students.length, avg: (sum / ages.length).toFixed(1), median, min: ages[0], max: ages[ages.length - 1], ageBuckets, gradeLevelBuckets, gpaBuckets, domains, avgGPA, gpaCount: withGPA.length };
  }, [students]);

  if (!data) {
    return (
      <div className="flex-1 overflow-auto p-8 flex flex-col items-center justify-center text-slate-400 gap-3">
        <span className="text-5xl">📊</span>
        <p className="font-semibold text-slate-600">No data yet</p>
        <p className="text-sm">Add students to see analytics.</p>
      </div>
    );
  }

  const domainColors = ["bg-indigo-500","bg-emerald-500","bg-amber-500","bg-rose-500","bg-cyan-500"];

  function BarChart({ buckets, total }: { buckets: { label: string; count: number; color: string }[]; total: number }) {
    const max = Math.max(...buckets.map((b) => b.count), 1);
    return (
      <div className="space-y-4">
        {buckets.map((b) => (
          <div key={b.label}>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-600 font-medium">{b.label}</span>
              <span className="text-slate-400">{b.count} · {total ? Math.round((b.count / total) * 100) : 0}%</span>
            </div>
            <div className="h-7 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${b.color} rounded-full transition-all duration-700 flex items-center justify-end pr-2.5`}
                style={{ width: b.count === 0 ? "0%" : `${Math.max((b.count / max) * 100, 5)}%` }}
              >
                {b.count > 0 && <span className="text-white text-xs font-bold">{b.count}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Analytics</h2>
        <p className="text-slate-400 text-sm">Insights derived from student data</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Students" value={data.total}           icon="👥" bg="bg-indigo-50"  sub="Enrolled" />
        <StatCard label="Average Age"    value={data.avg}             icon="📊" bg="bg-emerald-50" sub="Years" />
        <StatCard label="Average GPA"    value={data.avgGPA ?? "—"}   icon="🎓" bg="bg-violet-50"  sub={`${data.gpaCount} with grades`} />
        <StatCard label="Age Range"      value={`${data.min}–${data.max}`} icon="📏" bg="bg-amber-50" sub="Years" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-semibold text-slate-900 mb-0.5">Age Distribution</h3>
          <p className="text-slate-400 text-xs mb-6">Students by age group</p>
          <BarChart buckets={data.ageBuckets} total={data.total} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-semibold text-slate-900 mb-0.5">Grade Level Breakdown</h3>
          <p className="text-slate-400 text-xs mb-6">Students per grade level</p>
          <BarChart buckets={data.gradeLevelBuckets} total={data.total} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-semibold text-slate-900 mb-0.5">GPA Distribution</h3>
          <p className="text-slate-400 text-xs mb-6">{data.gpaCount} student{data.gpaCount !== 1 ? "s" : ""} with submitted grades</p>
          {data.gpaCount === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No grades submitted yet</p>
          ) : (
            <BarChart buckets={data.gpaBuckets} total={data.gpaCount} />
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-semibold text-slate-900 mb-0.5">Email Domains</h3>
          <p className="text-slate-400 text-xs mb-6">Top domains used by students</p>
          {data.domains.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No data available</p>
          ) : (
            <div className="space-y-4">
              {data.domains.map((d, i) => (
                <div key={d.domain}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-600 font-medium font-mono">@{d.domain}</span>
                    <span className="text-slate-400">{d.count} student{d.count !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="h-7 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${domainColors[i % domainColors.length]} rounded-full transition-all duration-700 flex items-center justify-end pr-2.5`}
                      style={{ width: `${Math.max((d.count / data.total) * 100, 5)}%` }}
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
  const [saved,          setSaved]          = useState(false);
  const [notifications,  setNotifications]  = useState(true);

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Settings</h2>
        <p className="text-slate-400 text-sm">Manage your account and preferences</p>
      </div>
      <div className="max-w-2xl space-y-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Profile</h3>
            <p className="text-slate-400 text-xs mt-0.5">Update your account information</p>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500 flex items-center justify-center text-white text-xl font-bold shadow-md">AD</div>
              <div>
                <p className="font-semibold text-slate-900">Administrator</p>
                <p className="text-slate-400 text-sm">admin@school.edu</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-xs font-medium mt-1.5">Admin</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Full Name</label>
                <input defaultValue="Administrator" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Email</label>
                <input defaultValue="admin@school.edu" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" />
              </div>
            </div>
            <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }} className={`px-4 py-2 text-sm font-medium rounded-xl transition-all shadow-sm ${saved ? "bg-emerald-500 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}>
              {saved ? "✓ Saved!" : "Save Changes"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Preferences</h3>
          </div>
          <div className="divide-y divide-slate-50">
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-medium text-slate-900">Email Notifications</p>
                <p className="text-xs text-slate-400 mt-0.5">Receive alerts for student activity</p>
              </div>
              <button onClick={() => setNotifications((v) => !v)} className={`relative w-11 h-6 rounded-full transition-colors ${notifications ? "bg-indigo-600" : "bg-slate-200"}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifications ? "translate-x-5" : "translate-x-0"}`} />
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

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100"><h3 className="font-semibold text-slate-900">System</h3></div>
          <div className="divide-y divide-slate-50">
            <div className="flex items-center justify-between px-6 py-4">
              <div><p className="text-sm font-medium text-slate-900">API Endpoint</p><p className="text-xs text-slate-400 mt-0.5 font-mono">{API_URL}</p></div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Connected
              </span>
            </div>
            <div className="flex items-center justify-between px-6 py-4">
              <div><p className="text-sm font-medium text-slate-900">Version</p><p className="text-xs text-slate-400 mt-0.5">StudentHub v2.0.0</p></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-red-100"><h3 className="font-semibold text-red-500">Account</h3></div>
          <div className="px-6 py-4 flex items-center justify-between">
            <div><p className="text-sm font-medium text-slate-900">Sign Out</p><p className="text-xs text-slate-400 mt-0.5">End your current session</p></div>
            <button onClick={onLogout} className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-xl transition-colors">Sign Out</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const [authed,        setAuthed]        = useState(false);
  const [activeTab,     setActiveTab]     = useState<Tab>("dashboard");

  // Students
  const [students,      setStudents]      = useState<Student[]>([]);
  const [fetching,      setFetching]      = useState(true);
  const [modalOpen,     setModalOpen]     = useState(false);
  const [editing,       setEditing]       = useState<Student | null>(null);
  const [saving,        setSaving]        = useState(false);
  const [toDelete,      setToDelete]      = useState<Student | null>(null);
  const [deleting,      setDeleting]      = useState(false);

  // Courses
  const [courses,           setCourses]           = useState<Course[]>([]);
  const [coursesFetching,   setCoursesFetching]   = useState(true);
  const [courseModalOpen,   setCourseModalOpen]   = useState(false);
  const [editingCourse,     setEditingCourse]     = useState<Course | null>(null);
  const [savingCourse,      setSavingCourse]      = useState(false);
  const [deletingCourse,    setDeletingCourse]    = useState<Course | null>(null);
  const [deletingCourseIP,  setDeletingCourseIP]  = useState(false);

  // Grades navigation
  const [gradesCourseId, setGradesCourseId] = useState<string | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // ── Auth ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!localStorage.getItem("sh_auth")) router.replace("/login");
    else setAuthed(true);
  }, [router]);

  // ── Toast helpers ─────────────────────────────────────────────────────
  const toast = useCallback((message: string, type: ToastItem["type"]) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: number) => setToasts((p) => p.filter((t) => t.id !== id)), []);

  // ── Fetch ─────────────────────────────────────────────────────────────
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

  const fetchCourses = useCallback(async () => {
    try {
      setCoursesFetching(true);
      const res = await fetch(`${API_URL}/api/courses`);
      if (!res.ok) throw new Error();
      setCourses(await res.json());
    } catch {
      toast("Failed to load courses.", "error");
    } finally {
      setCoursesFetching(false);
    }
  }, [toast]);

  useEffect(() => {
    if (authed) { fetchStudents(); fetchCourses(); }
  }, [authed, fetchStudents, fetchCourses]);

  // ── Handlers ──────────────────────────────────────────────────────────
  function handleLogout() {
    localStorage.removeItem("sh_auth");
    router.replace("/login");
  }

  async function handleStudentSubmit(data: FormData) {
    setSaving(true);
    const payload = {
      name: data.name,
      email: data.email,
      age: parseInt(data.age),
      gradeLevel: parseInt(data.gradeLevel),
    };
    try {
      if (editing) {
        const res = await fetch(`${API_URL}/api/students/${editing._id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        toast(`${data.name} updated successfully`, "success");
      } else {
        const res = await fetch(`${API_URL}/api/students`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
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

  async function handleStudentDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/api/students/${toDelete._id}`, { method: "DELETE" });
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

  async function handleCourseSubmit(data: CourseFormData) {
    setSavingCourse(true);
    const payload = {
      name: data.name, subject: data.subject, teacherName: data.teacherName,
      gradeLevel: parseInt(data.gradeLevel),
      period: data.period ? parseInt(data.period) : undefined,
      credits: parseFloat(data.credits) || 1,
      semester: data.semester, year: parseInt(data.year),
      description: data.description || undefined,
    };
    try {
      if (editingCourse) {
        const res = await fetch(`${API_URL}/api/courses/${editingCourse._id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        toast(`${data.name} updated`, "success");
      } else {
        const res = await fetch(`${API_URL}/api/courses`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        toast(`${data.name} created`, "success");
      }
      setCourseModalOpen(false);
      fetchCourses();
    } catch {
      toast("Operation failed. Please try again.", "error");
    } finally {
      setSavingCourse(false);
    }
  }

  async function handleCourseDelete() {
    if (!deletingCourse) return;
    setDeletingCourseIP(true);
    try {
      const res = await fetch(`${API_URL}/api/courses/${deletingCourse._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast(`${deletingCourse.name} deleted`, "success");
      setDeletingCourse(null);
      fetchCourses();
    } catch {
      toast("Failed to delete course.", "error");
    } finally {
      setDeletingCourseIP(false);
    }
  }

  function handleViewGrades(courseId: string) {
    setGradesCourseId(courseId);
    setActiveTab("grades");
  }

  const headerMeta: Record<Tab, { title: string; sub: string }> = {
    dashboard: { title: "Dashboard",          sub: "Welcome back, Administrator"             },
    students:  { title: "Students",           sub: "Manage and track all enrolled students"  },
    classes:   { title: "Classes",            sub: "Manage courses and student enrollments"  },
    grades:    { title: "Grades",             sub: "Submit and review final grades"          },
    analytics: { title: "Analytics",          sub: "Student data insights and statistics"    },
    settings:  { title: "Settings",           sub: "Manage your account and preferences"     },
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
            <button onClick={() => { setEditing(null); setModalOpen(true); }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm">
              <span className="text-lg leading-none">+</span> Add Student
            </button>
          )}
          {activeTab === "classes" && (
            <button onClick={() => { setEditingCourse(null); setCourseModalOpen(true); }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm">
              <span className="text-lg leading-none">+</span> Add Course
            </button>
          )}
        </header>

        {/* Tab content */}
        {activeTab === "dashboard" && (
          <DashboardView
            students={students} courses={courses}
            onGoToStudents={() => setActiveTab("students")}
            onGoToClasses={() => setActiveTab("classes")}
            onAddStudent={() => { setEditing(null); setModalOpen(true); setActiveTab("students"); }}
          />
        )}
        {activeTab === "students"  && <StudentsView students={students} fetching={fetching} onEdit={(s) => { setEditing(s); setModalOpen(true); }} onDelete={setToDelete} />}
        {activeTab === "classes"   && <ClassesView courses={courses} fetching={coursesFetching} onEdit={(c) => { setEditingCourse(c); setCourseModalOpen(true); }} onDelete={setDeletingCourse} onViewGrades={handleViewGrades} />}
        {activeTab === "grades"    && <GradesView courses={courses} students={students} toast={toast} initCourseId={gradesCourseId} onGradeChanged={fetchStudents} />}
        {activeTab === "analytics" && <AnalyticsView students={students} />}
        {activeTab === "settings"  && <SettingsView onLogout={handleLogout} />}
      </div>

      {/* Global overlays */}
      <StudentModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleStudentSubmit} editing={editing} saving={saving} />
      <CourseModal  open={courseModalOpen} onClose={() => setCourseModalOpen(false)} onSubmit={handleCourseSubmit} editing={editingCourse} saving={savingCourse} />
      <ConfirmDelete name={toDelete?.name ?? null}       entity="Student" onConfirm={handleStudentDelete} onCancel={() => setToDelete(null)}       deleting={deleting}         />
      <ConfirmDelete name={deletingCourse?.name ?? null} entity="Course"  onConfirm={handleCourseDelete}  onCancel={() => setDeletingCourse(null)}  deleting={deletingCourseIP} />
      <Toasts items={toasts} onRemove={removeToast} />
    </div>
  );
}
