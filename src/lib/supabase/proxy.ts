import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SIGN_IN_ROUTE = "/";
const AUTHENTICATED_HOME = "/dashboard";

/**
 * Refreshes the Supabase session cookie and performs optimistic auth redirects.
 * Pages that render protected data must still verify the user themselves.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) =>
            response.headers.set(key, value),
          );
        },
      },
    },
  );

  // Must run before any response is returned so refreshed tokens are persisted.
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims);
  const { pathname } = request.nextUrl;

  if (!isAuthenticated && pathname !== SIGN_IN_ROUTE) {
    return redirectWithCookies(request, response, SIGN_IN_ROUTE);
  }

  if (isAuthenticated && pathname === SIGN_IN_ROUTE) {
    return redirectWithCookies(request, response, AUTHENTICATED_HOME);
  }

  return response;
}

function redirectWithCookies(
  request: NextRequest,
  response: NextResponse,
  pathname: string,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  const redirect = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}
