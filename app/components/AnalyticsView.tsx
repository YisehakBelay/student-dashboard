"use client";

import { useMemo } from "react";
import { Student } from "../types";
import { GRADE_LABELS, GRADE_LEVEL_BAR } from "../lib/constants";
import { StatCard } from "./StatCard";

function BarChart({
  buckets,
  total,
}: {
  buckets: { label: string; count: number; color: string }[];
  total: number;
}) {
  const max = Math.max(...buckets.map((b) => b.count), 1);
  return (
    <div className="space-y-4">
      {buckets.map((b) => (
        <div key={b.label}>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-600 font-medium">{b.label}</span>
            <span className="text-slate-400">
              {b.count} · {total ? Math.round((b.count / total) * 100) : 0}%
            </span>
          </div>
          <div className="h-7 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${b.color} rounded-full transition-all duration-700 flex items-center justify-end pr-2.5`}
              style={{ width: b.count === 0 ? "0%" : `${Math.max((b.count / max) * 100, 5)}%` }}
            >
              {b.count > 0 && (
                <span className="text-white text-xs font-bold">{b.count}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AnalyticsView({ students }: { students: Student[] }) {
  const data = useMemo(() => {
    if (!students.length) return null;

    const ages = students.map((s) => s.age).sort((a, b) => a - b);
    const sum  = ages.reduce((a, b) => a + b, 0);
    const mid  = Math.floor(ages.length / 2);
    const median =
      ages.length % 2 === 0 ? (ages[mid - 1] + ages[mid]) / 2 : ages[mid];

    const ageBuckets = [
      { label: "Under 14", min: 0,  max: 13, color: "bg-violet-500"  },
      { label: "14–15",    min: 14, max: 15, color: "bg-emerald-500" },
      { label: "16–17",    min: 16, max: 17, color: "bg-blue-500"    },
      { label: "18+",      min: 18, max: 99, color: "bg-emerald-500" },
    ].map((b) => ({
      ...b,
      count: students.filter((s) => s.age >= b.min && s.age <= b.max).length,
    }));

    const gradeLevelBuckets = [9, 10, 11, 12].map((g) => ({
      label: GRADE_LABELS[g].full,
      count: students.filter((s) => s.gradeLevel === g).length,
      color: GRADE_LEVEL_BAR[g],
    }));

    const withGPA = students.filter(
      (s) => s.gpa !== null && s.gpa !== undefined,
    ) as (Student & { gpa: number })[];

    const gpaBuckets = [
      { label: "3.5–4.0 (A avg)", min: 3.5, max: 4.0, color: "bg-emerald-500" },
      { label: "2.5–3.4 (B avg)", min: 2.5, max: 3.4, color: "bg-blue-500"    },
      { label: "1.5–2.4 (C avg)", min: 1.5, max: 2.4, color: "bg-amber-500"   },
      { label: "0.5–1.4 (D avg)", min: 0.5, max: 1.4, color: "bg-orange-500"  },
      { label: "0.0–0.4 (F avg)", min: 0.0, max: 0.4, color: "bg-red-500"     },
    ].map((b) => ({
      ...b,
      count: withGPA.filter((s) => s.gpa >= b.min && s.gpa <= b.max).length,
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

    const avgGPA = withGPA.length
      ? (withGPA.reduce((a, s) => a + s.gpa, 0) / withGPA.length).toFixed(2)
      : null;

    return {
      total: students.length,
      avg: (sum / ages.length).toFixed(1),
      median,
      min: ages[0],
      max: ages[ages.length - 1],
      ageBuckets,
      gradeLevelBuckets,
      gpaBuckets,
      domains,
      avgGPA,
      gpaCount: withGPA.length,
    };
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

  const domainColors = [
    "bg-teal-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-cyan-500",
  ];

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Analytics</h2>
        <p className="text-slate-400 text-sm">Insights derived from student data</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Students" value={data.total}             icon="👥" bg="bg-emerald-50" sub="Enrolled" />
        <StatCard label="Average Age"    value={data.avg}               icon="📊" bg="bg-emerald-50" sub="Years" />
        <StatCard label="Average GPA"    value={data.avgGPA ?? "—"}     icon="🎓" bg="bg-violet-50"  sub={`${data.gpaCount} with grades`} />
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
          <p className="text-slate-400 text-xs mb-6">
            {data.gpaCount} student{data.gpaCount !== 1 ? "s" : ""} with submitted grades
          </p>
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
                    <span className="text-slate-400">
                      {d.count} student{d.count !== 1 ? "s" : ""}
                    </span>
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
