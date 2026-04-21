"use client";

import { useState, useEffect } from "react";

export default function Home() {
  // ✅ hooks MUST be inside the function
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [students, setStudents] = useState([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = async (e: any) => {
  e.preventDefault();

  if (editingId) {
    // UPDATE
    await fetch(`http://localhost:5000/api/students/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, age }),
    });

    setEditingId(null);
  } else {
    // CREATE
    await fetch("http://localhost:5000/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, age }),
    });
  }

  setName("");
  setEmail("");
  setAge("");
  location.reload();
};

  useEffect(() => {
    fetch("http://localhost:5000/api/students")
      .then((res) => res.json())
      .then((data) => setStudents(data));
  }, []);

  return (
    <main className="p-10">
      <h1 className="text-3xl font-bold mb-4">Student Dashboard</h1>

      {/* FORM */}
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 mr-2"
        />

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 mr-2"
        />

        <input
          placeholder="Age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className="border p-2 mr-2"
        />

        <button className="bg-blue-500 text-white px-4 py-2">
          Add Student
        </button>
      </form>

      {/* LIST */}
     {students.map((student: any) => (
  <div key={student._id} className="border p-3 mb-2">
    <p>Name: {student.name}</p>
    <p>Email: {student.email}</p>
    <p>Age: {student.age}</p>

    <button
      onClick={async () => {
        await fetch(`http://localhost:5000/api/students/${student._id}`, {
          method: "DELETE",
        });

        location.reload();
      }}
      className="bg-red-500 text-white px-3 py-1 mt-2"
    >
      Delete
    </button>
    <button
  onClick={() => {
    setName(student.name);
    setEmail(student.email);
    setAge(student.age);
    setEditingId(student._id);
  }}
  className="bg-yellow-500 text-white px-3 py-1 mt-2 ml-2"
>
  Edit
    </button>
  </div>
))}
    </main>
  );
}