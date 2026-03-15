import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { AuthGuard } from "../auth-guard";

const mockReplace = vi.fn();

vi.mock("jotai", () => ({
  atom: () => ({}) as never,
  useAtomValue: vi.fn(() => false),
}));

vi.mock("jotai/utils", () => ({
  atomWithStorage: () => ({}) as never,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AuthGuard", () => {
  it("shows loading state when not authenticated", () => {
    render(
      <AuthGuard>
        <div>Protected content</div>
      </AuthGuard>,
    );

    expect(screen.getByText("Loading…")).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("renders children when authenticated", async () => {
    const { useAtomValue } = await import("jotai");
    vi.mocked(useAtomValue).mockReturnValue(true);

    render(
      <AuthGuard>
        <div>Protected content</div>
      </AuthGuard>,
    );

    expect(screen.getByText("Protected content")).toBeInTheDocument();
    expect(screen.queryByText("Loading…")).not.toBeInTheDocument();
  });
});
