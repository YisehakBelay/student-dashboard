"use client";

import { useMemo } from "react";
import { Student, Course } from "../types";
import { GRADE_LABELS, GRADE_LEVEL_COLORS } from "../lib/constants";
import { getInitials, getAvatarColor } from "../lib/utils";
import { StatCard } from "./StatCard";

export function DashboardView({
  students,
  courses,
  onGoToStudents,
  onGoToClasses,
  onAddStudent,
}: {
  students: Student[];
  courses: Course[];
  onGoToStudents: () => void;
  onGoToClasses: () => void;
  onAddStudent: () => void;
}) {
  const stats = useMemo(() => {
    const withGPA = students.filter(
      (s) => s.gpa !== null && s.gpa !== undefined,
    ) as (Student & { gpa: number })[];
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
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-6 mb-8 text-white shadow-lg shadow-emerald-500/20">
        <p className="text-emerald-200 text-sm">{today}</p>
        <h2 className="text-2xl font-bold mt-1">Welcome back, Administrator!</h2>
        <p className="text-emerald-200 text-sm mt-1">
          Here&apos;s an overview of your high school management system.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Students" value={stats.total}   icon="👥" bg="bg-emerald-50" sub="Enrolled" />
        <StatCard label="Total Courses"  value={stats.courses} icon="🏫" bg="bg-violet-50"  sub="Active"   />
        <StatCard label="Average GPA"    value={stats.avgGPA}  icon="📊" bg="bg-emerald-50" sub="Across all grades" />
        <StatCard label="Grade Levels"   value="9–12"          icon="🎓" bg="bg-amber-50"   sub="Freshman–Senior" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Recent Students</h3>
            <button
              onClick={onGoToStudents}
              className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
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
                  <span
                    className={`text-xs px-2 py-0.5 rounded-lg font-medium ${
                      GRADE_LEVEL_COLORS[s.gradeLevel] ?? "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {GRADE_LABELS[s.gradeLevel]?.short ?? s.gradeLevel}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={onAddStudent}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-left transition-colors"
            >
              <span className="text-xl">➕</span>
              <div>
                <p className="text-sm font-medium text-emerald-700">Add New Student</p>
                <p className="text-xs text-emerald-400">Register a new student record</p>
              </div>
            </button>
            <button
              onClick={onGoToClasses}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-left transition-colors"
            >
              <span className="text-xl">🏫</span>
              <div>
                <p className="text-sm font-medium text-slate-700">Manage Classes</p>
                <p className="text-xs text-slate-400">Add courses and enroll students</p>
              </div>
            </button>
            <button
              onClick={onGoToStudents}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-left transition-colors"
            >
              <span className="text-xl">👥</span>
              <div>
                <p className="text-sm font-medium text-slate-700">View All Students</p>
                <p className="text-xs text-slate-400">Browse and manage records</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
