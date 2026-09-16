"use client";

import type { InvoiceReport } from "../types";

import { useTranslations } from "next-intl";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface InvoiceReportSectionProps {
  invoiceReport: InvoiceReport;
}

export function InvoiceReportSection({
  invoiceReport,
}: InvoiceReportSectionProps) {
  const t = useTranslations("analytics");

  return (
    <div className="grid gap-6">
      {/* Invoice Report Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("totalInvoices")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invoiceReport.totalInvoices}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("pendingInvoices")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invoiceReport.pendingInvoices}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("paidInvoices")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invoiceReport.paidInvoices}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Report Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("invoiceDetails")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("client")}</TableHead>
                <TableHead>{t("totalInvoices")}</TableHead>
                <TableHead>{t("pending")}</TableHead>
                <TableHead>{t("paid")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoiceReport.clientBreakdown?.map((client) => (
                <TableRow key={client.clientId}>
                  <TableCell className="font-medium">
                    {client.clientName}
                  </TableCell>
                  <TableCell>{client.totalInvoices}</TableCell>
                  <TableCell>{client.pendingInvoices}</TableCell>
                  <TableCell>{client.paidInvoices}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
