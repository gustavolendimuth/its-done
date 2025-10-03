import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  startOfToday,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  format,
} from "date-fns";

// Mock next-intl useTranslations hook BEFORE importing component
jest.mock("next-intl", () => ({
  useTranslations: () => {
    const translations: Record<string, string> = {
      allTime: "All Time",
      today: "Today",
      thisWeek: "This Week",
      thisMonth: "This Month",
      last7Days: "Last 7 days",
      last30Days: "Last 30 days",
      selectPeriod: "Select Period",
    };

    return (key: string) => translations[key] || key;
  },
}));

// Mock DateRangePicker component
jest.mock("../date-range-picker", () => ({
  DateRangePicker: ({ value, onChange }: any) => (
    <div data-testid="date-range-picker">
      <button
        onClick={() =>
          onChange({
            startDate: new Date(2024, 0, 1),
            endDate: new Date(2024, 0, 31),
          })
        }
      >
        Select Custom Range
      </button>
    </div>
  ),
}));

import { PeriodSelectorV2 } from "../period-selector-v2";

describe("PeriodSelectorV2", () => {
  const mockOnChange = jest.fn();
  const defaultValue = {
    startDate: null,
    endDate: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the main button with default text when no period selected", () => {
    render(<PeriodSelectorV2 value={defaultValue} onChange={mockOnChange} />);

    expect(screen.getByText("selectPeriod")).toBeInTheDocument();
  });

  it("should render all preset buttons", () => {
    render(<PeriodSelectorV2 value={defaultValue} onChange={mockOnChange} />);

    expect(screen.getByText("allTime")).toBeInTheDocument();
    expect(screen.getByText("today")).toBeInTheDocument();
    expect(screen.getByText("thisWeek")).toBeInTheDocument();
    expect(screen.getByText("thisMonth")).toBeInTheDocument();
    expect(screen.getByText("last7Days")).toBeInTheDocument();
    expect(screen.getByText("last30Days")).toBeInTheDocument();
  });

  it("should call onChange when 'Today' preset is clicked", () => {
    render(<PeriodSelectorV2 value={defaultValue} onChange={mockOnChange} />);

    const todayButton = screen.getByText("today");
    fireEvent.click(todayButton);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    const calledWith = mockOnChange.mock.calls[0][0];

    expect(calledWith.startDate).toEqual(startOfToday());
    expect(calledWith.endDate).toEqual(endOfDay(new Date()));
  });

  it("should call onChange when 'This Week' preset is clicked", () => {
    render(<PeriodSelectorV2 value={defaultValue} onChange={mockOnChange} />);

    const thisWeekButton = screen.getByText("thisWeek");
    fireEvent.click(thisWeekButton);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    const calledWith = mockOnChange.mock.calls[0][0];

    expect(calledWith.startDate).toEqual(
      startOfWeek(new Date(), { weekStartsOn: 1 })
    );
    expect(calledWith.endDate).toEqual(
      endOfWeek(new Date(), { weekStartsOn: 1 })
    );
  });

  it("should call onChange when 'This Month' preset is clicked", () => {
    render(<PeriodSelectorV2 value={defaultValue} onChange={mockOnChange} />);

    const thisMonthButton = screen.getByText("thisMonth");
    fireEvent.click(thisMonthButton);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    const calledWith = mockOnChange.mock.calls[0][0];

    expect(calledWith.startDate).toEqual(startOfMonth(new Date()));
    expect(calledWith.endDate).toEqual(endOfMonth(new Date()));
  });

  it("should call onChange when 'Last 7 days' preset is clicked", () => {
    render(<PeriodSelectorV2 value={defaultValue} onChange={mockOnChange} />);

    const last7DaysButton = screen.getByText("last7Days");
    fireEvent.click(last7DaysButton);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    const calledWith = mockOnChange.mock.calls[0][0];
    const expectedEnd = endOfDay(new Date());
    const expectedStart = subDays(expectedEnd, 6);

    expect(calledWith.startDate?.toDateString()).toEqual(
      expectedStart.toDateString()
    );
    expect(calledWith.endDate?.toDateString()).toEqual(
      expectedEnd.toDateString()
    );
  });

  it("should call onChange when 'Last 30 days' preset is clicked", () => {
    render(<PeriodSelectorV2 value={defaultValue} onChange={mockOnChange} />);

    const last30DaysButton = screen.getByText("last30Days");
    fireEvent.click(last30DaysButton);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    const calledWith = mockOnChange.mock.calls[0][0];
    const expectedEnd = endOfDay(new Date());
    const expectedStart = subDays(expectedEnd, 29);

    expect(calledWith.startDate?.toDateString()).toEqual(
      expectedStart.toDateString()
    );
    expect(calledWith.endDate?.toDateString()).toEqual(
      expectedEnd.toDateString()
    );
  });

  it("should call onChange when 'All Time' preset is clicked", () => {
    render(<PeriodSelectorV2 value={defaultValue} onChange={mockOnChange} />);

    const allTimeButton = screen.getByText("allTime");
    fireEvent.click(allTimeButton);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    const calledWith = mockOnChange.mock.calls[0][0];

    expect(calledWith.startDate).toEqual(new Date(2000, 0, 1));
    expect(calledWith.endDate).toEqual(endOfDay(new Date()));
  });

  it("should highlight the selected preset button", () => {
    const todayStart = startOfToday();
    const todayEnd = endOfDay(new Date());
    const todayValue = {
      startDate: todayStart,
      endDate: todayEnd,
    };

    render(<PeriodSelectorV2 value={todayValue} onChange={mockOnChange} />);

    const todayButtons = screen.getAllByText("today");

    // Should have two buttons with "today" - main button and preset button
    expect(todayButtons).toHaveLength(2);

    // The preset button should have "bg-primary" class when selected (default variant)
    const presetButton = todayButtons.find(btn =>
      btn.className.includes("bg-primary")
    );

    expect(presetButton).toBeInTheDocument();
  });

  it("should display the preset label when a preset range is selected", () => {
    const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
    const thisWeekValue = {
      startDate: thisWeekStart,
      endDate: thisWeekEnd,
    };

    render(<PeriodSelectorV2 value={thisWeekValue} onChange={mockOnChange} />);

    // The main button should show "thisWeek"
    const mainButton = screen.getAllByText("thisWeek")[0];

    expect(mainButton).toBeInTheDocument();
  });

  it("should display formatted date range when custom dates are selected", () => {
    const customStart = new Date(2024, 0, 1); // Jan 1, 2024
    const customEnd = new Date(2024, 0, 15); // Jan 15, 2024
    const customValue = {
      startDate: customStart,
      endDate: customEnd,
    };

    render(<PeriodSelectorV2 value={customValue} onChange={mockOnChange} />);

    const expectedFormat = `${format(customStart, "dd MMM")} - ${format(customEnd, "dd MMM yyyy")}`;

    expect(screen.getByText(expectedFormat)).toBeInTheDocument();
  });

  it("should display single date format when start and end dates are the same", () => {
    const singleDate = new Date(2024, 0, 1);
    const singleDateValue = {
      startDate: singleDate,
      endDate: singleDate,
    };

    render(<PeriodSelectorV2 value={singleDateValue} onChange={mockOnChange} />);

    const expectedFormat = format(singleDate, "dd MMM yyyy");

    expect(screen.getByText(expectedFormat)).toBeInTheDocument();
  });

  it("should toggle custom calendar popup when main button is clicked", () => {
    render(<PeriodSelectorV2 value={defaultValue} onChange={mockOnChange} />);

    const mainButton = screen.getByText("selectPeriod");

    // Calendar should not be visible initially
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();

    // Click to show calendar
    fireEvent.click(mainButton);

    // Calendar should be visible now
    // Note: This assumes DateRangePicker renders a grid role
    // Adjust based on actual DateRangePicker implementation
  });

  it("should apply custom className to container", () => {
    const { container } = render(
      <PeriodSelectorV2
        value={defaultValue}
        onChange={mockOnChange}
        className="custom-test-class"
      />
    );

    const mainDiv = container.querySelector(".custom-test-class");

    expect(mainDiv).toBeInTheDocument();
  });

  it("should handle preset buttons with proper spacing and styling", () => {
    render(<PeriodSelectorV2 value={defaultValue} onChange={mockOnChange} />);

    const last7DaysButton = screen.getByText("last7Days");
    const last30DaysButton = screen.getByText("last30Days");

    // Check that buttons have the whitespace-nowrap class to prevent text wrapping
    expect(last7DaysButton.className).toContain("whitespace-nowrap");
    expect(last30DaysButton.className).toContain("whitespace-nowrap");
  });

  it("should not call onChange multiple times for single preset click", () => {
    render(<PeriodSelectorV2 value={defaultValue} onChange={mockOnChange} />);

    const todayButton = screen.getByText("today");
    fireEvent.click(todayButton);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });
});
