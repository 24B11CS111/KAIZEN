import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { LoginForm } from "./LoginForm";

// Force dynamic rendering as defence-in-depth - the page reads request-time
// query params (?next=...) and live auth state, so static prerender adds
// nothing here. Wrapping in Suspense alone would be enough; this just
// makes the intent explicit.
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginFallback() {
  return (
    <main className="min-h-[100svh] grid place-items-center px-6">
      <Loader2 className="h-6 w-6 text-blood-500 animate-spin" />
    </main>
  );
}
