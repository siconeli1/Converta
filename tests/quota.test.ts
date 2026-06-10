import { afterEach, describe, expect, it } from "vitest";
import {
  buildConversionQuotaStatus,
  getQuotaConfig,
  getQuotaWindow,
} from "@/lib/conversion/quota";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("conversion quota", () => {
  it("uses the free-tier defaults", () => {
    delete process.env.CONVERSION_DAILY_GLOBAL_LIMIT;
    delete process.env.CONVERSION_DAILY_USER_LIMIT;
    delete process.env.CONVERSION_COOLDOWN_SECONDS;

    expect(getQuotaConfig()).toEqual({
      globalLimit: 10,
      userLimit: 2,
      cooldownSeconds: 60,
    });
  });

  it("resets the quota at the next UTC day", () => {
    expect(getQuotaWindow(new Date("2026-06-10T22:30:00.000Z"))).toEqual({
      day: "2026-06-10",
      resetAt: new Date("2026-06-11T00:00:00.000Z"),
    });
  });

  it("blocks an account after its personal daily limit", () => {
    const status = buildConversionQuotaStatus(
      4,
      2,
      null,
      new Date("2026-06-10T12:00:00.000Z"),
    );

    expect(status).toMatchObject({
      globalRemaining: 6,
      userRemaining: 0,
      remaining: 0,
      canConvert: false,
      blockedReason: "USER_LIMIT",
    });
  });

  it("enforces the cooldown between attempts", () => {
    const status = buildConversionQuotaStatus(
      1,
      1,
      new Date("2026-06-10T12:00:00.000Z"),
      new Date("2026-06-10T12:00:30.000Z"),
    );

    expect(status).toMatchObject({
      canConvert: false,
      blockedReason: "RATE_LIMIT",
      nextAllowedAt: "2026-06-10T12:01:00.000Z",
    });
  });
});
