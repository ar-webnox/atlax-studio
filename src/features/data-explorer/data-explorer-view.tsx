"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { accountStats } from "@/lib/data/accounts";
import { AccountsTable } from "./accounts-table";
import { QueryBuilder } from "./query-builder";

type Tab = "browse" | "query";

export function DataExplorerView() {
  const [tab, setTab] = useState<Tab>("browse");
  const s = accountStats();
  return (
    <>
      <PageHeader title="Data explorer" description={`Search, filter and export ${s.total} demo customer accounts or group them with the query builder. $${s.mrr.toLocaleString("en-US")} MRR across ${s.active} active accounts.`}
        actions={<Badge tone="gold">Demo dataset</Badge>} />
      <Tabs<Tab> label="Data explorer modes" value={tab} onChange={setTab} options={[{ value: "browse", label: "Browse data" }, { value: "query", label: "Query builder" }]} />
      <div className="mt-4">{tab === "browse" ? <AccountsTable /> : <QueryBuilder />}</div>
    </>
  );
}
