import { redirect } from "next/navigation";

/**
 * /dashboard is an alias for /dojo (the canonical authenticated home).
 * Auth + subscription_status routing happens inside /dojo.
 */
export default function DashboardPage() {
  redirect("/dojo");
}
