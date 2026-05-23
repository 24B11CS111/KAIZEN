import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { SignupForm } from "./SignupForm";

// Force dynamic - reads ?next= at request time and depends on live auth state.
export const dynamic = "force-dynamic";

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupFallback />}>
      <SignupForm />
    </Suspense>
  );
}

function SignupFallback() {
  return (
    <main className="min-h-[100svh] grid place-items-center px-6">
      <Loader2 className="h-6 w-6 text-blood-500 animate-spin" />
    </main>
  );
}
