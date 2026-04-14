export type UserRole = "admin" | "member";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  sbu: string;
}

export interface Task {
  id: string;
  title: string;
  assigneeId: string;
  project: ProjectKey;
  status: "pending" | "in-progress" | "done";
  duration: string;
  blocker: string;
  createdAt: string;
}

export type ProjectKey = "taj-bank" | "cosgrove" | "nis" | "takeout-media" | "famly";

export interface Project {
  key: ProjectKey;
  name: string;
  color: string;
  icon: string;
}

export const projects: Project[] = [
  { key: "taj-bank", name: "Taj Bank", color: "oklch(0.65 0.18 250)", icon: "🏦" },
  { key: "cosgrove", name: "Cosgrove", color: "oklch(0.7 0.15 160)", icon: "🏗️" },
  { key: "nis", name: "NIS", color: "oklch(0.75 0.15 80)", icon: "🛡️" },
  { key: "takeout-media", name: "Takeout Media", color: "oklch(0.6 0.2 300)", icon: "📱" },
  { key: "famly", name: "Famly", color: "oklch(0.65 0.2 30)", icon: "👨‍👩‍👧" },
];

export const users: User[] = [
  { id: "u1", name: "Divine Okafor", role: "admin", avatar: "DO", sbu: "Takeout Media" },
  { id: "u2", name: "Adaeze Nwosu", role: "member", avatar: "AN", sbu: "Takeout Media" },
  { id: "u3", name: "Chidi Eze", role: "member", avatar: "CE", sbu: "Takeout Media" },
  { id: "u4", name: "Funmi Adeyemi", role: "member", avatar: "FA", sbu: "Takeout Media" },
  { id: "u5", name: "Bola Akinwale", role: "member", avatar: "BA", sbu: "Takeout Media" },
];

export const tasks: Task[] = [
  { id: "t1", title: "Design brand guidelines document", assigneeId: "u2", project: "taj-bank", status: "pending", duration: "3 days", blocker: "", createdAt: "2026-04-10" },
  { id: "t2", title: "Create social media content calendar", assigneeId: "u3", project: "taj-bank", status: "in-progress", duration: "2 days", blocker: "Waiting for client brand assets", createdAt: "2026-04-08" },
  { id: "t3", title: "Develop landing page mockup", assigneeId: "u4", project: "cosgrove", status: "pending", duration: "5 days", blocker: "", createdAt: "2026-04-11" },
  { id: "t4", title: "Video production for launch campaign", assigneeId: "u2", project: "cosgrove", status: "in-progress", duration: "7 days", blocker: "Talent not confirmed yet", createdAt: "2026-04-06" },
  { id: "t5", title: "SEO audit and keyword research", assigneeId: "u5", project: "nis", status: "done", duration: "2 days", blocker: "", createdAt: "2026-04-01" },
  { id: "t6", title: "Setup analytics dashboard", assigneeId: "u3", project: "nis", status: "pending", duration: "1 day", blocker: "", createdAt: "2026-04-12" },
  { id: "t7", title: "Rebrand presentation deck", assigneeId: "u4", project: "takeout-media", status: "done", duration: "3 days", blocker: "", createdAt: "2026-04-02" },
  { id: "t8", title: "Internal team photo shoot", assigneeId: "u5", project: "takeout-media", status: "in-progress", duration: "1 day", blocker: "", createdAt: "2026-04-13" },
  { id: "t9", title: "Email marketing automation setup", assigneeId: "u2", project: "taj-bank", status: "done", duration: "4 days", blocker: "", createdAt: "2026-04-03" },
  { id: "t10", title: "Client onboarding flow UX design", assigneeId: "u3", project: "famly", status: "pending", duration: "4 days", blocker: "Pending UX research findings", createdAt: "2026-04-09" },
  { id: "t11", title: "Mobile app wireframes", assigneeId: "u4", project: "famly", status: "in-progress", duration: "5 days", blocker: "", createdAt: "2026-04-07" },
  { id: "t12", title: "Quarterly performance report", assigneeId: "u1", project: "takeout-media", status: "pending", duration: "2 days", blocker: "Need finalized Q1 numbers from finance", createdAt: "2026-04-14" },
  { id: "t13", title: "Influencer partnership outreach", assigneeId: "u5", project: "cosgrove", status: "pending", duration: "3 days", blocker: "", createdAt: "2026-04-11" },
  { id: "t14", title: "Website performance optimization", assigneeId: "u3", project: "nis", status: "done", duration: "2 days", blocker: "", createdAt: "2026-04-04" },
  { id: "t15", title: "Product photography session", assigneeId: "u2", project: "famly", status: "done", duration: "1 day", blocker: "", createdAt: "2026-04-05" },
];

export function getProjectName(key: ProjectKey): string {
  return projects.find(p => p.key === key)?.name ?? key;
}

export function getUserName(id: string): string {
  return users.find(u => u.id === id)?.name ?? "Unknown";
}

export function getUserById(id: string): User | undefined {
  return users.find(u => u.id === id);
}

export function getTasksByProject(projectKey: ProjectKey): Task[] {
  return tasks.filter(t => t.project === projectKey);
}

export function getTasksByUser(userId: string): Task[] {
  return tasks.filter(t => t.assigneeId === userId);
}

export function getUserProgress(userId: string): number {
  const userTasks = getTasksByUser(userId);
  if (userTasks.length === 0) return 0;
  const done = userTasks.filter(t => t.status === "done").length;
  return Math.round((done / userTasks.length) * 100);
}

export function getUserBlockers(userId: string): Task[] {
  return getTasksByUser(userId).filter(t => t.blocker.length > 0);
}
