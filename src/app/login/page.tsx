import type { Metadata } from "next";
import { LoginForm } from "@/features/auth";

export const metadata: Metadata = {
  title: "Sign In — NeatPO",
  description:
    "Sign in to NeatPO, the logistics document automation platform for supply chain teams.",
};

export default function LoginPage() {
  return <LoginForm />;
}
