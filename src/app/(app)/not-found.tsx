import Link from "next/link";
import { Compass } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonStyles } from "@/components/ui/button";

export default function NotFound() {
  return (
    <EmptyState
      icon={Compass}
      title="We couldn't find that page"
      description="The link may be out of date or the page may have moved. Head back to the overview to keep going."
      action={<Link href="/overview" className={buttonStyles({ variant: "primary" })}>Go to Overview</Link>}
      className="py-24"
    />
  );
}
