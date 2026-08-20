import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { getSafeAuthErrorDetails } from "@/lib/auth/safe-auth-error";

function getPublicSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Faltan variables publicas de Supabase.");
  }

  return { supabaseKey, supabaseUrl };
}

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

function applySupabaseResponseHeaders(
  response: NextResponse,
  headers: Record<string, string>
) {
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const fallbackPath =
    type === "invite" ? "/update-password?invite=1" : "/dashboard";
  const nextUrl = getSafeNextUrl(request, fallbackPath);
  const redirectResponse = NextResponse.redirect(nextUrl);
  let supabaseCookieWriteCount = 0;
  let supabaseHeaderWriteCount = 0;
  const { supabaseKey, supabaseUrl } = getPublicSupabaseEnv();
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headersToSet) {
        supabaseCookieWriteCount += cookiesToSet.length;
        supabaseHeaderWriteCount += Object.keys(headersToSet).length;

        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          redirectResponse.cookies.set(name, value, options);
        });

        applySupabaseResponseHeaders(redirectResponse, headersToSet);
      }
    }
  });

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("ICM auth confirm failure", {
        flow: "exchange_code_for_session",
        ...getSafeAuthErrorDetails(error)
      });

      return redirectToLoginError(request, "invite_expired");
    }

    return redirectResponse;
  }

  if (!tokenHash || !type) {
    console.error("ICM auth confirm failure", {
      flow: "missing_token_hash_or_type",
      hasTokenHash: Boolean(tokenHash),
      hasType: Boolean(type)
    });

    return redirectToLoginError(request, "invite_invalid");
  }

  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type
  });

  console.info("ICM auth confirm verifyOtp result", {
    flow: "verify_otp",
    type,
    hasSession: Boolean(data.session?.access_token),
    hasUser: Boolean(data.user),
    error: error ? getSafeAuthErrorDetails(error) : null,
    responseCookieCount: redirectResponse.cookies.getAll().length,
    responseHeaderCount: Array.from(redirectResponse.headers.keys()).length,
    supabaseCookieWriteCount,
    supabaseHeaderWriteCount
  });

  if (error) {
    console.error("ICM auth confirm failure", {
      flow: "verify_otp",
      type,
      ...getSafeAuthErrorDetails(error)
    });

    return redirectToLoginError(request, "invite_expired");
  }

  if (!data.session?.access_token) {
    console.error("ICM auth confirm failure", {
      flow: "verify_otp_session_missing",
      type,
      hasUser: Boolean(data.user),
      responseCookieCount: redirectResponse.cookies.getAll().length,
      responseHeaderCount: Array.from(redirectResponse.headers.keys()).length,
      supabaseCookieWriteCount,
      supabaseHeaderWriteCount
    });

    return redirectToLoginError(request, "invite_session_missing");
  }

  return redirectResponse;
}
