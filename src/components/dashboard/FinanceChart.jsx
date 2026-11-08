import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { brl } from "@/lib/format";

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 shadow-lg">
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-xs flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="capitalize text-muted-foreground">{entry.dataKey}</span>
          <span className="font-semibold ml-auto">{brl(entry.value)}</span>
        </p>
      ))}
    </div>
  );
}

export default function FinanceChart({ data = [] }) {
  return (
    <div className="h-[240px] -ml-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.28} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="hsl(var(--border))" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis tickLine={false} axisLine={false} width={54} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
          <Tooltip content={<ChartTooltip />} />
          <Area type="monotone" dataKey="receita" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#rev)" />
          <Area type="monotone" dataKey="despesa" stroke="hsl(var(--chart-4))" strokeWidth={2} strokeDasharray="4 4" fill="transparent" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
