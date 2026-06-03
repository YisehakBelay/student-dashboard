"use client";

import { useState, useMemo } from "react";
import { Course } from "../types";
import { GRADE_LABELS, GRADE_LEVEL_COLORS } from "../lib/constants";

export function ClassesView({
  courses,
  fetching,
  onEdit,
  onDelete,
  onViewGrades,
}: {
  courses: Course[];
  fetching: boolean;
  onEdit: (c: Course) => void;
  onDelete: (c: Course) => void;
  onViewGrades: (courseId: string) => void;
}) {
  const [filterSemester,   setFilterSemester]   = useState("");
  const [filterGradeLevel, setFilterGradeLevel] = useState("");

  const filtered = useMemo(
    () =>
      courses.filter((c) => {
        if (filterSemester   && c.semester   !== filterSemester)                  return false;
        if (filterGradeLevel && c.gradeLevel !== parseInt(filterGradeLevel))      return false;
        return true;
      }),
    [courses, filterSemester, filterGradeLevel],
  );

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <select
          value={filterSemester}
          onChange={(e) => setFilterSemester(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-400 transition-all bg-white"
        >
          <option value="">All Semesters</option>
          <option value="Fall">Fall</option>
          <option value="Spring">Spring</option>
        </select>
        <select
          value={filterGradeLevel}
          onChange={(e) => setFilterGradeLevel(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-400 transition-all bg-white"
        >
          <option value="">All Grade Levels</option>
          {[9, 10, 11, 12].map((g) => (
            <option key={g} value={g}>{GRADE_LABELS[g].full}</option>
          ))}
        </select>
        <span className="text-slate-400 text-sm ml-auto">
          {filtered.length} course{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {fetching ? (
        <div className="py-24 flex flex-col items-center gap-4 text-slate-400">
          <div className="w-8 h-8 border-[3px] border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Loading courses…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 flex flex-col items-center gap-3">
          <div className="text-5xl">🏫</div>
          <p className="text-slate-700 font-semibold">No courses found</p>
          <p className="text-slate-400 text-sm">
            {courses.length === 0
              ? 'Click "Add Course" to create the first course'
              : "Try adjusting your filters"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Course", "Teacher", "Grade", "Period", "Semester", "Enrolled", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        className={`px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider ${
                          h === "Actions" ? "text-right" : "text-left"
                        }`}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c._id}
                    className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-xs flex-shrink-0">
                          {c.subject.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{c.name}</p>
                          <p className="text-xs text-slate-400">
                            {c.subject} · {c.credits} cr
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-sm">{c.teacherName}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                          GRADE_LEVEL_COLORS[c.gradeLevel] ?? "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {GRADE_LABELS[c.gradeLevel]?.short ?? c.gradeLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {c.period ? `Period ${c.period}` : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                          c.semester === "Fall"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {c.semester} {c.year}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-700">
                        {c.enrollmentCount ?? 0}
                      </span>
                      <span className="text-xs text-slate-400 ml-1">
                        student{(c.enrollmentCount ?? 0) !== 1 ? "s" : ""}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onViewGrades(c._id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                        >
                          Grades
                        </button>
                        <button
                          onClick={() => onEdit(c)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(c)}
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
        </div>
      )}
    </div>
  );
}
