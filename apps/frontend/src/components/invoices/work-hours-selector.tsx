"use client";

import * as Sentry from "@sentry/nextjs";
import { format } from "date-fns";
import { Clock, Calendar, User, Briefcase } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatHoursToHHMM } from "@/lib/utils";
import { TimeEntry } from "@/types";

interface WorkHoursSelectorProps {
  timeEntries: TimeEntry[];
  initialSelectedIds?: string[];
  onSelectionChange: (selectedIds: string[], totalAmount: number) => void;
}

export function WorkHoursSelector({
  timeEntries,
  initialSelectedIds = [],
  onSelectionChange,
}: WorkHoursSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(initialSelectedIds)
  );
  const [groupBy, setGroupBy] = useState<"client" | "project" | "none">(
    "client"
  );

  // Available entries (already filtered upstream if needed)
  const availableEntries = timeEntries;

  // Group entries based on selected grouping
  const groupedEntries = () => {
    if (groupBy === "none") {
      return { "All Entries": availableEntries } as Record<string, TimeEntry[]>;
    }

    return availableEntries.reduce(
      (groups, entry) => {
        let key: string;

        if (groupBy === "client") {
          key = entry.client?.name || entry.client?.email || "Unknown Client";
        } else if (groupBy === "project") {
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
    const totalAmount = selectedEntries.reduce((sum, entry) => {
      const rate = entry.project?.hourlyRate ?? 0;
      return sum + entry.hours * rate;
    }, 0);
    onSelectionChange(Array.from(newSelectedIds), totalAmount);
  };

  const handleGroupToggle = (groupEntries: TimeEntry[], checked: boolean) => {
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
    const totalAmount = selectedEntries.reduce((sum, entry) => {
      const rate = entry.project?.hourlyRate ?? 0;
      return sum + entry.hours * rate;
    }, 0);
    onSelectionChange(Array.from(newSelectedIds), totalAmount);
  };

  // Totals for display are handled by the parent summary component

  const grouped = groupedEntries();

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
    <Sentry.ErrorBoundary
      fallback={
        <div className="p-4 text-sm text-red-600 border border-red-200 rounded">
          Something went wrong while rendering work hours. The issue was reported.
        </div>
      }
    >
    <div className="space-y-4">
      {/* Group by selector */}
      <div className="space-y-2">
        <Label htmlFor="groupBy">Group by</Label>
        <Select
          value={groupBy}
          onValueChange={(val) =>
            setGroupBy(val as "client" | "project" | "none")
          }
        >
          <SelectTrigger id="groupBy">
            <SelectValue placeholder="Select grouping" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="client">Client</SelectItem>
            <SelectItem value="project">Project</SelectItem>
            <SelectItem value="none">None</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm text-muted-foreground">Selected:</span>
              <span className="ml-2 font-medium">{selectedIds.size} entries</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Total Hours:</span>
              <span className="ml-2 font-medium">{formatHoursToHHMM(totalHours)}</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Total Amount:</span>
              <span className="ml-2 font-medium text-lg">${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card> */}

      {/* Grouped entries */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([groupName, groupEntries]) => {
          const groupSelected = groupEntries.every((entry) => selectedIds.has(entry.id));
          const groupPartiallySelected =
            groupEntries.some((entry) => selectedIds.has(entry.id)) && !groupSelected;

          return (
            <Card key={groupName}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    <Checkbox
                      checked={groupSelected}
                      onCheckedChange={(checked: boolean) =>
                        handleGroupToggle(groupEntries, checked)
                      }
                      className="mr-3"
                    />
                    {groupBy === "client" && <User className="w-4 h-4 mr-2" />}
                    {groupBy === "project" && <Briefcase className="w-4 h-4 mr-2" />}
                    {groupName}
                    {groupPartiallySelected && (
                      <span className="ml-2 text-xs text-blue-600">(partial)</span>
                    )}
                  </CardTitle>
                  <Badge variant="info">
                    {groupEntries.length} entries • {formatHoursToHHMM(
                      groupEntries.reduce((sum, entry) => sum + entry.hours, 0)
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {groupEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        selectedIds.has(entry.id)
                          ? "bg-primary/10 border-primary/20"
                          : "bg-background hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={selectedIds.has(entry.id)}
                          onCheckedChange={(checked: boolean) =>
                            handleEntryToggle(entry.id, checked)
                          }
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 text-sm">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>{format(new Date(entry.date), "MMM dd, yyyy")}</span>
                            <Clock className="w-4 h-4 text-muted-foreground ml-4" />
                            <span>{formatHoursToHHMM(entry.hours)}</span>
                          </div>
                          {entry.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {entry.description}
                            </p>
                          )}
                          {entry.project && (
                            <Badge variant="secondary" className="mt-1">
                              {entry.project.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${(entry.hours * (entry.project?.hourlyRate ?? 0)).toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">@ ${entry.project?.hourlyRate ?? 0}/hr</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
    </Sentry.ErrorBoundary>
  );
}
