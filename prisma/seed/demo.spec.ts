import { describe, expect, it } from "vitest";
import { isDemoSeedEnabled } from "./demo/index.js";

describe("demo seed guard", () => {
  it("is enabled outside production", () => {
    expect(isDemoSeedEnabled({ NODE_ENV: "development" })).toBe(true);
    expect(isDemoSeedEnabled({ NODE_ENV: "test" })).toBe(true);
    expect(isDemoSeedEnabled({})).toBe(true);
  });

  it("is disabled in production unless explicitly opted in", () => {
    expect(isDemoSeedEnabled({ NODE_ENV: "production" })).toBe(false);
    expect(
      isDemoSeedEnabled({ NODE_ENV: "production", SEED_DEMO: "true" }),
    ).toBe(true);
  });
});
