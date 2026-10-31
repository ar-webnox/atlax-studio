import { downloadBlob } from "./csv";

/** Minimal dependency-free PDF writer: Helvetica text, A4, automatic pagination. */
export function buildPdf(title: string, lines: string[]): Uint8Array {
  const enc = new TextEncoder();
  const W = 595, H = 842, M = 56, LEAD = 16, perPage = Math.floor((H - M * 2) / LEAD);
  const clean = (s: string) => s.replace(/[^\x20-\x7E]/g, (c) => ({ "–": "-", "—": "-", "·": "-", "’": "'", "“": '"', "”": '"', "−": "-" } as Record<string, string>)[c] ?? "?").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const wrapped: { t: string; size: number }[] = [{ t: title, size: 18 }, { t: "", size: 11 }];
  for (const l of lines) {
    if (l.length <= 86) wrapped.push({ t: l, size: 11 });
    else for (let i = 0; i < l.length; i += 86) wrapped.push({ t: l.slice(i, i + 86), size: 11 });
  }
  const pages: { t: string; size: number }[][] = [];
  for (let i = 0; i < wrapped.length; i += perPage) pages.push(wrapped.slice(i, i + perPage));

  const objs: string[] = [];
  const kids: number[] = [];
  objs[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objs[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  pages.forEach((pg, i) => {
    const pageId = 4 + i * 2, contentId = 5 + i * 2;
    kids.push(pageId);
    const body = pg.map((ln, j) => `BT /F1 ${ln.size} Tf ${M} ${H - M - j * LEAD} Td (${clean(ln.t)}) Tj ET`).join("\n");
    objs[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`;
    objs[contentId] = `<< /Length ${enc.encode(body).length} >>\nstream\n${body}\nendstream`;
  });
  objs[2] = `<< /Type /Pages /Kids [${kids.map((k) => `${k} 0 R`).join(" ")}] /Count ${kids.length} >>`;

  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (let i = 1; i < objs.length; i++) {
    offsets[i] = enc.encode(out).length;
    out += `${i} 0 obj\n${objs[i]}\nendobj\n`;
  }
  const xref = enc.encode(out).length;
  out += `xref\n0 ${objs.length}\n0000000000 65535 f \n` + offsets.slice(1).map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  out += `trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return enc.encode(out);
}

export function downloadPdf(filename: string, title: string, lines: string[]) {
  downloadBlob(filename, buildPdf(title, lines) as BlobPart, "application/pdf");
}
