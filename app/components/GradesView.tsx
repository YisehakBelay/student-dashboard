"use client";

import { useState, useEffect } from "react";
import { Course, Student, Enrollment, ToastItem } from "../types";
import { GRADE_LABELS } from "../lib/constants";
import { apiFetch, handleUnauthorized } from "../lib/api";
import { getInitials, getAvatarColor, letterGrade } from "../lib/utils";
import { downloadExcel, downloadPDF } from "../lib/export";
import { ExportButton } from "./ExportButton";

export function GradesView({
  courses,
  students,
  toast,
  initCourseId,
  onGradeChanged,
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
        const res = await apiFetch(`/api/courses/${selectedCourseId}/enrollments`);
        if (res.status === 401) { handleUnauthorized(); return; }
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
      const res = await apiFetch(`/api/enrollments/${enrollmentId}/grade`, {
        method: "PUT",
        body: JSON.stringify({ grade }),
      });
      if (!res.ok) throw new Error();
      const updated: Enrollment = await res.json();
      setEnrollments((prev) => prev.map((e) => (e._id === enrollmentId ? updated : e)));
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
      const res = await apiFetch("/api/enrollments", {
        method: "POST",
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
      const res = await apiFetch(`/api/enrollments/${enrollmentId}`, { method: "DELETE" });
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
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Select Course
        </label>
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="w-full max-w-lg px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all bg-white"
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
          <div className="w-7 h-7 border-[3px] border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Loading enrollments…</p>
        </div>
      ) : selectedCourse && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 font-bold text-sm">
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
              <ExportButton
                disabled={enrollments.length === 0}
                onExcelClick={() => {
                  const headers = ["Student ID", "Name", "Email", "Score (0-100)", "Letter", "GPA Points", "Status"];
                  const rows = enrollments.map((e) => {
                    const g = e.grade !== null ? letterGrade(e.grade) : null;
                    return [
                      e.student.studentId ?? "",
                      e.student.name,
                      e.student.email,
                      e.grade ?? "Pending",
                      g?.letter ?? "—",
                      g ? g.points.toFixed(1) : "—",
                      e.gradeSubmitted ? "Submitted" : "Pending",
                    ];
                  });
                  downloadExcel(`Grades_${selectedCourse?.name ?? "Export"}`, headers, rows);
                }}
                onPDFClick={() => {
                  const title = `Grade Report — ${selectedCourse?.name} — ${selectedCourse?.semester} ${selectedCourse?.year}`;
                  const headers = ["Name", "Student ID", "Score", "Letter", "Status"];
                  const rows = enrollments.map((e) => {
                    const g = e.grade !== null ? letterGrade(e.grade) : null;
                    return [
                      e.student.name,
                      e.student.studentId ?? "—",
                      e.grade !== null ? String(e.grade) : "Pending",
                      g?.letter ?? "—",
                      e.gradeSubmitted ? "Submitted" : "Pending",
                    ];
                  });
                  downloadPDF(`Grades_${selectedCourse?.name ?? "Export"}`, title, headers, rows);
                }}
              />
              <button
                onClick={() => setEnrollOpen(true)}
                disabled={available.length === 0}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                      <th
                        key={h}
                        className={`px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider ${h === "Actions" ? "text-right" : "text-left"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((e) => {
                    const val       = gradeInputs[e._id] ?? "";
                    const numeric   = parseFloat(val);
                    const gradeInfo = !isNaN(numeric) && numeric >= 0 && numeric <= 100
                      ? letterGrade(numeric)
                      : null;

                    return (
                      <tr
                        key={e._id}
                        className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${getAvatarColor(e.student.name)}`}
                            >
                              {getInitials(e.student.name)}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 text-sm">{e.student.name}</p>
                              <p className="text-xs text-slate-400">{e.student.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                            {e.student.studentId ?? "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number" min="0" max="100" value={val} placeholder="0–100"
                            onChange={(ev) =>
                              setGradeInputs((p) => ({ ...p, [e._id]: ev.target.value }))
                            }
                            className="w-20 px-3 py-1.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                          />
                        </td>
                        <td className="px-6 py-4">
                          {gradeInfo ? (
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${gradeInfo.color}`}
                            >
                              {gradeInfo.letter} · {gradeInfo.points.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-sm">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {e.gradeSubmitted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-medium">
                              ✓ Submitted
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600 text-xs font-medium">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => submitGrade(e._id, e.student.name)}
                              disabled={!val || submitting[e._id]}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
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

      {enrollOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => { setEnrollOpen(false); setEnrollStudent(""); }}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-0.5">Enroll Student</h2>
            <p className="text-slate-500 text-sm mb-5">
              Select a student to enroll in{" "}
              <span className="font-semibold text-slate-700">{selectedCourse?.name}</span>
            </p>
            {available.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">
                All students are already enrolled in this course.
              </p>
            ) : (
              <select
                value={enrollStudent}
                onChange={(e) => setEnrollStudent(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all mb-4 bg-white"
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
              <button
                onClick={() => { setEnrollOpen(false); setEnrollStudent(""); }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEnroll}
                disabled={!enrollStudent || enrolling}
                className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors disabled:opacity-60 shadow-sm"
              >
                {enrolling ? "Enrolling…" : "Enroll"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
