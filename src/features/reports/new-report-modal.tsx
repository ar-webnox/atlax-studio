"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { METRICS, type MetricKey } from "@/lib/data/metrics";
import { rangeKeys, rangeLabels, type RangeKey } from "@/lib/range";
import { createReport, REPORT_TYPES, type Report, type ReportType, type Template } from "@/lib/state/reports";
import { toast } from "@/lib/state/toast";
import { maxLength, minLength, required, validate } from "@/lib/validators";

export function NewReportModal({ open, onClose, template }: { open: boolean; onClose: () => void; template?: Template | null }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<ReportType>("Executive");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState<Report["format"]>("PDF");
  const [range, setRange] = useState<RangeKey>("30d");
  const [metrics, setMetrics] = useState<MetricKey[]>(["revenue"]);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTouched(false);
    setName(template?.name ?? "");
    setType(template?.type ?? "Executive");
    setDescription(template?.description ?? "");
    setFormat(template?.format ?? "PDF");
    setRange(template?.range ?? "30d");
    setMetrics(template?.metrics.length ? template.metrics : ["revenue"]);
  }, [open, template]);

  const nameErr = validate(name, required("Report name"), minLength("Report name", 3), maxLength("Report name", 80));
  const metricErr = type !== "Compliance" && metrics.length === 0 ? "Choose at least one metric." : null;

  const submit = () => {
    setTouched(true);
    if (nameErr || metricErr) return;
    const r = createReport({ name, type, description, format, range, metrics: type === "Compliance" ? [] : metrics });
    toast.success(`Created “${r.name}”`, "It's saved as a draft. Preview it, run it or schedule it from the list.");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={template ? `New report from “${template.name}”` : "Create a report"} description="Choose what to include and how it should be delivered." size="lg"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={submit}>Create report</Button></>}>
      <div className="space-y-4">
        <Field label="Report name">
          {(id) => (<>
            <Input id={id} value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched(true)} placeholder="e.g. Quarterly growth review" autoFocus aria-invalid={touched && !!nameErr} aria-describedby={`${id}-e`} />
            {touched && nameErr && <p id={`${id}-e`} role="alert" className="text-xs text-neg">{nameErr}</p>}
          </>)}
        </Field>
        <Field label="Description (optional)">{(id) => <Input id={id} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this report for?" />}</Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Type">{(id) => <Select id={id} value={type} onChange={(e) => setType(e.target.value as ReportType)}>{REPORT_TYPES.map((t) => <option key={t}>{t}</option>)}</Select>}</Field>
          <Field label="Period">{(id) => <Select id={id} value={range} onChange={(e) => setRange(e.target.value as RangeKey)}>{rangeKeys.map((k) => <option key={k} value={k}>{rangeLabels[k]}</option>)}</Select>}</Field>
          <Field label="Format">{(id) => <Select id={id} value={format} onChange={(e) => setFormat(e.target.value as Report["format"])}>{["PDF", "CSV", "Dashboard"].map((t) => <option key={t}>{t}</option>)}</Select>}</Field>
        </div>
        {type === "Compliance" ? (
          <p className="rounded-lg border border-line bg-raised px-3 py-2.5 text-[13px] text-mute">Compliance reports list every member with their role, team and status, so no metrics are needed.</p>
        ) : (
          <fieldset>
            <legend className="mb-2 text-[13px] font-medium text-ink">Metrics</legend>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(METRICS) as MetricKey[]).map((m) => {
                const on = metrics.includes(m);
                return (
                  <label key={m} className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-[13px] font-medium ${on ? "border-gold/40 bg-gold-soft text-gold-ink" : "border-line text-mute hover:text-ink"}`}>
                    <input type="checkbox" className="sr-only" checked={on} onChange={() => setMetrics(on ? metrics.filter((x) => x !== m) : [...metrics, m])} />
                    {METRICS[m].label}
                  </label>
                );
              })}
            </div>
            {touched && metricErr && <p role="alert" className="mt-2 text-xs text-neg">{metricErr}</p>}
          </fieldset>
        )}
      </div>
    </Modal>
  );
}
