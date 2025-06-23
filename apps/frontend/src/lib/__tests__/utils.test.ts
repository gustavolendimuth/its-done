import { formatTimeAgo, formatHoursToHHMM } from "../utils";

// Mock da função de tradução (já namespaced para workHours)
const mockT = (key: string, values?: any): string => {
  const translations: Record<string, string> = {
    "timeAgo.justNow": "just now",
    "timeAgo.minute": "1 minute",
    "timeAgo.minutes": `${values?.count} minutes`,
    "timeAgo.hour": "1 hour",
    "timeAgo.hours": `${values?.count} hours`,
    "timeAgo.day": "1 day",
    "timeAgo.days": `${values?.count} days`,
    "timeAgo.week": "1 week",
    "timeAgo.weeks": `${values?.count} weeks`,
    "timeAgo.month": "1 month",
    "timeAgo.months": `${values?.count} months`,
    "timeAgo.year": "1 year",
    "timeAgo.years": `${values?.count} years`,
  };
  return translations[key] || key;
};

describe("formatTimeAgo", () => {
  const now = new Date("2024-01-15T12:00:00Z");

  beforeAll(() => {
    // Mock Date.now() para ter resultados consistentes
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it("should return 'just now' for very recent dates", () => {
    const recentDate = new Date(now.getTime() - 30 * 1000); // 30 segundos atrás
    expect(formatTimeAgo(recentDate, mockT)).toBe("just now");
  });

  it("should return '1 minute' for 1 minute ago", () => {
    const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000);
    expect(formatTimeAgo(oneMinuteAgo, mockT)).toBe("1 minute");
  });

  it("should return 'X minutes' for multiple minutes", () => {
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    expect(formatTimeAgo(fiveMinutesAgo, mockT)).toBe("5 minutes");
  });

  it("should return '1 hour' for 1 hour ago", () => {
    const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
    expect(formatTimeAgo(oneHourAgo, mockT)).toBe("1 hour");
  });

  it("should return '1 day' for 1 day ago", () => {
    const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
    expect(formatTimeAgo(oneDayAgo, mockT)).toBe("1 day");
  });

  it("should return 'X days' for multiple days", () => {
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    expect(formatTimeAgo(threeDaysAgo, mockT)).toBe("3 days");
  });
});

describe("formatHoursToHHMM", () => {
  it("should format whole hours correctly", () => {
    expect(formatHoursToHHMM(8)).toBe("08:00");
    expect(formatHoursToHHMM(1)).toBe("01:00");
  });

  it("should format decimal hours correctly", () => {
    expect(formatHoursToHHMM(1.5)).toBe("01:30");
    expect(formatHoursToHHMM(8.25)).toBe("08:15");
  });

  it("should handle edge cases", () => {
    expect(formatHoursToHHMM(0)).toBe("00:00");
    expect(formatHoursToHHMM(NaN)).toBe("00:00");
  });
});
