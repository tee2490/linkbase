"use server";

import { signOut } from "@/lib/auth/auth";

export async function signOutUser() {
  await signOut({ redirectTo: "/" });
}
