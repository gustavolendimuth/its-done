"use client";

import { isSameDay, isSameMonth, isSameWeek, subMonths, format } from "date-fns";
import { enUS, ptBR } from "date-fns/locale";
import {
  Building2,
  Clock,
  ExternalLink,
  FileText,
  ListChecks,
  Trash2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Fragment, useMemo, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatHoursToHHMM } from "@/lib/utils";

import { groupByMonthAndWeek, type WorkHourRow } from "./work-hours-grouping";

export type { WorkHourRow } from "./work-hours-grouping";

interface WorkHoursTableProps {
  workHours: WorkHourRow[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
  onAddClick: () => void;
  className?: string;
}

export function WorkHoursTable({
  workHours,
  onEdit,
  onDelete,
  deletingId,
  onAddClick,
  className,
}: WorkHoursTableProps) {
  const t = useTranslations("workHours");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const dateLocale = locale === "pt-BR" ? ptBR : enUS;

  const [searchTerm, setSearchTerm] = useState("");

  const filteredWorkHours = useMemo(() => {
    if (!searchTerm.trim()) return workHours;

    const query = searchTerm.trim().toLowerCase();

    return workHours.filter((workHour) => {
      const haystack = [
        workHour.description,
        workHour.client?.company,
        workHour.client?.name,
        workHour.project?.name,
        workHour.task?.title,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [workHours, searchTerm]);

  const monthGroups = useMemo(
    () => groupByMonthAndWeek(filteredWorkHours),
    [filteredWorkHours]
  );

  const grandTotal = useMemo(
    () => filteredWorkHours.reduce((sum, w) => sum + w.hours, 0),
    [filteredWorkHours]
  );

  const capitalize = (label: string) =>
    label.charAt(0).toUpperCase() + label.slice(1);

  const monthLabel = (date: Date) => {
    const now = new Date();

    if (isSameMonth(date, now)) return tCommon("thisMonth");
    if (isSameMonth(date, subMonths(now, 1))) return tCommon("lastMonth");

    return capitalize(format(date, "MMMM 'de' yyyy", { locale: dateLocale }));
  };

  const weekLabel = (start: Date, end: Date) => {
    if (isSameWeek(start, new Date(), { weekStartsOn: 1 }))
      return tCommon("thisWeek");

    const weekWord = capitalize(t("week"));
    const endLabel = format(end, "d 'de' MMMM", { locale: dateLocale });

    if (isSameDay(start, end)) return `${weekWord} de ${endLabel}`;

    const sameMonth = start.getMonth() === end.getMonth();
    const startLabel = format(start, sameMonth ? "d" : "d 'de' MMMM", {
      locale: dateLocale,
    });

    return `${weekWord} de ${startLabel} a ${endLabel}`;
  };

  const dateCellLabel = (date: Date) =>
    `${format(date, "dd/MM")}, ${capitalize(
      format(date, "EEEE", { locale: dateLocale })
    )}`;

  if (workHours.length === 0) {
    return (
      <div className="text-center py-12" data-testid="empty-state">
        <Clock className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">
          {t("noWorkHours")}
        </h3>
        <p className="text-muted-foreground mb-4">
          {t("noWorkHoursDescription")}
        </p>
        <Button onClick={onAddClick}>{t("addHours")}</Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <SearchInput
          value={searchTerm}
          onValueChange={setSearchTerm}
          placeholder={t("searchPlaceholder")}
          className="sm:max-w-xs"
        />
        <span className="text-sm text-muted-foreground">
          {filteredWorkHours.length}{" "}
          {filteredWorkHours.length === 1 ? tCommon("entry") : tCommon("entries")}{" "}
          {tCommon("found")}
        </span>
      </div>

      {filteredWorkHours.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground font-medium mb-1">
            {t("noResults")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("noResultsDescription")}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[140px]">{t("date")}</TableHead>
                <TableHead>{t("client")}</TableHead>
                <TableHead>{t("project")}</TableHead>
                <TableHead>{t("task")}</TableHead>
                <TableHead>{t("hourDescription")}</TableHead>
                <TableHead className="text-right">{t("hours")}</TableHead>
                <TableHead className="w-[92px] text-right">
                  {t("actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthGroups.map((month) => (
                <Fragment key={month.key}>
                  <TableRow className="bg-brand-green-100/70 dark:bg-brand-green-950/40 hover:bg-brand-green-100/70 dark:hover:bg-brand-green-950/40">
                    <TableCell
                      colSpan={6}
                      className="py-2 font-bold text-sm text-brand-green-900 dark:text-brand-green-200"
                    >
                      {monthLabel(month.date)}
                    </TableCell>
                    <TableCell className="py-2 text-right font-mono tabular-nums font-bold text-sm text-brand-green-900 dark:text-brand-green-200">
                      {formatHoursToHHMM(month.totalHours)}
                    </TableCell>
                  </TableRow>

                  {month.weeks.map((week) => (
                    <Fragment key={week.key}>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableCell
                          colSpan={6}
                          className="py-1.5 text-xs font-medium text-muted-foreground"
                        >
                          {weekLabel(week.start, week.end)}
                        </TableCell>
                        <TableCell className="py-1.5 text-right">
                          <Badge
                            variant="outline"
                            className="font-mono tabular-nums font-normal text-xs text-muted-foreground"
                          >
                            {formatHoursToHHMM(week.totalHours)}
                          </Badge>
                        </TableCell>
                      </TableRow>

                      {week.entries.map((workHour) => {
                        const clientLabel =
                          workHour.client?.company ?? t("noClient");
                        const clientSubtitle =
                          workHour.client?.name &&
                          workHour.client.name !== workHour.client.company
                            ? workHour.client.name
                            : null;

                        return (
                          <TableRow
                            key={workHour.id}
                            className="group cursor-pointer"
                            data-testid="work-hour-row"
                            role="button"
                            tabIndex={0}
                            onClick={() => onEdit(workHour.id)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                onEdit(workHour.id);
                              }
                            }}
                          >
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                              {dateCellLabel(new Date(workHour.date))}
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-brand-green-500 flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {clientLabel}
                                  </p>
                                  {clientSubtitle && (
                                    <p className="text-xs text-muted-foreground truncate">
                                      {clientSubtitle}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              {workHour.project ? (
                                <Badge
                                  variant="outline"
                                  className="font-normal gap-1"
                                >
                                  <FileText className="h-3 w-3" />
                                  <span className="truncate max-w-[160px]">
                                    {workHour.project.name}
                                  </span>
                                </Badge>
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  —
                                </span>
                              )}
                            </TableCell>

                            <TableCell>
                              {workHour.task ? (
                                workHour.task.link ? (
                                  <a
                                    href={workHour.task.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(event) => event.stopPropagation()}
                                    className="inline-flex"
                                  >
                                    <Badge
                                      variant="outline"
                                      className="font-normal gap-1 hover:bg-accent"
                                    >
                                      <ListChecks className="h-3 w-3" />
                                      <span className="truncate max-w-[160px]">
                                        {workHour.task.title}
                                      </span>
                                      <ExternalLink className="h-3 w-3 opacity-60" />
                                    </Badge>
                                  </a>
                                ) : (
                                  <Badge variant="outline" className="font-normal gap-1">
                                    <ListChecks className="h-3 w-3" />
                                    <span className="truncate max-w-[160px]">
                                      {workHour.task.title}
                                    </span>
                                  </Badge>
                                )
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  —
                                </span>
                              )}
                            </TableCell>

                            <TableCell className="max-w-[280px]">
                              {workHour.description ? (
                                <p
                                  className="text-sm text-muted-foreground truncate"
                                  title={workHour.description}
                                >
                                  {workHour.description}
                                </p>
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  —
                                </span>
                              )}
                            </TableCell>

                            <TableCell className="text-right">
                              <span className="font-mono tabular-nums font-semibold">
                                {formatHoursToHHMM(workHour.hours)}
                              </span>
                              {workHour.startTime && workHour.endTime && (
                                <p
                                  className="text-xs text-muted-foreground font-mono"
                                  data-testid="work-hour-interval"
                                >
                                  {workHour.startTime}–{workHour.endTime}
                                </p>
                              )}
                            </TableCell>

                            <TableCell onClick={(event) => event.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive hover:text-destructive"
                                      aria-label={`${t("delete")} ${t("workHour")}`}
                                      data-testid="delete-button"
                                      disabled={deletingId === workHour.id}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        {t("deleteWorkHourTitle")}
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        {t("deleteWorkHourDescription", {
                                          hours: formatHoursToHHMM(
                                            workHour.hours
                                          ),
                                          client: clientLabel,
                                        })}
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        {tCommon("cancel")}
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => onDelete(workHour.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        {t("deleteEntry")}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </Fragment>
                  ))}
                </Fragment>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="hover:bg-muted/50">
                <TableCell colSpan={5} className="font-semibold">
                  {t("totalHours")}
                </TableCell>
                <TableCell
                  colSpan={2}
                  className="text-right font-mono tabular-nums font-bold text-base"
                >
                  {formatHoursToHHMM(grandTotal)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
    </div>
  );
}
