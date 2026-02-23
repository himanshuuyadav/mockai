import { withAuth } from "next-auth/middleware";

import { PROTECTED_ROUTES } from "@/utils/constants";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: PROTECTED_ROUTES.map((route) => `${route}/:path*`),
};
