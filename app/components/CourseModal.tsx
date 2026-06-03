"use client";

import { useState, useEffect } from "react";
import { Course, CourseFormData } from "../types";
import { GRADE_LABELS } from "../lib/constants";

export function CourseModal({
  open,
  onClose,
  onSubmit,
  editing,
  saving,
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
    setForm(
      editing
        ? {
            name: editing.name,
            subject: editing.subject,
            teacherName: editing.teacherName,
            gradeLevel: String(editing.gradeLevel),
            period: String(editing.period ?? ""),
            credits: String(editing.credits ?? 1),
            semester: editing.semester,
            year: String(editing.year),
            description: editing.description ?? "",
          }
        : empty,
    );
    setErrors({});
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
            <h2 className="text-lg font-bold text-slate-900">
              {editing ? "Edit Course" : "Add New Course"}
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">
              {editing ? "Update course details" : "Fill in the course information"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 text-sm"
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Course Name</label>
            <input
              type="text" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Algebra II"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.name ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"}`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject</label>
            <input
              type="text" value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="e.g. Mathematics"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.subject ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"}`}
            />
            {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Teacher Name</label>
            <input
              type="text" value={form.teacherName}
              onChange={(e) => setForm({ ...form, teacherName: e.target.value })}
              placeholder="e.g. Mr. Johnson"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.teacherName ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"}`}
            />
            {errors.teacherName && (
              <p className="text-red-500 text-xs mt-1">{errors.teacherName}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Grade Level</label>
              <select
                value={form.gradeLevel}
                onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.gradeLevel ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"}`}
              >
                <option value="">Select grade</option>
                {[9, 10, 11, 12].map((g) => (
                  <option key={g} value={g}>{GRADE_LABELS[g].full}</option>
                ))}
              </select>
              {errors.gradeLevel && (
                <p className="text-red-500 text-xs mt-1">{errors.gradeLevel}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Period</label>
              <select
                value={form.period}
                onChange={(e) => setForm({ ...form, period: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
              >
                <option value="">Select period</option>
                {[1,2,3,4,5,6,7,8].map((p) => (
                  <option key={p} value={p}>Period {p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Semester</label>
              <select
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
              >
                <option value="Fall">Fall</option>
                <option value="Spring">Spring</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Year</label>
              <input
                type="number" value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                min="2000" max="2100"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.year ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"}`}
              />
              {errors.year && <p className="text-red-500 text-xs mt-1">{errors.year}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Credits</label>
              <input
                type="number" value={form.credits}
                onChange={(e) => setForm({ ...form, credits: e.target.value })}
                min="0.5" max="4" step="0.5"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Description <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief course description…"
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors disabled:opacity-60 shadow-sm"
            >
              {saving ? "Saving…" : editing ? "Save Changes" : "Add Course"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
