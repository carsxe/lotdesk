import { auth } from "@/auth";

export default auth((request) => {
  const path = request.nextUrl.pathname;
  if (path.startsWith("/app") && !request.auth) {
    const login = new URL("/login", request.nextUrl.origin);
    login.searchParams.set("next", path);
    return Response.redirect(login);
  }
});

export const config = {
  matcher: ["/app/:path*"],
};
