export interface Student {
  _id: string;
  name: string;
  email: string;
  age: number;
  gradeLevel: 9 | 10 | 11 | 12;
  studentId?: string;
  gpa?: number | null;
}

export interface Course {
  _id: string;
  name: string;
  subject: string;
  teacherName: string;
  gradeLevel: 9 | 10 | 11 | 12;
  period?: number;
  credits: number;
  semester: "Fall" | "Spring";
  year: number;
  description?: string;
  enrollmentCount?: number;
}

export interface Enrollment {
  _id: string;
  student: Student;
  course: Course;
  grade: number | null;
  gradeSubmitted: boolean;
  submittedAt?: string;
}

export interface StudentFormData {
  name: string;
  email: string;
  age: string;
  gradeLevel: string;
}

export interface CourseFormData {
  name: string;
  subject: string;
  teacherName: string;
  gradeLevel: string;
  period: string;
  credits: string;
  semester: string;
  year: string;
  description: string;
}

export interface ToastItem {
  id: number;
  message: string;
  type: "success" | "error";
}

export interface AttendanceRecord {
  _id: string;
  student: Student;
  course: Course;
  date: string;
  status: "present" | "absent" | "late" | "excused";
  note: string;
}

export interface Payment {
  _id: string;
  amount: number;
  date: string;
  note: string;
}

export interface Fee {
  _id: string;
  student: Student;
  description: string;
  category: "tuition" | "registration" | "lab" | "library" | "sports" | "other";
  totalAmount: number;
  paidAmount: number;
  dueDate?: string;
  semester?: "Fall" | "Spring";
  year?: number;
  payments: Payment[];
  status: "paid" | "partial" | "unpaid";
}

export interface FeeFormData {
  studentId: string;
  description: string;
  category: string;
  totalAmount: string;
  dueDate: string;
  semester: string;
  year: string;
}

export type Tab =
  | "dashboard"
  | "students"
  | "classes"
  | "grades"
  | "attendance"
  | "fees"
  | "analytics"
  | "settings";
