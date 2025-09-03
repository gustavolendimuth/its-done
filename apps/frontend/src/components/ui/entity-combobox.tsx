"use client";

import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface EntityComboboxProps<T> {
  items: T[];
  value?: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showAddButton?: boolean;
  onAddItem?: () => void;
  addButtonLabel?: string;
  noItemsFoundMessage?: string;
  searchPlaceholder?: string;
  icon?: React.ElementType;
  getDisplayValue: (item: T) => string;
  getId: (item: T) => string;
  getSearchValue: (item: T) => string;
  renderItem?: (item: T) => React.ReactNode;
}

export function EntityCombobox<T>({
  items = [],
  value,
  onSelect,
  placeholder = "Select...",
  className,
  disabled = false,
  showAddButton = true,
  onAddItem,
  addButtonLabel,
  noItemsFoundMessage,
  searchPlaceholder,
  icon: Icon,
  getDisplayValue,
  getId,
  getSearchValue,
  renderItem,
}: EntityComboboxProps<T>) {
  const [open, setOpen] = React.useState(false);
  const t = useTranslations("common");
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [width, setWidth] = React.useState<number>(0);

  React.useEffect(() => {
    if (triggerRef.current) {
      setWidth(triggerRef.current.offsetWidth);
    }
  }, [open]);

  const selectedItem = items.find((item) => getId(item) === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {selectedItem ? (
            <div className="flex items-center gap-2">
              {Icon && <Icon className="h-4 w-4 shrink-0 opacity-50" />}
              <span>{getDisplayValue(selectedItem)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {Icon && <Icon className="h-4 w-4 shrink-0 opacity-50" />}
              <span>{placeholder}</span>
            </div>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        style={{ width: width > 0 ? `${width}px` : undefined }}
        className="p-0"
        align="start"
      >
        <Command className="max-h-96">
          <CommandInput
            placeholder={searchPlaceholder || t("search")}
            className="h-9"
          />
          {showAddButton && onAddItem && (
            <Button
              variant="default"
              size="sm"
              className="w-full"
              onClick={() => {
                onAddItem();
                setOpen(false);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              {addButtonLabel || t("addNew")}
            </Button>
          )}
          <CommandEmpty className="p-2">
            <div className="flex flex-col gap-2 py-4">
              <span>{noItemsFoundMessage || t("noItemsFound")}</span>
            </div>
          </CommandEmpty>
          <CommandList className="max-h-80 overflow-y-auto">
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={getId(item)}
                  value={getSearchValue(item)}
                  onSelect={() => {
                    onSelect(getId(item));
                    setOpen(false);
                  }}
                >
                  {renderItem ? (
                    renderItem(item)
                  ) : (
                    <div className="flex items-center gap-2">
                      {Icon && <Icon className="h-4 w-4 shrink-0 opacity-50" />}
                      <span>{getDisplayValue(item)}</span>
                    </div>
                  )}
                  {getId(item) === value && (
                    <Check className="ml-auto h-4 w-4" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
