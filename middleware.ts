import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(request) {
    const tier = request.nextauth.token?.subscriptionTier as string | undefined;
    const interviewsRemaining = Number(request.nextauth.token?.interviewsRemaining ?? 0);
    const path = request.nextUrl.pathname;

    if (tier !== "pro" && path.startsWith("/interview") && interviewsRemaining <= 0) {
      return NextResponse.redirect(new URL("/pricing?reason=interview_limit", request.url));
    }

    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/login",
    },
    callbacks: {
      authorized: ({ token }) => Boolean(token),
    },
  },
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/interview/:path*",
    "/resume/:path*",
    "/report/:path*",
    "/profile/:path*",
  ],
};
