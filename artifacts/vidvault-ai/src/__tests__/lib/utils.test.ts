import { describe, it, expect } from "vitest";
import { cn } from "../../lib/utils";

describe("cn", () => {
  it("returns a single class name unchanged", () => {
    expect(cn("text-red-500")).toBe("text-red-500");
  });

  it("joins multiple class names", () => {
    const result = cn("flex", "items-center", "gap-2");
    expect(result).toContain("flex");
    expect(result).toContain("items-center");
    expect(result).toContain("gap-2");
  });

  it("handles conditional classes (truthy)", () => {
    const isActive = true;
    const result = cn("base-class", isActive && "active");
    expect(result).toContain("active");
  });

  it("omits conditional classes (falsy)", () => {
    const isActive = false;
    const result = cn("base-class", isActive && "active");
    expect(result).not.toContain("active");
  });

  it("merges conflicting Tailwind classes (last one wins)", () => {
    // tailwind-merge resolves conflicts; p-4 overrides p-2
    const result = cn("p-2", "p-4");
    expect(result).toBe("p-4");
    expect(result).not.toContain("p-2");
  });

  it("handles undefined and null values gracefully", () => {
    const result = cn("base", undefined, null as unknown as string);
    expect(result).toBe("base");
  });

  it("handles empty string inputs", () => {
    const result = cn("base", "");
    expect(result).toBe("base");
  });

  it("handles object syntax for conditional classes", () => {
    const result = cn({ "font-bold": true, "font-normal": false });
    expect(result).toBe("font-bold");
    expect(result).not.toContain("font-normal");
  });

  it("handles array syntax", () => {
    const result = cn(["flex", "items-center"]);
    expect(result).toContain("flex");
    expect(result).toContain("items-center");
  });

  it("returns empty string with no arguments", () => {
    expect(cn()).toBe("");
  });
});
