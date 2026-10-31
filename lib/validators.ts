export type Rule<T = string> = (value: T) => string | null;

export const required = (label: string): Rule => (v) => (v.trim() ? null : `${label} is required.`);
export const minLength = (label: string, n: number): Rule => (v) => (v.trim().length >= n ? null : `${label} must be at least ${n} characters.`);
export const maxLength = (label: string, n: number): Rule => (v) => (v.trim().length <= n ? null : `${label} must be ${n} characters or fewer.`);
export const email: Rule = (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? null : "Enter a valid email address, like name@company.com.");
export const slug: Rule = (v) => (/^[a-z0-9]+(-[a-z0-9]+)*$/.test(v) ? null : "Use lowercase letters, numbers and single hyphens.");

export function validate(value: string, ...rules: Rule[]): string | null {
  for (const r of rules) {
    const e = r(value);
    if (e) return e;
  }
  return null;
}

/** Validates a comma or newline separated list of emails. Returns the error or null. */
export function emailList(v: string): string | null {
  const parts = v.split(/[,\n;]/).map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return "Add at least one recipient.";
  const bad = parts.find((p) => email(p));
  return bad ? `“${bad}” is not a valid email address.` : null;
}
