import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  className?: string;
  placeholder?: string;
  disabled?: (date: Date) => boolean;
}

export function DatePickerComponent({
  value,
  onChange,
  className,
  placeholder = "Selecione uma data",
  disabled,
}: DatePickerProps) {
  const displayText = value ? format(value, "dd MMM yyyy") : placeholder;

  return (
    <DatePicker
      selected={value}
      onChange={onChange}
      dateFormat="dd/MM/yyyy"
      placeholderText={placeholder}
      filterDate={disabled ? (date) => !disabled(date) : undefined}
      shouldCloseOnSelect={true}
      preventOpenOnFocus={true}
      customInput={
        <Button
          type="button"
          variant="outline"
          className={
            "w-full justify-between text-left font-normal " +
            (!value ? "text-muted-foreground " : "") +
            (className || "")
          }
        >
          {displayText}
          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      }
      calendarClassName="custom-datepicker"
      popperPlacement="bottom-start"
      popperClassName="z-[9999]"
      wrapperClassName="w-full"
    />
  );
}
