"use client";

import { useTranslations } from "next-intl";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatHoursToHHMM } from "@/lib/utils";

export interface TopClientsChartProps {
  data: { name: string; hours: number; color: string }[];
}

export function TopClientsChart({ data }: TopClientsChartProps) {
  const t = useTranslations("analytics");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("topClients")}</CardTitle>
        <CardDescription>{t("hoursDistributionByClient")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, hours }) =>
                  `${name}: ${formatHoursToHHMM(hours)}`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="hours"
                stroke="hsl(var(--foreground))"
                strokeWidth={1}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
