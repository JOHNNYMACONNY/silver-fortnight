import { calculateLevel, LEVEL_THRESHOLDS } from '../reputation';
import { vi } from 'vitest';

describe('calculateLevel', () => {
  it('returns level 1 for 0 XP', () => {
    expect(calculateLevel(0)).toBe(1);
  });

  it('returns level 1 for undefined XP', () => {
    expect(calculateLevel(undefined as unknown as number)).toBe(1);
  });

  it('returns level 1 for negative XP', () => {
    expect(calculateLevel(-100)).toBe(1);
  });

  it('calculates correct level for XP between thresholds', () => {
    expect(calculateLevel(150)).toBe(2); // Between level 2 and 3 threshold
  });

  it('calculates correct level for XP at threshold', () => {
    LEVEL_THRESHOLDS.forEach((threshold, index) => {
      if (index > 0) { // Skip level 0 threshold
        expect(calculateLevel(threshold)).toBe(index);
      }
    });
  });

  it('maintains level progression for high XP values', () => {
    const highXP = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 1000;
    const level = calculateLevel(highXP);
    expect(level).toBe(LEVEL_THRESHOLDS.length - 1);
  });
});