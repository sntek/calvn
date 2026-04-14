"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export interface ChartSeries {
  key: string;
  name: string;
  color?: string;
  yAxis?: "left" | "right";
}

export interface ChartSpec {
  type: "bar" | "line" | "pie";
  title?: string;
  data: Record<string, string | number>[];
  xKey: string;
  series: ChartSeries[];
}

const DEFAULT_COLORS = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#a855f7", // purple
  "#06b6d4", // cyan
];

function parseChartSpec(raw: string): ChartSpec | null {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.type || !parsed.data || !parsed.xKey || !parsed.series) return null;
    return parsed as ChartSpec;
  } catch {
    return null;
  }
}

interface Props {
  raw: string;
}

export function ChartRenderer({ raw }: Props) {
  const spec = parseChartSpec(raw);
  if (!spec) {
    return (
      <pre className="text-xs text-red-400 whitespace-pre-wrap">
        Invalid chart spec: {raw}
      </pre>
    );
  }

  const hasRightAxis = spec.series.some((s) => s.yAxis === "right");

  return (
    <div className="my-4 rounded-xl border border-white/10 bg-white/5 p-4">
      {spec.title && (
        <p className="text-sm font-medium text-white/70 mb-3">{spec.title}</p>
      )}
      <ResponsiveContainer width="100%" height={320}>
        {spec.type === "bar" ? (
          <BarChart
            data={spec.data}
            layout="vertical"
            margin={{ top: 4, right: hasRightAxis ? 60 : 16, left: 8, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis
              type="number"
              tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
              axisLine={{ stroke: "rgba(255,255,255,0.15)" }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey={spec.xKey}
              width={170}
              tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            {hasRightAxis && (
              <YAxis
                yAxisId="right"
                orientation="right"
                width={50}
                tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                label={{
                  value: spec.series.find((s) => s.yAxis === "right")?.name ?? "",
                  angle: 90,
                  position: "insideRight",
                  fill: "rgba(255,255,255,0.3)",
                  fontSize: 10,
                  dx: 14,
                }}
              />
            )}
            <Tooltip
              contentStyle={{
                background: "rgba(15,15,30,0.95)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8,
                color: "#fff",
                fontSize: 12,
              }}
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}
            />
            {spec.series.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.name}
                fill={s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                yAxisId={s.yAxis === "right" ? "right" : undefined}
                radius={[0, 3, 3, 0]}
              />
            ))}
          </BarChart>
        ) : spec.type === "line" ? (
          <LineChart
            data={spec.data}
            margin={{ top: 4, right: hasRightAxis ? 60 : 16, left: 8, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis
              dataKey={spec.xKey}
              tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
              axisLine={{ stroke: "rgba(255,255,255,0.15)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            {hasRightAxis && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
            )}
            <Tooltip
              contentStyle={{
                background: "rgba(15,15,30,0.95)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8,
                color: "#fff",
                fontSize: 12,
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}
            />
            {spec.series.map((s, i) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                yAxisId={s.yAxis === "right" ? "right" : undefined}
                dot={false}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        ) : (
          // pie
          <PieChart>
            <Pie
              data={spec.data}
              dataKey={spec.series[0]?.key ?? "value"}
              nameKey={spec.xKey}
              cx="50%"
              cy="50%"
              outerRadius={110}
              label={({ name, percent }) =>
                `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
              }
              labelLine={{ stroke: "rgba(255,255,255,0.2)" }}
            >
              {spec.data.map((_entry, i) => (
                <Cell
                  key={i}
                  fill={DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "rgba(15,15,30,0.95)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8,
                color: "#fff",
                fontSize: 12,
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}
            />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
