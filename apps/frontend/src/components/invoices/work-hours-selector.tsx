"use client";

import { TimeEntry } from "@its-done/types";
import { format } from "date-fns";
import { Clock } from "lucide-react";
import { useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { formatHoursToHHMM } from "@/lib/utils";

interface WorkHoursSelectorProps {
  timeEntries: TimeEntry[];
  _selectedTimeEntries?: TimeEntry[];
  onTimeEntriesChange: (timeEntries: TimeEntry[]) => void;
  hourlyRate?: number;
}

export function WorkHoursSelector({
  timeEntries,
  _selectedTimeEntries,
  onTimeEntriesChange,
  hourlyRate = 50,
}: WorkHoursSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [_groupBy] = useState<"client" | "project" | "none">("client");

  // Filter only entries that don't have an invoice yet
  const availableEntries = timeEntries.filter(
    () => true // For now, show all entries
  );

  // Group entries based on selected grouping
  const groupedEntries = () => {
    if (_groupBy === "none") {
      return { "All Entries": availableEntries };
    }

    return availableEntries.reduce(
      (groups, entry) => {
        let key: string;

        if (_groupBy === "client") {
          key = entry.client?.name || entry.client?.email || "Unknown Client";
        } else if (_groupBy === "project") {
          key = entry.project?.name || "No Project";
        } else {
          key = "All Entries";
        }

        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(entry);

        return groups;
      },
      {} as Record<string, TimeEntry[]>
    );
  };

  const _handleEntryToggle = (entryId: string, checked: boolean) => {
    const newSelectedIds = new Set(selectedIds);

    if (checked) {
      newSelectedIds.add(entryId);
    } else {
      newSelectedIds.delete(entryId);
    }

    setSelectedIds(newSelectedIds);

    // Calculate and notify immediately
    const selectedEntries = availableEntries.filter((entry) =>
      newSelectedIds.has(entry.id)
    );
    onTimeEntriesChange(selectedEntries);
  };

  const _handleGroupToggle = (groupEntries: TimeEntry[], checked: boolean) => {
    const newSelectedIds = new Set(selectedIds);

    groupEntries.forEach((entry) => {
      if (checked) {
        newSelectedIds.add(entry.id);
      } else {
        newSelectedIds.delete(entry.id);
      }
    });

    setSelectedIds(newSelectedIds);

    // Calculate and notify immediately
    const selectedEntries = availableEntries.filter((entry) =>
      newSelectedIds.has(entry.id)
    );
    onTimeEntriesChange(selectedEntries);
  };

  // Calculate totals for display
  const selectedEntries = availableEntries.filter((entry) =>
    selectedIds.has(entry.id)
  );
  const totalHours = selectedEntries.reduce(
    (sum, entry) => sum + entry.hours,
    0
  );
  const _totalAmount = totalHours * hourlyRate;

  const _grouped = groupedEntries();

  const handleSelectAll = () => {
    const selectedEntries = timeEntries;
    onTimeEntriesChange(selectedEntries);
  };

  const handleUnselectAll = () => {
    onTimeEntriesChange([]);
  };

  if (availableEntries.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No work hours available</h3>
          <p className="text-muted-foreground">
            All work hours have already been invoiced or there are no work hours
            recorded.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Work Hours</Label>
        <div className="space-x-2">
          <button
            type="button"
            className="text-sm text-muted-foreground hover:text-foreground"
            onClick={handleSelectAll}
          >
            Select All
          </button>
          <button
            type="button"
            className="text-sm text-muted-foreground hover:text-foreground"
            onClick={handleUnselectAll}
          >
            Unselect All
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {timeEntries.map((timeEntry) => (
          <div
            key={timeEntry.id}
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div className="space-y-1">
              <div className="text-sm font-medium">{timeEntry.description}</div>
              <div className="text-sm text-muted-foreground">
                {format(new Date(timeEntry.date), "PPP")}
              </div>
            </div>
            <div className="text-sm font-medium">
              {formatHoursToHHMM(timeEntry.hours)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
