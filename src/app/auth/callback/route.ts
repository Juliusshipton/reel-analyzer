import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL("/dashboard", origin));
    }

    console.error("Supabase OAuth callback failed:", error);
  }

  const tokenHash = searchParams.get("token_hash");
  if (tokenHash && searchParams.get("type") === "signup") {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "signup",
    });

    if (!error) {
      return NextResponse.redirect(new URL("/dashboard", origin));
    }

    console.error("Supabase email confirmation failed:", error);
  }

  return NextResponse.redirect(
    new URL("/?error=auth_callback_failed", origin),
  );
}
