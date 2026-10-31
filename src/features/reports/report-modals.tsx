"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { buildReport, fileBase, reportToPdfLines } from "@/lib/reports-build";
import { downloadCsv } from "@/lib/csv";
import { downloadPdf } from "@/lib/pdf";
import { emailList } from "@/lib/validators";
import { logActivity } from "@/lib/state/activity";
import { updateReport, type Frequency, type Report } from "@/lib/state/reports";
import { toast } from "@/lib/state/toast";
import { Gate } from "@/components/rbac";
import { cn } from "@/lib/cn";

export function exportReport(report: Report, kind: "csv" | "pdf") {
  const b = buildReport(report);
  if (kind === "csv") downloadCsv(`${fileBase(report.name)}.csv`, b.headers, b.rows);
  else downloadPdf(`${fileBase(report.name)}.pdf`, b.title, reportToPdfLines(b));
  logActivity("Exported report", `${report.name} (${kind.toUpperCase()})`, "Reports");
  toast.success(`${kind.toUpperCase()} downloaded`, `${report.name} was generated from demo data.`);
}

export function PreviewModal({ report, onClose }: { report: Report | null; onClose: () => void }) {
  const b = report ? buildReport(report) : null;
  return (
    <Modal open={!!report} onClose={onClose} title={report?.name ?? ""} description={b?.subtitle} size="lg"
      footer={report && (<>
        <Gate permission="reports:export"><Button onClick={() => exportReport(report, "csv")}><Download className="size-4" /> CSV</Button></Gate>
        <Gate permission="reports:export"><Button onClick={() => exportReport(report, "pdf")}><Download className="size-4" /> PDF</Button></Gate>
        <Button variant="primary" onClick={onClose}>Close</Button></>)}>
      {b && (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {b.kpis.map((k) => (
              <div key={k.label} className="rounded-lg border border-line bg-raised p-3">
                <p className="text-xs text-mute">{k.label}</p>
                <p className="mt-1 font-display text-lg font-semibold tabular text-ink">{k.value}</p>
                {k.delta !== undefined && <p className={cn("text-xs tabular", k.delta >= 0 ? "text-pos" : "text-neg")}>{k.delta >= 0 ? "+" : ""}{k.delta}% vs previous</p>}
              </div>
            ))}
          </div>
          <div className="scroll-thin max-h-72 overflow-auto rounded-lg border border-line">
            <table className="w-full text-left text-[13px]">
              <caption className="sr-only">Report data preview</caption>
              <thead className="sticky top-0 bg-raised text-mute"><tr>{b.headers.map((h) => <th key={h} scope="col" className="whitespace-nowrap px-3 py-2 font-medium">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-line">
                {b.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className="whitespace-nowrap px-3 py-2 tabular text-ink">{typeof c === "number" ? c.toLocaleString("en-US") : c}</td>)}</tr>)}
              </tbody>
            </table>
          </div>
          {b.notes.map((n) => <p key={n} className="text-xs text-faint">{n}</p>)}
          <Badge tone="gold">Demo data</Badge>
        </div>
      )}
    </Modal>
  );
}

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function ScheduleModal({ report, onClose }: { report: Report | null; onClose: () => void }) {
  const [frequency, setFrequency] = useState<Frequency>("Weekly");
  const [day, setDay] = useState("Monday");
  const [time, setTime] = useState("07:30");
  const [recipients, setRecipients] = useState("");
  const [format, setFormat] = useState<"PDF" | "CSV">("PDF");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!report) return;
    const s = report.schedule;
    setTouched(false);
    setFrequency(s?.frequency ?? "Weekly"); setDay(s?.day ?? "Monday"); setTime(s?.time ?? "07:30"); setRecipients(s?.recipients.join(", ") ?? ""); setFormat(s?.format ?? "PDF");
  }, [report]);

  const err = emailList(recipients);
  const changeFreq = (f: Frequency) => { setFrequency(f); setDay(f === "Daily" ? "Every day" : f === "Weekly" ? "Monday" : "1"); };

  const save = () => {
    setTouched(true);
    if (err || !report) return;
    updateReport(report.id, { schedule: { frequency, day, time, format, recipients: recipients.split(/[,\n;]/).map((s) => s.trim()).filter(Boolean) }, status: report.status === "Failed" ? "Failed" : "Scheduled" });
    logActivity("Scheduled report", `${report.name}: ${frequency.toLowerCase()} at ${time}`, "Reports");
    toast.success("Schedule saved", "Demo only: no email is actually sent in this build.");
    onClose();
  };
  const stop = () => {
    if (!report) return;
    updateReport(report.id, { schedule: null, status: report.status === "Scheduled" ? "Ready" : report.status });
    toast.info("Schedule removed");
    onClose();
  };

  return (
    <Modal open={!!report} onClose={onClose} title="Schedule report" description={report?.name} size="md"
      footer={<>{report?.schedule && <Button variant="danger" className="mr-auto" onClick={stop}>Remove schedule</Button>}<Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save}>Save schedule</Button></>}>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Repeats">{(id) => <Select id={id} value={frequency} onChange={(e) => changeFreq(e.target.value as Frequency)}>{["Daily", "Weekly", "Monthly"].map((f) => <option key={f}>{f}</option>)}</Select>}</Field>
          <Field label={frequency === "Monthly" ? "Day of month" : "Day"}>
            {(id) => frequency === "Daily" ? <Select id={id} disabled value="Every day"><option>Every day</option></Select>
              : frequency === "Weekly" ? <Select id={id} value={day} onChange={(e) => setDay(e.target.value)}>{WEEKDAYS.map((d) => <option key={d}>{d}</option>)}</Select>
              : <Select id={id} value={day} onChange={(e) => setDay(e.target.value)}>{Array.from({ length: 28 }, (_, i) => String(i + 1)).map((d) => <option key={d}>{d}</option>)}</Select>}
          </Field>
          <Field label="Time (UTC)">{(id) => <input id={id} type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink focus-visible:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/30" />}</Field>
        </div>
        <Field label="Recipients" hint="Separate email addresses with commas.">
          {(id) => (<>
            <textarea id={id} rows={2} value={recipients} onChange={(e) => setRecipients(e.target.value)} onBlur={() => setTouched(true)} placeholder="finance@company.com, ops@company.com" aria-invalid={touched && !!err} aria-describedby={`${id}-e`}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-faint focus-visible:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/30" />
            {touched && err && <p id={`${id}-e`} role="alert" className="text-xs text-neg">{err}</p>}
          </>)}
        </Field>
        <Field label="Attachment format">{(id) => <Select id={id} value={format} onChange={(e) => setFormat(e.target.value as "PDF" | "CSV")}><option>PDF</option><option>CSV</option></Select>}</Field>
      </div>
    </Modal>
  );
}
