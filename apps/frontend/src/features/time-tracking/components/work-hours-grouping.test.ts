import { isWorkHourInvoiced, type WorkHourRow } from "./work-hours-grouping";

function makeRow(invoiceWorkHours?: WorkHourRow["invoiceWorkHours"]): WorkHourRow {
  return {
    id: "wh-1",
    date: "2026-01-01",
    hours: 1,
    createdAt: "2026-01-01",
    invoiceWorkHours,
  };
}

describe("isWorkHourInvoiced", () => {
  it("returns false when invoiceWorkHours is undefined", () => {
    expect(isWorkHourInvoiced(makeRow(undefined))).toBe(false);
  });

  it("returns false when every linked invoice is CANCELED", () => {
    const row = makeRow([
      { invoice: { id: "inv-1", status: "CANCELED" } },
      { invoice: { id: "inv-2", status: "CANCELED" } },
    ]);

    expect(isWorkHourInvoiced(row)).toBe(false);
  });

  it("returns true when at least one linked invoice is not CANCELED", () => {
    const row = makeRow([
      { invoice: { id: "inv-1", status: "CANCELED" } },
      { invoice: { id: "inv-2", status: "PENDING" } },
    ]);

    expect(isWorkHourInvoiced(row)).toBe(true);
  });
});
