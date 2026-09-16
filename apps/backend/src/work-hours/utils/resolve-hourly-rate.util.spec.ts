import { resolveHourlyRate } from './resolve-hourly-rate.util';

describe('resolveHourlyRate', () => {
  it('uses the project rate when present', () => {
    expect(resolveHourlyRate({ hourlyRate: 100 }, { hourlyRate: 50 })).toBe(
      100,
    );
  });

  it('falls back to the client rate when the project has none', () => {
    expect(resolveHourlyRate(undefined, { hourlyRate: 50 })).toBe(50);
    expect(resolveHourlyRate({ hourlyRate: null }, { hourlyRate: 50 })).toBe(
      50,
    );
  });

  it('falls back to 0 when neither project nor client have a rate', () => {
    expect(resolveHourlyRate()).toBe(0);
    expect(resolveHourlyRate(undefined, undefined)).toBe(0);
    expect(resolveHourlyRate({ hourlyRate: null }, { hourlyRate: null })).toBe(
      0,
    );
  });

  it('treats a project rate of 0 as an explicit value, not a fallback trigger', () => {
    expect(resolveHourlyRate({ hourlyRate: 0 }, { hourlyRate: 50 })).toBe(0);
  });
});
