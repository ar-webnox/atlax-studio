"use client";

import { useState } from "react";
import { CalendarDays, Check, ChevronDown } from "lucide-react";
import { DEFAULT_CUSTOM, MAX_ISO, MIN_ISO, longDate, rangeKeys, rangeLabels, resolveRange, type CustomRange, type RangeKey, type RangeValue } from "@/lib/range";
import { Button } from "./button";
import { Popover } from "./popover";

export { rangeKeys, rangeLabels };
export type { RangeKey, RangeValue, CustomRange };

type PresetProps = { value: RangeKey; onChange: (v: RangeKey) => void; custom?: undefined; onCustomChange?: undefined };
type CustomProps = { value: RangeValue; onChange: (v: RangeValue) => void; custom: CustomRange; onCustomChange: (c: CustomRange) => void };

export function DateRangePicker(props: PresetProps | CustomProps) {
  const { value } = props;
  const customEnabled = props.custom !== undefined;
  const [draft, setDraft] = useState<CustomRange>(props.custom ?? DEFAULT_CUSTOM);
  const invalid = draft.from > draft.to || !draft.from || !draft.to;
  const label = value === "custom" ? resolveRange("custom", props.custom).label : rangeLabels[value];
  const select = (k: RangeValue) => (props.onChange as (v: RangeValue) => void)(k);

  return (
    <Popover
      label="Date range" role="dialog" panelClassName="w-72 p-1.5"
      trigger={(p) => (
        <button type="button" {...p} className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink transition-colors hover:border-line-strong hover:bg-raised">
          <CalendarDays className="size-4 text-faint" aria-hidden />
          {label}
          <ChevronDown className="size-4 text-faint" aria-hidden />
        </button>
      )}
    >
      {(close) => (
        <div role="radiogroup" aria-label="Date range presets">
          {rangeKeys.map((k) => (
            <button key={k} type="button" role="radio" aria-checked={k === value} onClick={() => { select(k); close(); }}
              className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-[13px] text-ink outline-none hover:bg-raised focus-visible:bg-raised">
              {rangeLabels[k]}
              {k === value && <Check className="size-4 text-gold" aria-hidden />}
            </button>
          ))}
          {customEnabled && (
            <div className="mt-1 border-t border-line p-2.5">
              <p className="mb-2 flex items-center justify-between text-[13px] font-medium text-ink">Custom period {value === "custom" && <Check className="size-4 text-gold" aria-hidden />}</p>
              <div className="grid grid-cols-2 gap-2">
                {(["from", "to"] as const).map((k) => (
                  <label key={k} className="text-xs text-mute">
                    {k === "from" ? "From" : "To"}
                    <input type="date" value={draft[k]} min={MIN_ISO} max={MAX_ISO} onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))}
                      className="mt-1 h-9 w-full rounded-lg border border-line bg-surface px-2 text-[13px] text-ink focus-visible:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/30" />
                  </label>
                ))}
              </div>
              {invalid && <p role="alert" className="mt-2 text-xs text-neg">Choose a start date that is on or before the end date.</p>}
              <Button variant="primary" size="sm" className="mt-3 w-full" disabled={invalid}
                onClick={() => { props.onCustomChange!(draft); select("custom"); close(); }}>Apply period</Button>
            </div>
          )}
          <p className="px-2.5 pb-1 pt-2 text-xs text-faint">Data runs {longDate(MIN_ISO)} to {longDate(MAX_ISO)}</p>
        </div>
      )}
    </Popover>
  );
}
