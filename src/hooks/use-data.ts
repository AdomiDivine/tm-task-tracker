import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Project = Tables<"projects">;
export type Task = Tables<"tasks"> & { collaborator_ids?: string[] };
export type Attachment = { type: "link" | "file"; name: string; url: string; path?: string };

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    const { data } = await supabase.from("projects").select("*").order("name");
    setProjects(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProjects();
    const ch = supabase
      .channel("projects-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, fetchProjects)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchProjects]);

  const createProject = useCallback(async (p: { name: string; key: string; color: string; icon: string }) => {
    const { error } = await supabase.from("projects").insert(p);
    if (error) throw error;
  }, []);

  const updateProject = useCallback(async (id: string, p: Partial<Project>) => {
    const { error } = await supabase.from("projects").update(p).eq("id", id);
    if (error) throw error;
  }, []);

  const archiveProject = useCallback(async (id: string, archived: boolean) => {
    const { error } = await supabase.from("projects").update({ archived }).eq("id", id);
    if (error) throw error;
  }, []);

  return { projects, loading, createProject, updateProject, archiveProject, refetch: fetchProjects };
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    const [{ data: tdata }, { data: cdata }] = await Promise.all([
      supabase.from("tasks").select("*").order("created_at", { ascending: false }),
      supabase.from("task_collaborators").select("*"),
    ]);
    const merged = (tdata ?? []).map((t) => ({
      ...t,
      collaborator_ids: (cdata ?? []).filter((c) => c.task_id === t.id).map((c) => c.user_id),
    }));
    setTasks(merged);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();
    const ch = supabase
      .channel("tasks-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, fetchTasks)
      .on("postgres_changes", { event: "*", schema: "public", table: "task_collaborators" }, fetchTasks)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchTasks]);

  const updateTask = useCallback(async (taskId: string, patch: Partial<Tables<"tasks">>) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t)));
    const { error } = await supabase.from("tasks").update(patch).eq("id", taskId);
    if (error) throw error;
  }, []);

  const moveTask = useCallback(async (taskId: string, newStatus: string) => {
    await updateTask(taskId, { status: newStatus });
  }, [updateTask]);

  const createTask = useCallback(async (input: {
    title: string;
    project_id: string;
    assignee_id: string | null;
    collaborator_ids: string[];
    duration: string;
    deadline: string | null;
    blocker: string;
    attachments: Attachment[];
    created_by: string;
  }) => {
    const { collaborator_ids, attachments, deadline, ...rest } = input;
    const { data, error } = await supabase
      .from("tasks")
      .insert({ ...rest, deadline, attachments: attachments as unknown as Tables<"tasks">["attachments"] })
      .select()
      .single();
    if (error) throw error;
    const uniqueCollabs = Array.from(new Set(collaborator_ids.filter((id) => id && id !== rest.assignee_id)));
    if (data && uniqueCollabs.length > 0) {
      const { error: cErr } = await supabase.from("task_collaborators").insert(
        uniqueCollabs.map((user_id) => ({ task_id: data.id, user_id }))
      );
      if (cErr) throw cErr;
    }
    return data;
  }, []);

  const updateCollaborators = useCallback(async (taskId: string, userIds: string[]) => {
    await supabase.from("task_collaborators").delete().eq("task_id", taskId);
    if (userIds.length > 0) {
      await supabase.from("task_collaborators").insert(userIds.map((user_id) => ({ task_id: taskId, user_id })));
    }
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (error) throw error;
  }, []);

  return { tasks, loading, moveTask, updateTask, createTask, deleteTask, updateCollaborators, refetch: fetchTasks };
}

export function useMembers() {
  const [members, setMembers] = useState<(Tables<"profiles"> & { role: string })[]>([]);

  const fetchMembers = useCallback(async () => {
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("user_roles").select("*"),
    ]);
    if (profiles) {
      setMembers(profiles.map((p) => ({
        ...p,
        role: roles?.find((r) => r.user_id === p.user_id)?.role ?? "member",
      })));
    }
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const setUserRole = useCallback(async (userId: string, newRole: "admin" | "team_lead" | "member") => {
    // Replace any existing role with the new one (single-role-per-user model)
    await supabase.from("user_roles").delete().eq("user_id", userId);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
    if (error) throw error;
    await fetchMembers();
  }, [fetchMembers]);

  return { members, refetch: fetchMembers, setUserRole };
}
