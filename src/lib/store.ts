import { useState, useCallback } from "react";
import type { Task, ProjectKey, UserRole } from "./data";
import { tasks as initialTasks } from "./data";

// Simple state hooks for the app

export function useTaskStore() {
  const [taskList, setTaskList] = useState<Task[]>(initialTasks);

  const moveTask = useCallback((taskId: string, newStatus: Task["status"]) => {
    setTaskList(prev =>
      prev.map(t => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  }, []);

  const addTask = useCallback((task: Task) => {
    setTaskList(prev => [...prev, task]);
  }, []);

  return { taskList, moveTask, addTask };
}

export function useAppState() {
  const [currentUser] = useState("u1"); // Default admin
  const [currentRole] = useState<UserRole>("admin");
  const [selectedProject, setSelectedProject] = useState<ProjectKey | "all">("all");

  return { currentUser, currentRole, selectedProject, setSelectedProject };
}
