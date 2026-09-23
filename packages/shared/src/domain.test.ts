import { describe, expect, it } from "vitest";
import { addCents, formatBrlFromCents } from "./money.js";
import { canTransitionOrder, transitionOrder } from "./order-status.js";
import { canApplyGenerationStatus } from "./generation-status.js";
import { interpolatePrompt } from "./prompt.js";

describe("money", () => {
  it("formats cents without float math", () => {
    expect(formatBrlFromCents(299)).toBe("R$ 2,99");
    expect(formatBrlFromCents(0)).toBe("R$ 0,00");
    expect(addCents(299, 10)).toBe(309);
  });

  it("rejects non-integer amounts", () => {
    expect(() => formatBrlFromCents(2.99)).toThrow("INVALID_AMOUNT_CENTS");
  });
});

describe("order transitions", () => {
  it("allows the happy path", () => {
    expect(transitionOrder("CREATED", "AWAITING_PAYMENT")).toBe("AWAITING_PAYMENT");
    expect(transitionOrder("AWAITING_PAYMENT", "PAID")).toBe("PAID");
    expect(transitionOrder("PAID", "QUEUED")).toBe("QUEUED");
    expect(transitionOrder("QUEUED", "PROCESSING")).toBe("PROCESSING");
    expect(transitionOrder("PROCESSING", "GENERATION_COMPLETED")).toBe("GENERATION_COMPLETED");
  });

  it("blocks terminal regression", () => {
    expect(canTransitionOrder("COMPLETED", "PROCESSING")).toBe(false);
    expect(() => transitionOrder("COMPLETED", "PROCESSING")).toThrow(
      "INVALID_ORDER_TRANSITION:COMPLETED->PROCESSING",
    );
  });
});

describe("generation status", () => {
  it("ignores out-of-order webhooks after success", () => {
    expect(canApplyGenerationStatus("SUCCEEDED", "PROCESSING")).toBe(false);
    expect(canApplyGenerationStatus("PROCESSING", "SUCCEEDED")).toBe(true);
    expect(canApplyGenerationStatus("SUCCEEDED", "SUCCEEDED")).toBe(false);
  });
});

describe("prompt interpolation", () => {
  it("replaces known tokens and strips braces from values", () => {
    const result = interpolatePrompt("Use {{USER_IMAGE}} in {{SCENARIO}}", {
      USER_IMAGE: "ref-1",
      SCENARIO: "studio {{inject}}",
    });
    expect(result).toBe("Use ref-1 in studio inject");
  });
});
