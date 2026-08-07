import { createContext, useContext, useEffect, useState } from "react";

const StudentContext = createContext(null);

export function StudentProvider({ children, initialStudent = null }) {
  const [currentStudent, setCurrentStudentState] = useState(() => {
    if (initialStudent) return initialStudent;
    const saved = localStorage.getItem("mealshare_current_student");
    return saved ? JSON.parse(saved) : null;
  });

  // Keep in sync if the logged-in account's profile changes (e.g. after login/logout).
  useEffect(() => {
    if (initialStudent) setCurrentStudentState(initialStudent);
  }, [initialStudent]);

  useEffect(() => {
    if (currentStudent) {
      localStorage.setItem("mealshare_current_student", JSON.stringify(currentStudent));
    } else {
      localStorage.removeItem("mealshare_current_student");
    }
  }, [currentStudent]);

  function setCurrentStudent(student) {
    setCurrentStudentState(student);
  }

  return (
    <StudentContext.Provider value={{ currentStudent, setCurrentStudent }}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const ctx = useContext(StudentContext);
  if (!ctx) throw new Error("useStudent must be used within a StudentProvider");
  return ctx;
}
