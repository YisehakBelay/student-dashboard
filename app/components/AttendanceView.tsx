"use client";

import { useState, useEffect } from "react";
import { Course, Enrollment, AttendanceRecord, ToastItem } from "../types";
import { API_URL, ATTENDANCE_STATUS } from "../lib/constants";
import { getInitials, getAvatarColor } from "../lib/utils";
import { downloadExcel, downloadPDF } from "../lib/export";
import { ExportButton } from "./ExportButton";

export function AttendanceView({
  courses,
  toast,
}: {
  courses: Course[];
  toast: (msg: string, type: ToastItem["type"]) => void;
}) {
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [draft, setDraft] = useState<Record<string, { status: string; note: string }>>({});
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    if (!selectedCourseId) { setEnrollments([]); setDraft({}); return; }
    fetch(`${API_URL}/api/courses/${selectedCourseId}/enrollments`)
      .then((r) => r.json())
      .then(setEnrollments)
      .catch(() => toast("Failed to load enrollments.", "error"));
  }, [selectedCourseId, toast]);

  useEffect(() => {
    if (!selectedCourseId || !selectedDate || enrollments.length === 0) return;
    let cancelled = false;
    setLoading(true);
    fetch(`${API_URL}/api/attendance?course=${selectedCourseId}&date=${selectedDate}`)
      .then((r) => r.json())
      .then((records: AttendanceRecord[]) => {
        if (cancelled) return;
        const d: Record<string, { status: string; note: string }> = {};
        enrollments.forEach((e) => {
          const existing = records.find((r) => r.student._id === e.student._id);
          d[e.student._id] = existing
            ? { status: existing.status, note: existing.note }
            : { status: "present", note: "" };
        });
        setDraft(d);
      })
      .catch(() => { if (!cancelled) toast("Failed to load attendance.", "error"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedCourseId, selectedDate, enrollments, toast]);

  async function saveAttendance() {
    if (!selectedCourseId || enrollments.length === 0) return;
    setSaving(true);
    try {
      const records = enrollments.map((e) => ({
        student: e.student._id,
        status: draft[e.student._id]?.status ?? "present",
        note: draft[e.student._id]?.note ?? "",
      }));
      const res = await fetch(`${API_URL}/api/attendance/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course: selectedCourseId, date: selectedDate, records }),
      });
      if (!res.ok) throw new Error();
      toast(`Attendance saved for ${selectedDate}`, "success");
    } catch {
      toast("Failed to save attendance.", "error");
    } finally {
      setSaving(false);
    }
  }

  const selectedCourse = courses.find((c) => c._id === selectedCourseId);
  const stats = enrollments.length > 0
    ? {
        present: Object.values(draft).filter((d) => d.status === "present").length,
        late:    Object.values(draft).filter((d) => d.status === "late").length,
        absent:  Object.values(draft).filter((d) => d.status === "absent").length,
        excused: Object.values(draft).filter((d) => d.status === "excused").length,
      }
    : null;

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-56">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Course
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 bg-white transition-all"
            >
              <option value="">— Choose a course —</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.semester} {c.year} · {c.name} · {c.teacherName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
            />
          </div>
        </div>
      </div>

      {!selectedCourseId ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
          <span className="text-5xl">📅</span>
          <p className="font-semibold text-slate-600">Select a course to take attendance</p>
        </div>
      ) : loading ? (
        <div className="py-16 flex items-center justify-center gap-3 text-slate-400">
          <div className="w-7 h-7 border-[3px] border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Loading…</p>
        </div>
      ) : enrollments.length === 0 ? (
        <div className="py-24 flex flex-col items-center gap-3">
          <div className="text-5xl">👥</div>
          <p className="text-slate-700 font-semibold">No students enrolled in this course</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 gap-3 flex-wrap">
            <div>
              <p className="font-semibold text-slate-900">{selectedCourse?.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                  weekday: "long", year: "numeric", month: "long", day: "numeric",
                })}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {stats && (
                <>
                  <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium">
                    {stats.present} Present
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium">
                    {stats.late} Late
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-red-50 text-red-700 text-xs font-medium">
                    {stats.absent} Absent
                  </span>
                  {stats.excused > 0 && (
                    <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium">
                      {stats.excused} Excused
                    </span>
                  )}
                </>
              )}
              <button
                onClick={() => {
                  const d: typeof draft = {};
                  enrollments.forEach((e) => {
                    d[e.student._id] = { status: "present", note: draft[e.student._id]?.note ?? "" };
                  });
                  setDraft(d);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              >
                All Present
              </button>
              <ExportButton
                disabled={enrollments.length === 0}
                onExcelClick={() => {
                  const headers = ["Name", "Student ID", "Status", "Note", "Date"];
                  const rows = enrollments.map((e) => [
                    e.student.name,
                    e.student.studentId ?? "",
                    draft[e.student._id]?.status ?? "present",
                    draft[e.student._id]?.note ?? "",
                    selectedDate,
                  ]);
                  downloadExcel(`Attendance_${selectedDate}`, headers, rows);
                }}
                onPDFClick={() => {
                  const title = `Attendance — ${selectedCourse?.name} — ${selectedDate}`;
                  const headers = ["Name", "ID", "Status", "Note"];
                  const rows = enrollments.map((e) => [
                    e.student.name,
                    e.student.studentId ?? "—",
                    (draft[e.student._id]?.status ?? "present").toUpperCase(),
                    draft[e.student._id]?.note ?? "",
                  ]);
                  downloadPDF(`Attendance_${selectedDate}`, title, headers, rows);
                }}
              />
              <button
                onClick={saveAttendance}
                disabled={saving}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium rounded-xl transition-colors shadow-sm disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save Attendance"}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Note
                  </th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((e) => {
                  const d = draft[e.student._id] ?? { status: "present", note: "" };
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
                            <p className="text-xs text-slate-400 font-mono">
                              {e.student.studentId ?? e.student.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {(["present", "late", "absent", "excused"] as const).map((status) => (
                            <button
                              key={status}
                              onClick={() =>
                                setDraft((p) => ({
                                  ...p,
                                  [e.student._id]: { ...p[e.student._id] ?? { note: "" }, status },
                                }))
                              }
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                                d.status === status
                                  ? ATTENDANCE_STATUS[status].color + " ring-2 ring-offset-1 ring-current"
                                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                              }`}
                            >
                              {ATTENDANCE_STATUS[status].label}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={d.note}
                          onChange={(ev) =>
                            setDraft((p) => ({
                              ...p,
                              [e.student._id]: {
                                ...p[e.student._id] ?? { status: "present" },
                                note: ev.target.value,
                              },
                            }))
                          }
                          placeholder="Optional note…"
                          className="w-44 px-3 py-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
