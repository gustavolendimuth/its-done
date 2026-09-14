import { roundHoursToIncrement } from './round-hours.util';

describe('roundHoursToIncrement()', () => {
  it('returns the input unchanged when incrementMinutes is 0', () => {
    expect(roundHoursToIncrement(1.37, 0)).toBe(1.37);
  });

  it.each([
    [1 + 1 / 60, 5, 1.0],
    [1 + 3 / 60, 5, 1.08],
    [1.37, 10, 1.33],
    [1.37, 15, 1.25],
    [1.37, 30, 1.5],
    [1.37, 60, 1.0],
  ])(
    'rounds %f to the nearest %i-minute increment as %f',
    (hours, incrementMinutes, expected) => {
      expect(roundHoursToIncrement(hours, incrementMinutes)).toBeCloseTo(
        expected,
        2,
      );
    },
  );

  it('rounds a tie exactly halfway between two multiples up (Math.round semantics)', () => {
    // 0.5h = 30min, exactly halfway between 0 and 60 minutes
    expect(roundHoursToIncrement(0.5, 60)).toBe(1);
  });

  it('rounding an already-rounded value is idempotent', () => {
    const increments = [5, 10, 15, 30, 60];
    const samples = [0.12, 0.37, 1.0, 1.37, 2.94, 7.63];

    for (const increment of increments) {
      for (const sample of samples) {
        const once = roundHoursToIncrement(sample, increment);
        const twice = roundHoursToIncrement(once, increment);
        expect(twice).toBe(once);
      }
    }
  });
});
