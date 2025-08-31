import {
  format,
  startOfToday,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
} from "date-fns";
import { useTranslations } from "next-intl";
import React, { useState, useRef } from "react";

import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface PeriodSelectorV2Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

export function PeriodSelectorV2({
  value,
  onChange,
  className,
}: PeriodSelectorV2Props) {
  const t = useTranslations("common");
  const [showCustom, setShowCustom] = useState(false);
  const customBtnRef = useRef<HTMLButtonElement>(null);

  const PRESETS = [
    {
      label: t("today"),
      getRange: () => {
        const start = startOfToday();
        const end = endOfDay(new Date());

        return { startDate: start, endDate: end };
      },
    },
    {
      label: t("thisWeek"),
      getRange: () => {
        const start = startOfWeek(new Date(), { weekStartsOn: 1 });
        const end = endOfWeek(new Date(), { weekStartsOn: 1 });

        return { startDate: start, endDate: end };
      },
    },
    {
      label: t("thisMonth"),
      getRange: () => {
        const start = startOfMonth(new Date());
        const end = endOfMonth(new Date());

        return { startDate: start, endDate: end };
      },
    },
    {
      label: t("last7Days"),
      getRange: () => {
        const end = endOfDay(new Date());
        const start = subDays(end, 6);

        return { startDate: start, endDate: end };
      },
    },
    {
      label: t("last30Days"),
      getRange: () => {
        const end = endOfDay(new Date());
        const start = subDays(end, 29);

        return { startDate: start, endDate: end };
      },
    },
  ];

  const formatLabel = () => {
    if (!value.startDate || !value.endDate) return t("selectPeriod");
    for (const preset of PRESETS) {
      const presetRange = preset.getRange();

      if (
        value.startDate.toDateString() ===
          presetRange.startDate.toDateString() &&
        value.endDate.toDateString() === presetRange.endDate.toDateString()
      ) {
        return preset.label;
      }
    }
    if (value.startDate.toDateString() === value.endDate.toDateString()) {
      return format(value.startDate, "dd MMM yyyy");
    }

    return `${format(value.startDate, "dd MMM")} - ${format(value.endDate, "dd MMM yyyy")}`;
  };

  // Fecha o calendário customizado ao selecionar um range válido
  const handleCustomChange = (range: DateRange) => {
    onChange(range);
    if (range.startDate && range.endDate) {
      setShowCustom(false);
    }
  };

  return (
    <div className={className + " relative"}>
      {/* Botão principal estilizado como SelectTrigger */}
      <Button
        ref={customBtnRef}
        type="button"
        variant="outline"
        className="w-full h-11 bg-gradient-to-r from-background to-muted/20 border-2 border-muted hover:border-primary/30 shadow-sm hover:shadow-md transition-all duration-200 justify-start text-left font-normal"
        onClick={() => setShowCustom((v) => !v)}
      >
        {formatLabel()}
      </Button>

      {/* Botões de preset em linha separada */}
      <div className="grid grid-cols-5 gap-2 mt-3">
        {PRESETS.map((preset) => {
          const presetRange = preset.getRange();
          const isSelected =
            value.startDate &&
            value.endDate &&
            value.startDate.toDateString() ===
              presetRange.startDate.toDateString() &&
            value.endDate.toDateString() === presetRange.endDate.toDateString();

          return (
            <Button
              key={preset.label}
              type="button"
              variant={isSelected ? "default" : "outline"}
              size="sm"
              className="text-xs rounded-md"
              onClick={() => onChange(preset.getRange())}
            >
              {preset.label}
            </Button>
          );
        })}
      </div>

      {/* Calendário customizado */}
      {showCustom && (
        <div className="absolute z-50 mt-2 left-0 w-full min-w-[320px]">
          <div className="border rounded-lg p-4 bg-background shadow-xl">
            <DateRangePicker
              value={value}
              onChange={handleCustomChange}
              inlinePopup
            />
          </div>
        </div>
      )}
    </div>
  );
}
