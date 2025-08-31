"use client";

import { format } from "date-fns";
import { Clock } from "lucide-react";
import { useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ProjectCombobox } from "@/components/ui/project-combobox";
import { formatHoursToHHMM } from "@/lib/utils";
import { TimeEntry } from "@/types";

interface WorkHoursSelectorProps {
  timeEntries: TimeEntry[];
  _selectedTimeEntries?: TimeEntry[];
  onTimeEntriesChange: (timeEntries: TimeEntry[]) => void;
  hourlyRate?: number;
  clientId?: string;
}

export function WorkHoursSelector({
  timeEntries,
  _selectedTimeEntries,
  onTimeEntriesChange,
  hourlyRate = 50,
  clientId,
}: WorkHoursSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  // Filter entries by project if one is selected
  const availableEntries = selectedProjectId
    ? timeEntries.filter((entry) => entry.projectId === selectedProjectId)
    : timeEntries;

  // Handle individual entry selection
  const handleEntryToggle = (entryId: string, checked: boolean) => {
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

  // Handle project selection
  const handleProjectChange = (projectId: string | null) => {
    setSelectedProjectId(projectId || "");
    setSelectedIds(new Set()); // Reset selections when project changes
    onTimeEntriesChange([]); // Clear selected entries
  };

  // Calculate totals for display
  const selectedEntries = availableEntries.filter((entry) =>
    selectedIds.has(entry.id)
  );
  const totalHours = selectedEntries.reduce(
    (sum, entry) => sum + entry.hours,
    0
  );

  const handleSelectAll = () => {
    const allIds = new Set(availableEntries.map((entry) => entry.id));
    setSelectedIds(allIds);
    onTimeEntriesChange(availableEntries);
  };

  const handleUnselectAll = () => {
    setSelectedIds(new Set());
    onTimeEntriesChange([]);
  };

  if (timeEntries.length === 0) {
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
      {/* Project Selection */}
      <div className="space-y-2">
        <Label>Filter by Project</Label>
        <ProjectCombobox
          clientId={clientId}
          value={selectedProjectId}
          onSelect={handleProjectChange}
          placeholder="All Projects"
          allowClear
        />
      </div>

      {/* Work Hours Selection */}
      <div className="flex items-center justify-between">
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
        {selectedEntries.length > 0 && (
          <div className="text-sm text-muted-foreground">
            Total: {formatHoursToHHMM(totalHours)}
          </div>
        )}
      </div>

      {/* Work Hours List */}
      <div className="space-y-2">
        {availableEntries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center space-x-2 p-2 rounded-lg border"
          >
            <Checkbox
              id={entry.id}
              checked={selectedIds.has(entry.id)}
              onCheckedChange={(checked) =>
                handleEntryToggle(entry.id, checked as boolean)
              }
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor={entry.id}
                  className="text-sm font-medium cursor-pointer"
                >
                  {format(new Date(entry.date), "dd/MM/yyyy")}
                </Label>
                <span className="text-sm font-mono">
                  {formatHoursToHHMM(entry.hours)}
                </span>
              </div>
              {entry.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {entry.description}
                </p>
              )}
              {entry.project && (
                <p className="text-xs text-muted-foreground mt-1">
                  Project: {entry.project.name}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
