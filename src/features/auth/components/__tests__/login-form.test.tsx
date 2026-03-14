import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "../login-form";

// Mock external dependencies
vi.mock("convex/react", () => ({
  useMutation: () => vi.fn(),
}));

vi.mock("jotai", () => ({
  atom: () => ({}) as never,
  useSetAtom: () => vi.fn(),
  useAtomValue: () => null,
}));

vi.mock("jotai/utils", () => ({
  atomWithStorage: () => ({}) as never,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
    push: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
});

function getSubmitButton(): HTMLButtonElement {
  const button = document.querySelector(
    'button[type="submit"]',
  ) as HTMLButtonElement;
  if (!button) throw new Error("Submit button not found");
  return button;
}

describe("LoginForm", () => {
  it("renders the email and password fields", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("renders the submit button with correct text", () => {
    render(<LoginForm />);

    const submitButton = getSubmitButton();
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveTextContent("Sign in");
  });

  it("renders the welcome heading and description", () => {
    render(<LoginForm />);

    expect(screen.getByText("Welcome back")).toBeInTheDocument();
    expect(
      screen.getByText("Sign in to manage your logistics documents"),
    ).toBeInTheDocument();
  });

  it("shows validation errors when submitting empty form", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(getSubmitButton());

    expect(
      await screen.findByText("Please enter a valid email address"),
    ).toBeInTheDocument();
    expect(await screen.findByText("Password is required")).toBeInTheDocument();
  });

  it("allows typing in the email and password fields", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "securepass");

    expect(emailInput).toHaveValue("test@example.com");
    expect(passwordInput).toHaveValue("securepass");
  });
});
