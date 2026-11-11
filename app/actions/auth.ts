"use server";

import { redirect } from "next/navigation";
import { getSupabaseConfig } from "../../lib/supabase/config";
import { createClient } from "../../lib/supabase/server";

export type AuthFormState = {
  error?: string;
  message?: string;
  mode?: string;
};

export async function authenticate(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const mode = String(formData.get("mode") ?? "login");
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!getSupabaseConfig()) {
    return {
      error: "Add the Supabase URL and publishable key to .env.local, then restart the app.",
      mode,
    };
  }

  if (!email || !password) {
    return { error: "Enter your email and password.", mode };
  }

  const supabase = await createClient();

  if (!supabase) {
    return { error: "Supabase is not configured.", mode };
  }

  if (mode === "signup") {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      return { error: error.message, mode };
    }

    if (data.session) {
      redirect("/");
    }

    return {
      message: "Check your email to confirm your account, then sign in.",
      mode,
    };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Wrong email or password", mode };
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/login");
}