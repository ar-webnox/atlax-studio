import type { Metadata } from "next";
import { ActivityView } from "@/features/activity/activity-view";

export const metadata: Metadata = { title: "Activity logs" };

export default function Page() {
  return <ActivityView />;
}
