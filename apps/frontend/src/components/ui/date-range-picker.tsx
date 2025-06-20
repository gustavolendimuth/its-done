import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
  inlinePopup?: boolean;
}

export function DateRangePicker({
  value,
  onChange,
  className,
  inlinePopup,
}: DateRangePickerProps) {
  const [startDate, endDate] = [value.startDate, value.endDate];

  const handleChange = (dates: [Date | null, Date | null]) => {
    onChange({ startDate: dates[0], endDate: dates[1] });
  };

  const displayText =
    startDate && endDate
      ? `${format(startDate, "dd MMM yyyy")} - ${format(endDate, "dd MMM yyyy")}`
      : "Selecione o período";

  if (inlinePopup) {
    return (
      <DatePicker
        selectsRange
        startDate={startDate}
        endDate={endDate}
        onChange={handleChange}
        monthsShown={2}
        dateFormat="dd/MM/yyyy"
        placeholderText="Selecione o período"
        calendarClassName="custom-datepicker"
        inline
        className={className}
      />
    );
  }

  return (
    <DatePicker
      selectsRange
      startDate={startDate}
      endDate={endDate}
      onChange={handleChange}
      monthsShown={2}
      dateFormat="dd/MM/yyyy"
      placeholderText="Selecione o período"
      customInput={
        <Button
          type="button"
          variant="outline"
          className={
            "w-full justify-between text-left font-medium h-11 px-4 bg-gradient-to-r from-background to-muted/20 border-2 border-muted hover:border-primary/30 shadow-sm hover:shadow-md transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/20 " +
            (className || "")
          }
        >
          {displayText}
        </Button>
      }
      calendarClassName="custom-datepicker"
      popperPlacement="bottom-start"
      popperClassName="z-[9999]"
      wrapperClassName="w-full"
    />
  );
}
