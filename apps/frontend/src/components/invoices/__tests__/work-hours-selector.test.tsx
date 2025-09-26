import { expect, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkHoursSelector } from "@/components/invoices/work-hours-selector";

const makeEntry = (overrides: Partial<any> = {}) => ({
  id: Math.random().toString(36).slice(2),
  date: new Date().toISOString(),
  description: "",
  hours: 1,
  clientId: "c1",
  projectId: "p1",
  client: { id: "c1", name: "Client 1", company: "ACME", email: "c1@x.com" },
  project: { id: "p1", name: "Project 1", hourlyRate: 100 },
  invoiceWorkHours: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

describe("WorkHoursSelector", () => {
  it("calls onSelectionChange with correct total for a single selected entry", async () => {
    const user = userEvent.setup();
    const onSelectionChange = jest.fn();

    const entry = makeEntry({ hours: 2, project: { id: "p1", name: "P1", hourlyRate: 100 } });

    render(<WorkHoursSelector timeEntries={[entry]} onSelectionChange={onSelectionChange} />);

    // There are two checkboxes: group header and the entry itself. Click the entry checkbox (index 1).
  const checkboxes = screen.getAllByRole("checkbox");
  expect(checkboxes.length >= 2).toBe(true);

    await user.click(checkboxes[1]);

  // Expect totalAmount = 2 * 100 = 200
  const lastCall = (onSelectionChange as jest.Mock).mock.calls.at(-1);
  expect(lastCall).toBeTruthy();
  expect(lastCall?.[1]).toBe(200);
  });

  it("aggregates totals across multiple entries with different project rates", async () => {
    const user = userEvent.setup();
    const onSelectionChange = jest.fn();

    const e1 = makeEntry({ id: "wh1", hours: 1, project: { id: "p1", name: "P1", hourlyRate: 120 } });
    const e2 = makeEntry({ id: "wh2", hours: 3, project: { id: "p2", name: "P2", hourlyRate: 80 } });

    render(<WorkHoursSelector timeEntries={[e1, e2]} onSelectionChange={onSelectionChange} />);

    const checkboxes = screen.getAllByRole("checkbox");
    // Click both entry checkboxes (indices 1 and 2)
    await user.click(checkboxes[1]);
    await user.click(checkboxes[2]);

  // Expected total = 1*120 + 3*80 = 120 + 240 = 360
  const lastCall = (onSelectionChange as jest.Mock).mock.calls.at(-1);
  expect(lastCall).toBeTruthy();
  expect(lastCall?.[1]).toBe(360);
  });
});
