"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { signIn, signOut } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { AuthError } from "next-auth";

export type AuthActionResult = {
  success: boolean;
  error?: string;
};

export async function registerUser(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").toLowerCase().trim();
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!name) {
    return { success: false, error: "Please enter your full name." };
  }

  if (!email || !email.includes("@")) {
    return { success: false, error: "Please provide a valid email address." };
  }

  if (!password || password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters long." };
  }

  if (password !== confirmPassword) {
    return { success: false, error: "Passwords do not match." };
  }

  try {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      return { success: false, error: "An account with this email already exists." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // If no users exist yet, the first registered user becomes 'admin', otherwise 'pending'
    const existingUsers = await db.select({ id: users.id }).from(users).limit(1);
    const role = existingUsers.length === 0 ? "admin" : "pending";

    await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
      role,
    });

    return { success: true };
  } catch (err: any) {
    console.error("Registration error:", err);
    return { success: false, error: "Failed to create account. Please try again." };
  }
}

export async function loginWithCredentials(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = String(formData.get("email") || "").toLowerCase().trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { success: false, error: "Please enter both email and password." };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
    return { success: true };
  } catch (error: any) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { success: false, error: "Invalid email or password." };
        default:
          return { success: false, error: "Authentication failed. Please try again." };
      }
    }
    // Next.js redirect throws a NEXT_REDIRECT error which must be rethrown
    throw error;
  }
}

export async function loginWithOAuth(provider: "google" | "github") {
  await signIn(provider, { redirectTo: "/" });
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
