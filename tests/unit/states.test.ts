import { describe, expect, it } from "vitest";
import { US_STATES, getStateName, getStateBySlug } from "@/data/states";

describe("US_STATES", () => {
  it("has exactly 50 states", () => {
    expect(US_STATES).toHaveLength(50);
  });

  it("every state has a code, name, and slug", () => {
    for (const state of US_STATES) {
      expect(state.code).toBeTruthy();
      expect(state.name).toBeTruthy();
      expect(state.slug).toBeTruthy();
    }
  });

  it("all state codes are 2 characters", () => {
    for (const state of US_STATES) {
      expect(state.code).toHaveLength(2);
    }
  });

  it("all slugs are lowercase and URL-safe", () => {
    for (const state of US_STATES) {
      expect(state.slug).toBe(state.slug.toLowerCase());
      expect(state.slug).toMatch(/^[a-z-]+$/);
    }
  });

  it("state codes are unique", () => {
    const codes = US_STATES.map((s) => s.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe("getStateName", () => {
  it("returns the state name for a valid code", () => {
    expect(getStateName("CA")).toBe("California");
    expect(getStateName("TX")).toBe("Texas");
    expect(getStateName("NY")).toBe("New York");
  });

  it("returns the code itself for an unknown state", () => {
    expect(getStateName("XX")).toBe("XX");
  });
});

describe("getStateBySlug", () => {
  it("returns the state for a valid slug", () => {
    expect(getStateBySlug("california")?.code).toBe("CA");
    expect(getStateBySlug("new-york")?.code).toBe("NY");
  });

  it("returns undefined for an unknown slug", () => {
    expect(getStateBySlug("nowhere")).toBeUndefined();
  });
});
