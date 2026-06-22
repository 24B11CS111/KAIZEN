import { NextResponse } from "next/server";
import { SignupSchema } from "@/lib/validation";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

type AuthFailure = {
  message: string;
  code?: string;
  status?: number;
  name?: string;
};

function envFault() {
  const missing: string[] = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  return missing;
}

function toAuthFailure(error: unknown): AuthFailure {
  if (!error || typeof error !== "object") {
    return { message: error ? String(error) : "Unknown auth error" };
  }

  const maybe = error as {
    message?: unknown;
    code?: unknown;
    status?: unknown;
    name?: unknown;
  };

  return {
    message:
      typeof maybe.message === "string" && maybe.message.trim().length > 0
        ? maybe.message
        : "Unknown auth error",
    code: typeof maybe.code === "string" ? maybe.code : undefined,
    status: typeof maybe.status === "number" ? maybe.status : undefined,
    name: typeof maybe.name === "string" ? maybe.name : undefined
  };
}

function logFailure(context: string, error: unknown, meta?: Record<string, unknown>) {
  const failure = toAuthFailure(error);
  console.error(`[auth/signup] ${context}`, {
    ...failure,
    ...(meta ?? {})
  });
  return failure;
}

function responseForFailure(
  error: unknown,
  fallbackStatus = 400,
  extra?: Record<string, unknown>
) {
  const failure = toAuthFailure(error);
  const status =
    typeof failure.status === "number" && failure.status >= 400 && failure.status <= 599
      ? failure.status
      : fallbackStatus;

  return NextResponse.json(
    {
      error: failure.message,
      code: failure.code ?? null,
      ...(extra ?? {})
    },
    { status }
  );
}

/**
 * Lightweight signup endpoint -- email + password only.
 *
 * Production rule:
 *   - We create the auth user with the service-role admin API.
 *   - We create the companion profile row explicitly.
 *   - If profile creation fails, we roll the auth user back so the system
 *     never ends up with a half-created account that cannot onboard.
 *
 * No generic masking and no redirect-dependent fallbacks live here while
 * production auth is being debugged.
 */
export async function POST(request: Request) {
  const fault = envFault();
  if (fault.length > 0) {
    return NextResponse.json(
      {
        error:
          "Server is missing env var(s): " +
          fault.join(", ") +
          ". Add them to the Vercel project env and redeploy."
      },
      { status: 500 }
    );
  }

  const ip = getClientIp(request.headers);
  const rl = rateLimit("auth-signup:" + ip, 5, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many sign-up attempts. Try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000))
        }
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body." },
      { status: 400 }
    );
  }

  const parsed = SignupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { full_name, email, password } = parsed.data;

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch (error) {
    logFailure("admin client initialization failed", error);
    return NextResponse.json(
      {
        error:
          "Could not initialize Supabase admin client. Check SUPABASE_SERVICE_ROLE_KEY in production."
      },
      { status: 500 }
    );
  }

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { source: "signup" }
  });

  if (createErr) {
    const failure = logFailure("createUser failed", createErr, { email });
    const msg = failure.message.toLowerCase();
    const alreadyExists =
      msg.includes("already") ||
      msg.includes("registered") ||
      msg.includes("exists");

    if (alreadyExists) {
      try {
        const { data: list, error: listErr } = await admin.auth.admin.listUsers();
        if (listErr) {
          logFailure("listUsers during duplicate recovery failed", listErr, { email });
          return responseForFailure(listErr, 409);
        }

        const existing = list?.users.find(
          (user: { id: string; email?: string | null }) =>
            (user.email ?? "").toLowerCase() === email.toLowerCase()
        );

        if (existing) {
          const { error: updateErr } = await admin.auth.admin.updateUserById(existing.id, {
            email_confirm: true,
            password
          });

          if (updateErr) {
            logFailure("updateUserById during duplicate recovery failed", updateErr, {
              email,
              userId: existing.id
            });
            return responseForFailure(updateErr, 409);
          }

          const { error: profileErr } = await admin.from("profiles").upsert(
            {
              id: existing.id,
              email,
              full_name
            },
            { onConflict: "id" }
          );

          if (profileErr) {
            logFailure("profile upsert during duplicate recovery failed", profileErr, {
              email,
              userId: existing.id
            });
            return responseForFailure(profileErr, 500, {
              stage: "profile_upsert_existing_user"
            });
          }

          return NextResponse.json({
            ok: true,
            confirmed_existing: true,
            user_id: existing.id
          });
        }
      } catch (error) {
        logFailure("duplicate recovery threw", error, { email });
      }
    }

    return responseForFailure(createErr);
  }

  const user = created.user;
  if (!user) {
    const error = new Error("Supabase createUser returned no user.");
    logFailure("createUser returned no user", error, { email });
    return responseForFailure(error, 500);
  }

  const { error: profileErr } = await admin.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? email,
      full_name,
    },
    { onConflict: "id" }
  );

  if (profileErr) {
    logFailure("profile upsert failed", profileErr, { email, userId: user.id });

    const { error: rollbackErr } = await admin.auth.admin.deleteUser(user.id);
    if (rollbackErr) {
      logFailure("rollback deleteUser failed after profile upsert failure", rollbackErr, {
        email,
        userId: user.id
      });
    }

    return responseForFailure(profileErr, 500, { stage: "profile_upsert" });
  }

  return NextResponse.json({ ok: true, user_id: user.id });
}
