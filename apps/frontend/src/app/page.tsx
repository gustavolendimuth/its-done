import { redirect } from "next/navigation";

// This page only renders when the locale is missing from a pathname.
// Since we match all pathnames starting from the root in our middleware,
// this case should never occur, but we'll redirect to the default locale just in case.

export default function RootPage() {
  redirect("/en");
}
