import type { Metadata } from "next";
import { InternalAnalyticsView } from "@/features/internal-analytics/internal-analytics-view";

export const metadata: Metadata = { title: "Internal analytics" };

export default function Page() {
  return <InternalAnalyticsView />;
}
