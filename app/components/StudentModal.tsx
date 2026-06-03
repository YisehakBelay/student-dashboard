"use client";

import { useState, useEffect } from "react";
import { Student, StudentFormData } from "../types";
import { GRADE_LABELS } from "../lib/constants";

export function StudentModal({
  open,
  onClose,
  onSubmit,
  editing,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (d: StudentFormData) => void;
  editing: Student | null;
  saving: boolean;
}) {
  const empty: StudentFormData = { name: "", email: "", age: "", gradeLevel: "" };
  const [form, setForm] = useState<StudentFormData>(empty);
  const [errors, setErrors] = useState<Partial<StudentFormData>>({});

  useEffect(() => {
    setForm(
      editing
        ? {
            name: editing.name,
            email: editing.email,
            age: String(editing.age),
            gradeLevel: String(editing.gradeLevel),
          }
        : empty,
    );
    setErrors({});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, open]);

  function validate() {
    const e: Partial<StudentFormData> = {};
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
    key: keyof StudentFormData,
    props: React.InputHTMLAttributes<HTMLInputElement>,
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
            : "border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
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
            <h2 className="text-lg font-bold text-slate-900">
              {editing ? "Edit Student" : "Add New Student"}
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">
              {editing ? "Update student information" : "Fill in the details below"}
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
                    : "border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                }`}
              >
                <option value="">Select grade</option>
                {[9, 10, 11, 12].map((g) => (
                  <option key={g} value={g}>
                    {GRADE_LABELS[g].full}
                  </option>
                ))}
              </select>
              {errors.gradeLevel && (
                <p className="text-red-500 text-xs mt-1">{errors.gradeLevel}</p>
              )}
            </div>
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
              className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors disabled:opacity-60 shadow-sm"
            >
              {saving ? "Saving…" : editing ? "Save Changes" : "Add Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
