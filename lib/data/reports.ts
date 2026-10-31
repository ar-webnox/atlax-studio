export type ReportType = "Executive" | "Financial" | "Product" | "Operations" | "Compliance";
export type ReportStatus = "Ready" | "Running" | "Scheduled" | "Failed";

export type Report = {
  id: string;
  name: string;
  type: ReportType;
  owner: string;
  schedule: "Daily" | "Weekly" | "Monthly" | "Manual";
  lastRun: string;
  status: ReportStatus;
  format: "PDF" | "CSV" | "Dashboard";
};

export const reports: Report[] = [
  { id: "r1", name: "Weekly executive summary", type: "Executive", owner: "m2", schedule: "Weekly", lastRun: "Oct 26, 2026", status: "Ready", format: "PDF" },
  { id: "r2", name: "Monthly revenue reconciliation", type: "Financial", owner: "m9", schedule: "Monthly", lastRun: "Oct 1, 2026", status: "Ready", format: "CSV" },
  { id: "r3", name: "Feature adoption by cohort", type: "Product", owner: "m7", schedule: "Weekly", lastRun: "Oct 28, 2026", status: "Running", format: "Dashboard" },
  { id: "r4", name: "Incident and uptime review", type: "Operations", owner: "m6", schedule: "Weekly", lastRun: "Oct 27, 2026", status: "Ready", format: "PDF" },
  { id: "r5", name: "Access review, Q4", type: "Compliance", owner: "m8", schedule: "Manual", lastRun: "Oct 15, 2026", status: "Failed", format: "CSV" },
  { id: "r6", name: "Daily active users digest", type: "Product", owner: "m3", schedule: "Daily", lastRun: "Oct 30, 2026", status: "Ready", format: "Dashboard" },
  { id: "r7", name: "Cost per workspace", type: "Financial", owner: "m9", schedule: "Monthly", lastRun: "Oct 1, 2026", status: "Scheduled", format: "CSV" },
  { id: "r8", name: "Support response times", type: "Operations", owner: "m2", schedule: "Daily", lastRun: "Oct 30, 2026", status: "Ready", format: "Dashboard" },
  { id: "r9", name: "Board metrics pack", type: "Executive", owner: "m1", schedule: "Monthly", lastRun: "Oct 3, 2026", status: "Ready", format: "PDF" },
];
