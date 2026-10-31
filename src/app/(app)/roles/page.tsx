import type { Metadata } from "next";
import { RolesView } from "@/features/roles/roles-view";

export const metadata: Metadata = { title: "Roles & permissions" };

export default function Page() {
  return <RolesView />;
}
