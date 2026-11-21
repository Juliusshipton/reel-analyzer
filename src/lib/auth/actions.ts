"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthFormState =
  | { error: string }
  | { success: string }
  | undefined;

export async function signIn(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function signUp(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const origin = (await headers()).get("origin");
  if (!origin) {
    return {
      error: "Unable to determine the confirmation URL. Please try again.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: new URL("/auth/callback", origin).toString(),
    },
  });
  if (error) {
    return { error: error.message };
  }

  if (data.session) {
    redirect("/dashboard");
  }

  return {
    success: "Check your email for a confirmation link to finish creating your account.",
  };
}

export async function signInWithGoogle(
  _prevState: AuthFormState,
  _formData: FormData,
): Promise<AuthFormState> {
  const origin = (await headers()).get("origin");
  if (!origin) {
    return { error: "Unable to determine the sign-in URL. Please try again." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: new URL("/auth/callback", origin).toString(),
    },
  });

  if (error) {
    return { error: error.message };
  }
  if (!data.url) {
    return { error: "Google sign-in could not be started. Please try again." };
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
