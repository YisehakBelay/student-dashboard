export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export const AVATAR_COLORS = [
  "bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500",
  "bg-rose-500", "bg-cyan-500", "bg-pink-500", "bg-teal-500",
];

export const GRADE_LABELS: Record<number, { short: string; full: string }> = {
  9:  { short: "9th",  full: "9th · Freshman"  },
  10: { short: "10th", full: "10th · Sophomore" },
  11: { short: "11th", full: "11th · Junior"    },
  12: { short: "12th", full: "12th · Senior"    },
};

export const GRADE_LEVEL_COLORS: Record<number, string> = {
  9:  "bg-violet-100 text-violet-700",
  10: "bg-blue-100 text-blue-700",
  11: "bg-emerald-100 text-emerald-700",
  12: "bg-amber-100 text-amber-700",
};

export const GRADE_LEVEL_BAR: Record<number, string> = {
  9:  "bg-violet-500",
  10: "bg-blue-500",
  11: "bg-emerald-500",
  12: "bg-amber-500",
};

export const ATTENDANCE_STATUS = {
  present: { label: "Present", color: "bg-emerald-100 text-emerald-700" },
  late:    { label: "Late",    color: "bg-amber-100 text-amber-700"    },
  absent:  { label: "Absent",  color: "bg-red-100 text-red-700"        },
  excused: { label: "Excused", color: "bg-blue-100 text-blue-700"      },
} as const;

export const FEE_CATEGORIES = [
  "tuition", "registration", "lab", "library", "sports", "other",
] as const;
