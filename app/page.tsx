"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function Home() {
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    console.log("🔥 USE EFFECT RUNNING");

    axios
      .get("http://localhost:5000/api/students")
      .then((res) => {
        console.log("DATA:", res.data);
        setStudents(res.data);
      })
      .catch((err) => console.log(err));
  }, []);

  return (
    <main className="p-10">
      <h1 className="text-3xl font-bold mb-4">Student Dashboard</h1>

      {students.length === 0 && <p>No data yet...</p>}

      {students.map((student) => (
        <div key={student._id} className="border p-3 mb-2">
          <p>Name: {student.name}</p>
          <p>Email: {student.email}</p>
          <p>Age: {student.age}</p>
        </div>
      ))}
    </main>
  );
}