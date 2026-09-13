import { fireEvent, render, screen } from "@testing-library/react";

import { WorkHoursTable } from "./work-hours-table";

import type { WorkHourRow } from "./work-hours-grouping";

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

function makeRow(overrides: Partial<WorkHourRow> = {}): WorkHourRow {
  return {
    id: "wh-1",
    date: "2026-01-01",
    hours: 2,
    description: "Work",
    createdAt: "2026-01-01",
    client: { id: "c1", company: "Acme", email: "acme@example.com" },
    ...overrides,
  };
}

describe("WorkHoursTable", () => {
  const noop = () => {};

  it("enables the edit button and calls onEdit when the work hour has no invoice", () => {
    const onEdit = jest.fn();
    render(
      <WorkHoursTable
        workHours={[makeRow()]}
        onEdit={onEdit}
        onDelete={noop}
        deletingId={null}
        onAddClick={noop}
      />
    );

    const editButton = screen.getByRole("button", { name: "edit workHour" });
    expect(editButton).not.toBeDisabled();

    fireEvent.click(editButton);
    expect(onEdit).toHaveBeenCalledWith("wh-1");
  });

  it("disables the edit button when the work hour is linked to a PENDING invoice", () => {
    const onEdit = jest.fn();
    render(
      <WorkHoursTable
        workHours={[
          makeRow({
            invoiceWorkHours: [
              { invoice: { id: "inv-1", status: "PENDING" } },
            ],
          }),
        ]}
        onEdit={onEdit}
        onDelete={noop}
        deletingId={null}
        onAddClick={noop}
      />
    );

    const editButton = screen.getByRole("button", {
      name: "cannotEditInvoiced",
    });
    expect(editButton).toBeDisabled();
    expect(editButton).toHaveAttribute("title", "cannotEditInvoiced");

    fireEvent.click(editButton);
    expect(onEdit).not.toHaveBeenCalled();
  });

  it("enables the edit button when the work hour is linked only to a CANCELED invoice", () => {
    const onEdit = jest.fn();
    render(
      <WorkHoursTable
        workHours={[
          makeRow({
            invoiceWorkHours: [
              { invoice: { id: "inv-1", status: "CANCELED" } },
            ],
          }),
        ]}
        onEdit={onEdit}
        onDelete={noop}
        deletingId={null}
        onAddClick={noop}
      />
    );

    const editButton = screen.getByRole("button", { name: "edit workHour" });
    expect(editButton).not.toBeDisabled();

    fireEvent.click(editButton);
    expect(onEdit).toHaveBeenCalledWith("wh-1");
  });
});
