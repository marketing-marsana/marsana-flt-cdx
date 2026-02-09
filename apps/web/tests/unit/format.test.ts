import { describe, expect, it } from "vitest";
import { formatKilometers } from "../../lib/format";

describe("formatKilometers", () => {
  it("formats positive numbers with km", () => {
    expect(formatKilometers(45320)).toBe("45,320 km");
  });

  it("clamps negative numbers to zero", () => {
    expect(formatKilometers(-5)).toBe("0 km");
  });
});
