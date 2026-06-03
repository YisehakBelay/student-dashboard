"use client";

import { useState, useMemo } from "react";
import { Student } from "../types";
import { GRADE_LABELS, GRADE_LEVEL_COLORS } from "../lib/constants";
import { getInitials, getAvatarColor, letterGrade, formatGPA } from "../lib/utils";
import { downloadExcel, downloadPDF } from "../lib/export";
import { ExportButton } from "./ExportButton";
import { SortIcon } from "./SortIcon";

const PAGE_SIZE = 8;
type SortField = "name" | "email" | "age" | "gradeLevel" | "gpa";

export function StudentsView({
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
        const cmp =
          typeof va === "number"
            ? va - (vb as number)
            : String(va).localeCompare(String(vb));
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [students, search, sortField, sortDir]);

  const paginated  = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

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
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
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
          <ExportButton
            disabled={filtered.length === 0}
            onExcelClick={() => {
              const headers = ["Student ID", "Name", "Email", "Grade Level", "GPA", "Age"];
              const rows = filtered.map((s) => [
                s.studentId ?? "",
                s.name,
                s.email,
                GRADE_LABELS[s.gradeLevel]?.full ?? String(s.gradeLevel),
                formatGPA(s.gpa),
                s.age,
              ]);
              downloadExcel("Students", headers, rows);
            }}
            onPDFClick={() => {
              const headers = ["ID", "Name", "Email", "Grade Level", "GPA"];
              const rows = filtered.map((s) => [
                s.studentId ?? "—",
                s.name,
                s.email,
                GRADE_LABELS[s.gradeLevel]?.full ?? String(s.gradeLevel),
                formatGPA(s.gpa),
              ]);
              downloadPDF("Students", "Student Directory", headers, rows);
            }}
          />
        </div>

        {fetching ? (
          <div className="py-24 flex flex-col items-center gap-4 text-slate-400">
            <div className="w-8 h-8 border-[3px] border-emerald-500 border-t-transparent rounded-full animate-spin" />
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
                    {cols.map(({ label, field }) => (
                      <th
                        key={field}
                        onClick={() => toggleSort(field)}
                        className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-emerald-600 transition-colors select-none"
                      >
                        {label}
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
                    <tr
                      key={s._id}
                      className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${getAvatarColor(s.name)}`}
                          >
                            {getInitials(s.name)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{s.name}</p>
                            {s.studentId && (
                              <p className="text-xs text-slate-400 font-mono">{s.studentId}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                            GRADE_LEVEL_COLORS[s.gradeLevel] ?? "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {GRADE_LABELS[s.gradeLevel]?.full ?? s.gradeLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-sm">{s.email}</td>
                      <td className="px-6 py-4">
                        {s.gpa !== null && s.gpa !== undefined ? (
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${letterGrade(s.gpa * 25).color}`}
                          >
                            {formatGPA(s.gpa)}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600">
                          {s.age} yrs
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onEdit(s)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors"
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
                  Showing {(page - 1) * PAGE_SIZE + 1}–
                  {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
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
                        <span key={`e${i}`} className="px-2 text-slate-400 text-sm">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPage(p as number)}
                          className={`w-9 py-1.5 rounded-lg border text-sm transition-colors ${
                            page === p
                              ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                              : "border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {p}
                        </button>
                      ),
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
