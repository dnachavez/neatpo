"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { useSetAtom } from "jotai";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { loginSchema, type LoginFormData } from "../types/login-schema";
import { authUserAtom } from "../stores/auth-atoms";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const loginMutation = useMutation(api.auth.login);
  const setAuthUser = useSetAtom(authUserAtom);
  const router = useRouter();
  const [loginError, setLoginError] = useState<string | null>(null);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  async function onSubmit(data: LoginFormData) {
    setLoginError(null);

    try {
      const result = await loginMutation({
        email: data.email,
        password: data.password,
      });

      if (!result.success) {
        setLoginError(result.error);
        return;
      }

      setAuthUser(result.user);
      router.replace("/");
    } catch {
      setLoginError("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-neutral-100 px-4">
      <Card className="w-full max-w-sm border-neutral-200 bg-white shadow-none">
        <CardHeader className="space-y-3 pb-2">
          <div className="space-y-1">
            <CardTitle className="font-serif text-2xl font-normal tracking-tight">
              Welcome back
            </CardTitle>
            <CardDescription className="font-sans text-sm text-neutral-500">
              Sign in to manage your logistics documents
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {loginError && (
              <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {loginError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="font-sans text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                className={cn(
                  "border-neutral-200 bg-white font-sans",
                  errors.email && "border-destructive"
                )}
                {...register("email")}
              />
              {errors.email && (
                <p className="font-sans text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="font-sans text-sm font-medium"
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                className={cn(
                  "border-neutral-200 bg-white font-sans",
                  errors.password && "border-destructive"
                )}
                {...register("password")}
              />
              {errors.password && (
                <p className="font-sans text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full cursor-pointer bg-black font-sans text-white hover:bg-neutral-800"
            >
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center font-sans text-xs text-neutral-400">
            NeatPO — Logistics Document Automation
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
