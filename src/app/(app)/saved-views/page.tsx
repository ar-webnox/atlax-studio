import type { Metadata } from "next";
import { SavedViewsView } from "@/features/saved-views/saved-views-view";

export const metadata: Metadata = { title: "Saved views" };

export default function Page() {
  return <SavedViewsView />;
}
