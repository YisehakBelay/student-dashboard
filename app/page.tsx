"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

import { Student, Course, Tab, ToastItem, StudentFormData, CourseFormData } from "./types";
import { API_URL } from "./lib/constants";

import { Sidebar }        from "./components/Sidebar";
import { Toasts }         from "./components/Toasts";
import { StudentModal }   from "./components/StudentModal";
import { CourseModal }    from "./components/CourseModal";
import { ConfirmDelete }  from "./components/ConfirmDelete";
import { DashboardView }  from "./components/DashboardView";
import { StudentsView }   from "./components/StudentsView";
import { ClassesView }    from "./components/ClassesView";
import { GradesView }     from "./components/GradesView";
import { AttendanceView } from "./components/AttendanceView";
import { FeesView }       from "./components/FeesView";
import { AnalyticsView }  from "./components/AnalyticsView";
import { SettingsView }   from "./components/SettingsView";

export default function Home() {
  const router = useRouter();
  const [authed,    setAuthed]    = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  // Students
  const [students,  setStudents]  = useState<Student[]>([]);
  const [fetching,  setFetching]  = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing,   setEditing]   = useState<Student | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [toDelete,  setToDelete]  = useState<Student | null>(null);
  const [deleting,  setDeleting]  = useState(false);

  // Courses
  const [courses,          setCourses]          = useState<Course[]>([]);
  const [coursesFetching,  setCoursesFetching]  = useState(true);
  const [courseModalOpen,  setCourseModalOpen]  = useState(false);
  const [editingCourse,    setEditingCourse]    = useState<Course | null>(null);
  const [savingCourse,     setSavingCourse]     = useState(false);
  const [deletingCourse,   setDeletingCourse]   = useState<Course | null>(null);
  const [deletingCourseIP, setDeletingCourseIP] = useState(false);

  // Grades navigation
  const [gradesCourseId, setGradesCourseId] = useState<string | null>(null);

  // Fees — signal to open the Add Fee modal from the header button
  const [addFeeSignal, setAddFeeSignal] = useState(0);

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // ── Auth ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!localStorage.getItem("sh_auth")) router.replace("/login");
    else setAuthed(true);
  }, [router]);

  // ── Toast helpers ────────────────────────────────────────────────────────
  const toast = useCallback((message: string, type: ToastItem["type"]) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback(
    (id: number) => setToasts((p) => p.filter((t) => t.id !== id)),
    [],
  );

  // ── Data fetching ────────────────────────────────────────────────────────
  const fetchStudents = useCallback(async () => {
    try {
      setFetching(true);
      const res = await fetch(`${API_URL}/api/students`);
      if (!res.ok) throw new Error();
      setStudents(await res.json());
    } catch {
      toast("Failed to load students. Is the API running?", "error");
    } finally {
      setFetching(false);
    }
  }, [toast]);

  const fetchCourses = useCallback(async () => {
    try {
      setCoursesFetching(true);
      const res = await fetch(`${API_URL}/api/courses`);
      if (!res.ok) throw new Error();
      setCourses(await res.json());
    } catch {
      toast("Failed to load courses.", "error");
    } finally {
      setCoursesFetching(false);
    }
  }, [toast]);

  useEffect(() => {
    if (authed) { fetchStudents(); fetchCourses(); }
  }, [authed, fetchStudents, fetchCourses]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  function handleLogout() {
    localStorage.removeItem("sh_auth");
    router.replace("/login");
  }

  async function handleStudentSubmit(data: StudentFormData) {
    setSaving(true);
    const payload = {
      name: data.name,
      email: data.email,
      age: parseInt(data.age),
      gradeLevel: parseInt(data.gradeLevel),
    };
    try {
      if (editing) {
        const res = await fetch(`${API_URL}/api/students/${editing._id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        toast(`${data.name} updated successfully`, "success");
      } else {
        const res = await fetch(`${API_URL}/api/students`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        toast(`${data.name} added successfully`, "success");
      }
      setModalOpen(false);
      fetchStudents();
    } catch {
      toast("Operation failed. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleStudentDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/api/students/${toDelete._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast(`${toDelete.name} removed`, "success");
      setToDelete(null);
      fetchStudents();
    } catch {
      toast("Failed to delete. Please try again.", "error");
    } finally {
      setDeleting(false);
    }
  }

  async function handleCourseSubmit(data: CourseFormData) {
    setSavingCourse(true);
    const payload = {
      name: data.name, subject: data.subject, teacherName: data.teacherName,
      gradeLevel: parseInt(data.gradeLevel),
      period: data.period ? parseInt(data.period) : undefined,
      credits: parseFloat(data.credits) || 1,
      semester: data.semester, year: parseInt(data.year),
      description: data.description || undefined,
    };
    try {
      if (editingCourse) {
        const res = await fetch(`${API_URL}/api/courses/${editingCourse._id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        toast(`${data.name} updated`, "success");
      } else {
        const res = await fetch(`${API_URL}/api/courses`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        toast(`${data.name} created`, "success");
      }
      setCourseModalOpen(false);
      fetchCourses();
    } catch {
      toast("Operation failed. Please try again.", "error");
    } finally {
      setSavingCourse(false);
    }
  }

  async function handleCourseDelete() {
    if (!deletingCourse) return;
    setDeletingCourseIP(true);
    try {
      const res = await fetch(`${API_URL}/api/courses/${deletingCourse._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast(`${deletingCourse.name} deleted`, "success");
      setDeletingCourse(null);
      fetchCourses();
    } catch {
      toast("Failed to delete course.", "error");
    } finally {
      setDeletingCourseIP(false);
    }
  }

  function handleViewGrades(courseId: string) {
    setGradesCourseId(courseId);
    setActiveTab("grades");
  }

  const headerMeta: Record<Tab, { title: string; sub: string }> = {
    dashboard:  { title: "Dashboard",  sub: "Welcome back, Administrator"            },
    students:   { title: "Students",   sub: "Manage and track all enrolled students" },
    classes:    { title: "Classes",    sub: "Manage courses and student enrollments" },
    grades:     { title: "Grades",     sub: "Submit and review final grades"         },
    attendance: { title: "Attendance", sub: "Take and review daily class attendance" },
    fees:       { title: "Fees",       sub: "Track student fee billing and payments" },
    analytics:  { title: "Analytics",  sub: "Student data insights and statistics"   },
    settings:   { title: "Settings",   sub: "Manage your account and preferences"    },
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />

      <div className="ml-64 flex-1 flex flex-col min-h-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{headerMeta[activeTab].title}</h1>
            <p className="text-slate-400 text-sm">{headerMeta[activeTab].sub}</p>
          </div>
          {activeTab === "students" && (
            <button
              onClick={() => { setEditing(null); setModalOpen(true); }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
            >
              <span className="text-lg leading-none">+</span> Add Student
            </button>
          )}
          {activeTab === "classes" && (
            <button
              onClick={() => { setEditingCourse(null); setCourseModalOpen(true); }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
            >
              <span className="text-lg leading-none">+</span> Add Course
            </button>
          )}
          {activeTab === "fees" && (
            <button
              onClick={() => setAddFeeSignal((v) => v + 1)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
            >
              <span className="text-lg leading-none">+</span> Add Fee
            </button>
          )}
        </header>

        {/* Tab content */}
        {activeTab === "dashboard" && (
          <DashboardView
            students={students}
            courses={courses}
            onGoToStudents={() => setActiveTab("students")}
            onGoToClasses={() => setActiveTab("classes")}
            onAddStudent={() => { setEditing(null); setModalOpen(true); setActiveTab("students"); }}
          />
        )}
        {activeTab === "students" && (
          <StudentsView
            students={students}
            fetching={fetching}
            onEdit={(s) => { setEditing(s); setModalOpen(true); }}
            onDelete={setToDelete}
          />
        )}
        {activeTab === "classes" && (
          <ClassesView
            courses={courses}
            fetching={coursesFetching}
            onEdit={(c) => { setEditingCourse(c); setCourseModalOpen(true); }}
            onDelete={setDeletingCourse}
            onViewGrades={handleViewGrades}
          />
        )}
        {activeTab === "grades" && (
          <GradesView
            courses={courses}
            students={students}
            toast={toast}
            initCourseId={gradesCourseId}
            onGradeChanged={fetchStudents}
          />
        )}
        {activeTab === "attendance" && (
          <AttendanceView courses={courses} toast={toast} />
        )}
        {activeTab === "fees" && (
          <FeesView students={students} toast={toast} addSignal={addFeeSignal} />
        )}
        {activeTab === "analytics" && <AnalyticsView students={students} />}
        {activeTab === "settings"  && <SettingsView onLogout={handleLogout} />}
      </div>

      {/* Global overlays */}
      <StudentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleStudentSubmit}
        editing={editing}
        saving={saving}
      />
      <CourseModal
        open={courseModalOpen}
        onClose={() => setCourseModalOpen(false)}
        onSubmit={handleCourseSubmit}
        editing={editingCourse}
        saving={savingCourse}
      />
      <ConfirmDelete
        name={toDelete?.name ?? null}
        entity="Student"
        onConfirm={handleStudentDelete}
        onCancel={() => setToDelete(null)}
        deleting={deleting}
      />
      <ConfirmDelete
        name={deletingCourse?.name ?? null}
        entity="Course"
        onConfirm={handleCourseDelete}
        onCancel={() => setDeletingCourse(null)}
        deleting={deletingCourseIP}
      />
      <Toasts items={toasts} onRemove={removeToast} />
    </div>
  );
}
