import { describe, expect, it } from "vitest";
import { canTransition } from "@/lib/conversion/status";

describe("conversion status transitions", () => {
  it("allows the normal processing flow", () => {
    expect(canTransition("uploading", "queued")).toBe(true);
    expect(canTransition("queued", "processing")).toBe(true);
    expect(canTransition("processing", "completed")).toBe(true);
  });
  it("prevents duplicate and invalid processing", () => {
    expect(canTransition("processing", "processing")).toBe(false);
    expect(canTransition("completed", "processing")).toBe(false);
    expect(canTransition("failed", "queued")).toBe(true);
  });
});
