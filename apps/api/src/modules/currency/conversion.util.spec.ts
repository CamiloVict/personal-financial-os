import { describe, expect, it } from 'vitest';
import { utcMonthStart } from './conversion.service';

describe('conversion.service FX helpers', () => {
  it('utcMonthStart alinea al primer día UTC del mes', () => {
    const d = new Date('2024-03-15T12:00:00.000Z');
    const m = utcMonthStart(d);
    expect(m.toISOString()).toBe('2024-03-01T00:00:00.000Z');
  });
});
