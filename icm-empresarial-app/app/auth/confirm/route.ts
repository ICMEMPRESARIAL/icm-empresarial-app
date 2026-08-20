import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { getSafeAuthErrorDetails } from "@/lib/auth/safe-auth-error";
import { createClient } from "@/lib/supabase/server";

function getSafeNextUrl(request: NextRequest, fallbackPath: string) {
  const next = request.nextUrl.searchParams.get("next");
  if (!next) {
    return new URL(fallbackPath, request.url);
  }

  try {
    const url = new URL(next, request.url);
    if (url.origin !== request.nextUrl.origin) {
      return new URL(fallbackPath, request.url);
    }

    return url;
  } catch {
    return new URL(fallbackPath, request.url);
  }
}

function redirectToLoginError(request: NextRequest, errorCode: string) {
  return NextResponse.redirect(
    new URL(`/login?error=${errorCode}`, request.url)
  );
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const fallbackPath =
    type === "invite" ? "/update-password?invite=1" : "/dashboard";
  const nextUrl = getSafeNextUrl(request, fallbackPath);
  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("ICM auth confirm failure", {
        flow: "exchange_code_for_session",
        ...getSafeAuthErrorDetails(error)
      });

      return redirectToLoginError(request, "invite_expired");
    }

    return NextResponse.redirect(nextUrl);
  }

  if (!tokenHash || !type) {
    console.error("ICM auth confirm failure", {
      flow: "missing_token_hash_or_type",
      hasTokenHash: Boolean(tokenHash),
      hasType: Boolean(type)
    });

    return redirectToLoginError(request, "invite_invalid");
  }

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type
  });

  if (error) {
    console.error("ICM auth confirm failure", {
      flow: "verify_otp",
      type,
      ...getSafeAuthErrorDetails(error)
    });

    return redirectToLoginError(request, "invite_expired");
  }

  if (type === "invite") {
    return NextResponse.redirect(nextUrl);
  }

  return NextResponse.redirect(nextUrl);
}
