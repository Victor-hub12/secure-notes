import type { Metadata } from "next";
import LoginForm from "./login-form";
import { getSupabaseConfig } from "../../lib/supabase/config";

export const metadata: Metadata = {
  title: "Sign in | Secure Notes",
};

export default function LoginPage() {
  return <LoginForm configured={Boolean(getSupabaseConfig())} />;
}