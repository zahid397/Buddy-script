import { describe, expect, it } from 'vitest';
import { pickWeightedEvent, type DemoEventType } from './demo-engine';

// Mirrors the WEIGHTS table in demo-engine.ts. Total is 130, not 100 — the
// original 8-type/100-weight spec pool was extended additively with 6 more
// module event types at weight 5 each, rather than hand-rebalancing the
// original percentages.
const WEIGHTS: Record<DemoEventType, number> = {
  POST: 15,
  LIKE: 20,
  COMMENT: 15,
  FRIEND_REQUEST: 10,
  FRIEND_ACCEPT: 10,
  MESSAGE: 15,
  MESSAGE_REPLY: 10,
  EVENT_ATTEND: 5,
  LEARN_SUGGEST: 5,
  LEARN_COMPLETE: 5,
  SAVE_POST: 5,
  GROUP_POST: 5,
  GROUP_JOIN: 5,
  GAME_LEADERBOARD: 5,
};
const TOTAL_WEIGHT = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);

describe('pickWeightedEvent', () => {
  it('is deterministic for a given rng and picks events proportional to their weight', () => {
    const counts: Record<DemoEventType, number> = Object.fromEntries(
      Object.keys(WEIGHTS).map((k) => [k, 0])
    ) as Record<DemoEventType, number>;

    // Simple seeded LCG so this test never flakes.
    let seed = 42;
    const seededRng = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };

    const iterations = 20000;
    for (let i = 0; i < iterations; i++) {
      counts[pickWeightedEvent(seededRng)]++;
    }

    // Every event type should appear roughly at its expected weight (within
    // a generous tolerance since this is a statistical check, not exact).
    for (const [type, weight] of Object.entries(WEIGHTS)) {
      expect(counts[type as DemoEventType] / iterations).toBeCloseTo(weight / TOTAL_WEIGHT, 1);
    }

    // LIKE (highest weight) should fire more often than any weight-5 type.
    expect(counts.LIKE).toBeGreaterThan(counts.EVENT_ATTEND);
    expect(counts.LIKE).toBeGreaterThan(counts.GAME_LEADERBOARD);
  });

  it('always returns the first event type when rng returns 0', () => {
    expect(pickWeightedEvent(() => 0)).toBe('POST');
  });

  it('always returns the last event type when rng returns just under 1', () => {
    expect(pickWeightedEvent(() => 0.9999999)).toBe('GAME_LEADERBOARD');
  });
});
