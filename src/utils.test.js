import { describe, it, expect } from "vitest";
import { calcStreak, todayHours } from "./utils.js";

describe("calcStreak", () => {
  it("returns 0 for empty log", () => {
    expect(calcStreak([], "2026-06-29")).toBe(0);
  });

  it("returns 0 when last logged day has a gap before today", () => {
    expect(calcStreak(["2026-06-25", "2026-06-26"], "2026-06-29")).toBe(0);
  });

  it("counts a streak that includes today", () => {
    expect(calcStreak(["2026-06-27", "2026-06-28", "2026-06-29"], "2026-06-29")).toBe(3);
  });

  it("counts a streak ending yesterday when today is not yet logged", () => {
    expect(calcStreak(["2026-06-26", "2026-06-27", "2026-06-28"], "2026-06-29")).toBe(3);
  });

  it("stops at a gap in the middle", () => {
    // gap on 2026-06-27; streak should be 2 (Jun 28 + Jun 29)
    expect(calcStreak(["2026-06-25", "2026-06-26", "2026-06-28", "2026-06-29"], "2026-06-29")).toBe(2);
  });

  it("returns 1 for a single-day streak (today only)", () => {
    expect(calcStreak(["2026-06-29"], "2026-06-29")).toBe(1);
  });

  it("returns 1 for a single-day streak (yesterday only, today not logged)", () => {
    expect(calcStreak(["2026-06-28"], "2026-06-29")).toBe(1);
  });

  it("ignores duplicate date entries", () => {
    // Two entries for the same day should count as one streak day
    expect(calcStreak(["2026-06-28", "2026-06-28", "2026-06-29"], "2026-06-29")).toBe(2);
  });

  it("returns 0 when only a distant past date is logged", () => {
    expect(calcStreak(["2026-06-01"], "2026-06-29")).toBe(0);
  });

  it("handles a month boundary correctly", () => {
    // Streak across May → June boundary
    expect(calcStreak(["2026-05-30", "2026-05-31", "2026-06-01"], "2026-06-01")).toBe(3);
  });

  it("handles a year boundary correctly", () => {
    expect(calcStreak(["2025-12-31", "2026-01-01"], "2026-01-01")).toBe(2);
  });
});

describe("todayHours", () => {
  it("sums hours for a given date", () => {
    const log = [
      { date: "2026-06-29", hours: 1.5 },
      { date: "2026-06-29", hours: 2 },
      { date: "2026-06-28", hours: 3 },
    ];
    expect(todayHours(log, "2026-06-29")).toBe(3.5);
  });

  it("returns 0 when no sessions exist for the date", () => {
    const log = [{ date: "2026-06-28", hours: 2 }];
    expect(todayHours(log, "2026-06-29")).toBe(0);
  });

  it("returns 0 for empty log", () => {
    expect(todayHours([], "2026-06-29")).toBe(0);
  });

  it("handles string-typed hours", () => {
    const log = [{ date: "2026-06-29", hours: "1.5" }];
    expect(todayHours(log, "2026-06-29")).toBe(1.5);
  });

  it("ignores entries from other dates", () => {
    const log = [
      { date: "2026-06-27", hours: 5 },
      { date: "2026-06-29", hours: 1 },
    ];
    expect(todayHours(log, "2026-06-29")).toBe(1);
  });
});
