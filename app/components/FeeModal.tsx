"use client";

import { useState, useEffect } from "react";
import { Fee, FeeFormData, Student } from "../types";
import { FEE_CATEGORIES, GRADE_LABELS } from "../lib/constants";

export function FeeModal({
  open,
  onClose,
  onSubmit,
  editing,
  saving,
  students,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (d: FeeFormData) => void;
  editing: Fee | null;
  saving: boolean;
  students: Student[];
}) {
  const cy = new Date().getFullYear();
  const empty: FeeFormData = {
    studentId: "", description: "", category: "tuition",
    totalAmount: "", dueDate: "", semester: "", year: String(cy),
  };
  const [form, setForm] = useState<FeeFormData>(empty);
  const [errors, setErrors] = useState<Partial<FeeFormData>>({});

  useEffect(() => {
    setForm(
      editing
        ? {
            studentId: editing.student._id,
            description: editing.description,
            category: editing.category,
            totalAmount: String(editing.totalAmount),
            dueDate: editing.dueDate ? editing.dueDate.split("T")[0] : "",
            semester: editing.semester ?? "",
            year: String(editing.year ?? cy),
          }
        : empty,
    );
    setErrors({});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, open]);

  function validate() {
    const e: Partial<FeeFormData> = {};
    if (!form.studentId) e.studentId = "Student is required";
    if (!form.description.trim()) e.description = "Description is required";
    const amt = parseFloat(form.totalAmount);
    if (!form.totalAmount || isNaN(amt) || amt <= 0) e.totalAmount = "Enter a valid amount";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {editing ? "Edit Fee" : "Add Fee Record"}
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">
              {editing ? "Update fee details" : "Create a new fee for a student"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 text-sm"
          >
            ✕
          </button>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); if (validate()) onSubmit(form); }}
          className="px-6 py-5 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Student</label>
            <select
              value={form.studentId}
              onChange={(e) => setForm({ ...form, studentId: e.target.value })}
              disabled={!!editing}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none bg-white transition-all disabled:opacity-60 ${errors.studentId ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"}`}
            >
              <option value="">— Select student —</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} · {GRADE_LABELS[s.gradeLevel]?.short}
                </option>
              ))}
            </select>
            {errors.studentId && <p className="text-red-500 text-xs mt-1">{errors.studentId}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <input
              type="text" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Fall 2025 Tuition"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.description ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"}`}
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 bg-white capitalize transition-all"
              >
                {FEE_CATEGORIES.map((c) => (
                  <option key={c} value={c} className="capitalize">{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount (ETB)</label>
              <input
                type="number" value={form.totalAmount}
                onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
                placeholder="e.g. 5000" min="1"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.totalAmount ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"}`}
              />
              {errors.totalAmount && (
                <p className="text-red-500 text-xs mt-1">{errors.totalAmount}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Due Date</label>
              <input
                type="date" value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Semester</label>
              <select
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 bg-white transition-all"
              >
                <option value="">None</option>
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
              />
            </div>
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
              className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium transition-colors disabled:opacity-60 shadow-sm"
            >
              {saving ? "Saving…" : editing ? "Save Changes" : "Add Fee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
