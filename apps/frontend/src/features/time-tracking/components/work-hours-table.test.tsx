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

  it("opens the row's modal when a non-invoiced row is clicked outside the action cell", () => {
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

    fireEvent.click(screen.getByTestId("work-hour-row"));
    expect(onEdit).toHaveBeenCalledWith("wh-1");
  });

  it("does not render an edit icon button", () => {
    render(
      <WorkHoursTable
        workHours={[makeRow()]}
        onEdit={noop}
        onDelete={noop}
        deletingId={null}
        onAddClick={noop}
      />
    );

    expect(
      screen.queryByRole("button", { name: "edit workHour" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "cannotEditInvoiced" })
    ).not.toBeInTheDocument();
  });

  it("shows the startTime–endTime interval when the row has one", () => {
    render(
      <WorkHoursTable
        workHours={[makeRow({ startTime: "09:00", endTime: "12:30" })]}
        onEdit={noop}
        onDelete={noop}
        deletingId={null}
        onAddClick={noop}
      />
    );

    expect(screen.getByTestId("work-hour-interval")).toHaveTextContent(
      "09:00–12:30"
    );
  });

  it("does not show an interval when the row only has a duration", () => {
    render(
      <WorkHoursTable
        workHours={[makeRow()]}
        onEdit={noop}
        onDelete={noop}
        deletingId={null}
        onAddClick={noop}
      />
    );

    expect(screen.queryByTestId("work-hour-interval")).not.toBeInTheDocument();
  });

  it("does not trigger the row's onEdit when the delete button is clicked", () => {
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

    fireEvent.click(screen.getByTestId("delete-button"));
    expect(onEdit).not.toHaveBeenCalled();
  });

  it("opens the row's modal when Enter or Space is pressed on a focused row", () => {
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

    const row = screen.getByTestId("work-hour-row");
    expect(row).toHaveAttribute("role", "button");
    expect(row).toHaveAttribute("tabIndex", "0");

    fireEvent.keyDown(row, { key: "Enter" });
    expect(onEdit).toHaveBeenCalledWith("wh-1");

    onEdit.mockClear();
    fireEvent.keyDown(row, { key: " " });
    expect(onEdit).toHaveBeenCalledWith("wh-1");
  });
});
