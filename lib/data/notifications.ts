export type NotificationKind = "alert" | "mention" | "report" | "system" | "team";

export type Notification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  time: string;
  read: boolean;
  href: string;
};

export const initialNotifications: Notification[] = [
  { id: "n1", kind: "alert", title: "API latency above threshold", body: "p95 latency on the ingest service reached 412 ms for 6 minutes.", time: "4 min ago", read: false, href: "/monitoring" },
  { id: "n2", kind: "mention", title: "Priya Nair mentioned you", body: "“Can you confirm the Q4 target before we publish the forecast?”", time: "18 min ago", read: false, href: "/projects" },
  { id: "n3", kind: "report", title: "Weekly executive summary is ready", body: "Generated from 14 sources. 12 pages.", time: "1 hr ago", read: false, href: "/reports" },
  { id: "n4", kind: "team", title: "Tariq Hussain was invited", body: "Daniel Reyes invited Tariq as an Engineer on the Data team.", time: "3 hr ago", read: true, href: "/team" },
  { id: "n5", kind: "system", title: "Scheduled maintenance on Nov 3", body: "Read-only mode from 02:00 to 02:30 UTC while the warehouse is upgraded.", time: "Yesterday", read: true, href: "/settings" },
  { id: "n6", kind: "alert", title: "Access review report failed", body: "The Q4 export stopped at the identity provider step. Retry from Reports.", time: "Yesterday", read: true, href: "/reports" },
  { id: "n7", kind: "mention", title: "Sofia Marchetti commented on Self-serve onboarding", body: "“Updated the empty states, take a look when you have a minute.”", time: "2 days ago", read: true, href: "/projects" },
  { id: "n8", kind: "system", title: "Snowflake sync completed", body: "4.2 million rows imported in 11 minutes.", time: "2 days ago", read: true, href: "/integrations" },
];
