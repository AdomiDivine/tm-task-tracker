import { supabase } from "@/integrations/supabase/client";

interface NotifyAssignmentInput {
  recipientUserIds: string[];
  actorId: string;
  actorName: string;
  taskTitle: string;
  taskId: string;
  recipientEmails?: Record<string, string>; // userId -> email
}

/**
 * Creates in-app notifications for everyone added to a task and logs a
 * mock email per recipient. Skips the actor themselves.
 */
export async function notifyTaskAssignment(input: NotifyAssignmentInput) {
  const recipients = input.recipientUserIds.filter((id) => id && id !== input.actorId);
  if (recipients.length === 0) return;

  const title = `${input.actorName} added you to a task`;
  const body = `${input.taskTitle}`;

  const notifRows = recipients.map((user_id) => ({
    user_id,
    actor_id: input.actorId,
    type: "assignment",
    title,
    body,
    task_id: input.taskId,
  }));

  await supabase.from("notifications").insert(notifRows);

  // Mock email log — ready to swap for a real provider
  const emailRows = recipients.map((user_id) => ({
    recipient_email: input.recipientEmails?.[user_id] ?? "",
    recipient_user_id: user_id,
    subject: title,
    body: `${body}\n\nView in TM Work OS.`,
    task_id: input.taskId,
    status: "mock_sent",
  }));
  await supabase.from("email_log").insert(emailRows);

  // Console-side mock for visibility
  // eslint-disable-next-line no-console
  console.info("[mock-email] Sent assignment notification to:", recipients);
}
