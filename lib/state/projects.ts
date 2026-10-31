"use client";

import { createStore, uid } from "../store";
import { projects as seed, type Health, type Project, type ProjectStage } from "../data/projects";
import { logActivity } from "./activity";
import { currentMember } from "./app";

export const projectsStore = createStore<Project[]>("projects", seed);

export function addProject(input: { name: string; summary: string; stage: ProjectStage; priority: Project["priority"]; due: string }) {
  const p: Project = {
    id: uid("p"), code: `ATL-${200 + projectsStore.get().length}`, name: input.name.trim(), summary: input.summary.trim() || "No description yet.",
    stage: input.stage, progress: input.stage === "Shipped" ? 100 : 0, due: input.due, priority: input.priority, health: "On track",
    owner: currentMember().id, team: [currentMember().id], tasks: { done: 0, total: 0 },
  };
  projectsStore.set((x) => [p, ...x]);
  logActivity("Created project", p.name, "Projects");
  return p;
}
export function updateProject(id: string, patch: Partial<Project>) {
  projectsStore.set((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
}
export function moveProject(id: string, stage: ProjectStage) {
  const p = projectsStore.get().find((x) => x.id === id);
  projectsStore.set((all) => all.map((x) => (x.id === id ? { ...x, stage, progress: stage === "Shipped" ? 100 : x.progress } : x)));
  if (p) logActivity("Moved project", `${p.name} to ${stage}`, "Projects");
}
export function setHealth(id: string, health: Health) {
  updateProject(id, { health });
}
export function deleteProject(id: string) {
  const p = projectsStore.get().find((x) => x.id === id);
  projectsStore.set((all) => all.filter((x) => x.id !== id));
  if (p) logActivity("Deleted project", p.name, "Projects", "Notice");
}
