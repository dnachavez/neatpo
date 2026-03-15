import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useIsMobile } from "../use-mobile";

let listeners: Array<() => void> = [];

function createMockMatchMedia(matches: boolean) {
  return vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: (_: string, cb: () => void) => listeners.push(cb),
    removeEventListener: (_: string, cb: () => void) => {
      listeners = listeners.filter((l) => l !== cb);
    },
  }));
}

beforeEach(() => {
  listeners = [];
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("useIsMobile", () => {
  it("returns true when window width is below 768", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      value: 500,
    });
    window.matchMedia = createMockMatchMedia(true);

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("returns false when window width is 768 or above", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      value: 1024,
    });
    window.matchMedia = createMockMatchMedia(false);

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("updates when window resizes across the breakpoint", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      value: 1024,
    });
    window.matchMedia = createMockMatchMedia(false);

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    // Simulate resize to mobile
    act(() => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        value: 500,
      });
      listeners.forEach((cb) => cb());
    });

    expect(result.current).toBe(true);
  });
});
