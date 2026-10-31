import type { Role } from "../rbac";

export type RoleName = Role;
export type MemberStatus = "Active" | "Away" | "Invited" | "Suspended";

export type Member = {
  id: string;
  name: string;
  email: string;
  role: RoleName;
  team: string;
  status: MemberStatus;
  lastActive: string;
  location: string;
  title?: string;
};

export const members: Member[] = [
  { id: "m1", name: "Amara Okafor", email: "amara@meridianlabs.io", role: "Owner", team: "Leadership", status: "Active", lastActive: "Just now", location: "Lagos" },
  { id: "m2", name: "Daniel Reyes", email: "daniel@meridianlabs.io", role: "Admin", team: "Operations", status: "Active", lastActive: "6 min ago", location: "Mexico City" },
  { id: "m3", name: "Priya Nair", email: "priya@meridianlabs.io", role: "Analyst", team: "Data", status: "Active", lastActive: "14 min ago", location: "Bengaluru" },
  { id: "m4", name: "Lukas Brandt", email: "lukas@meridianlabs.io", role: "Manager", team: "Platform", status: "Away", lastActive: "1 hr ago", location: "Berlin" },
  { id: "m5", name: "Sofia Marchetti", email: "sofia@meridianlabs.io", role: "Analyst", team: "Product", status: "Active", lastActive: "22 min ago", location: "Milan" },
  { id: "m6", name: "Kenji Watanabe", email: "kenji@meridianlabs.io", role: "Analyst", team: "Platform", status: "Active", lastActive: "3 min ago", location: "Osaka" },
  { id: "m7", name: "Hannah Lindqvist", email: "hannah@meridianlabs.io", role: "Manager", team: "Growth", status: "Active", lastActive: "40 min ago", location: "Stockholm" },
  { id: "m8", name: "Omar Haddad", email: "omar@meridianlabs.io", role: "Admin", team: "Security", status: "Away", lastActive: "3 hr ago", location: "Dubai" },
  { id: "m9", name: "Chloe Bennett", email: "chloe@meridianlabs.io", role: "Viewer", team: "Finance", status: "Active", lastActive: "Yesterday", location: "London" },
  { id: "m10", name: "Tariq Hussain", email: "tariq@meridianlabs.io", role: "Analyst", team: "Data", status: "Invited", lastActive: "Never", location: "Lahore" },
  { id: "m11", name: "Elena Petrova", email: "elena@meridianlabs.io", role: "Analyst", team: "Product", status: "Active", lastActive: "2 hr ago", location: "Tallinn" },
  { id: "m12", name: "Marcus Webb", email: "marcus@meridianlabs.io", role: "Viewer", team: "Growth", status: "Suspended", lastActive: "12 days ago", location: "Austin" },
];

export const currentUser = members[0];

export function memberById(id: string) {
  return members.find((m) => m.id === id) ?? members[0];
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export const workspaces = [
  { id: "w1", name: "Meridian Labs", plan: "Enterprise", members: 12 },
  { id: "w2", name: "Halden Group", plan: "Business", members: 8 },
  { id: "w3", name: "Orbit Retail", plan: "Business", members: 5 },
];
