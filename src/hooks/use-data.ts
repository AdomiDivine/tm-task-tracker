import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Project = Tables<"projects">;
type Task = Tables<"tasks">;

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("projects").select("*").order("name").then(({ data }) => {
      setProjects(data ?? []);
      setLoading(false);
    });
  }, []);

  return { projects, loading };
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });
    setTasks(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();

    // Real-time subscription
    const channel = supabase
      .channel("tasks-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => {
        fetchTasks();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchTasks]);

  const moveTask = useCallback(async (taskId: string, newStatus: string) => {
    // Optimistic update
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId);
  }, []);

  const createTask = useCallback(async (task: {
    title: string;
    project_id: string;
    assignee_id: string | null;
    duration: string;
    blocker: string;
    created_by: string;
  }) => {
    const { error } = await supabase.from("tasks").insert(task);
    if (error) throw error;
  }, []);

  return { tasks, loading, moveTask, createTask, refetch: fetchTasks };
}

export function useMembers() {
  const [members, setMembers] = useState<(Tables<"profiles"> & { role: string })[]>([]);

  useEffect(() => {
    async function fetch() {
      const { data: profiles } = await supabase.from("profiles").select("*");
      const { data: roles } = await supabase.from("user_roles").select("*");
      if (profiles) {
        const merged = profiles.map((p) => ({
          ...p,
          role: roles?.find((r) => r.user_id === p.user_id)?.role ?? "member",
        }));
        setMembers(merged);
      }
    }
    fetch();
  }, []);

  return { members };
}
