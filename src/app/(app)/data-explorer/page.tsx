import type { Metadata } from "next";
import { DataExplorerView } from "@/features/data-explorer/data-explorer-view";

export const metadata: Metadata = { title: "Data explorer" };

export default function Page() {
  return <DataExplorerView />;
}
