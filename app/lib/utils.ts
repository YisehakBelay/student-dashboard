import { AVATAR_COLORS } from "./constants";

export function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export function getAvatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export function letterGrade(n: number): { letter: string; color: string; points: number } {
  if (n >= 90) return { letter: "A", color: "bg-emerald-100 text-emerald-700", points: 4.0 };
  if (n >= 80) return { letter: "B", color: "bg-blue-100 text-blue-700",       points: 3.0 };
  if (n >= 70) return { letter: "C", color: "bg-amber-100 text-amber-700",     points: 2.0 };
  if (n >= 60) return { letter: "D", color: "bg-orange-100 text-orange-700",   points: 1.0 };
  return             { letter: "F", color: "bg-red-100 text-red-700",          points: 0.0 };
}

export function formatGPA(gpa: number | null | undefined): string {
  if (gpa === null || gpa === undefined) return "—";
  return gpa.toFixed(2);
}
