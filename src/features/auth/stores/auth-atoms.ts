"use client";

import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "staff";
};

export const authUserAtom = atomWithStorage<AuthUser | null>(
  "neatpo_auth_user",
  null,
);

export const isAuthenticatedAtom = atom((get) => get(authUserAtom) !== null);
