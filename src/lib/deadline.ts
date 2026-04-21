// Africa/Lagos (WAT) is fixed UTC+1, no DST.
// Convert a "YYYY-MM-DD" date string to the ISO timestamp representing
// 18:00 (6:00 PM) Africa/Lagos that day.
export function dateStringToWAT6PM(dateStr: string): string {
  // 18:00 WAT = 17:00 UTC
  return new Date(`${dateStr}T17:00:00.000Z`).toISOString();
}

// Convert an ISO timestamp back to a "YYYY-MM-DD" string in WAT for the date picker.
export function isoToWATDateString(iso: string): string {
  const d = new Date(iso);
  // Shift to WAT (+1) and slice the date portion.
  const wat = new Date(d.getTime() + 60 * 60 * 1000);
  return wat.toISOString().slice(0, 10);
}

export function isOverdueWAT(deadlineIso: string | null, status: string): boolean {
  if (!deadlineIso || status === "done") return false;
  // Past 18:01 WAT on the deadline day.
  const deadline = new Date(deadlineIso).getTime();
  return Date.now() > deadline + 60 * 1000; // +1 minute grace = 18:01
}
