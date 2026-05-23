import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { readPublicSupabaseEnv } from "./env";

/** Edge-middleware Supabase client tied to the request. */
export async function getUserFromRequest(request: NextRequest) {
  const { url, anonKey } = readPublicSupabaseEnv();
  const response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      get: (name: string) => request.cookies.get(name)?.value,
      set: (name: string, value: string, options: any) => {
        request.cookies.set({ name, value, ...options });
        response.cookies.set({ name, value, ...options });
      },
      remove: (name: string, options: any) => {
        request.cookies.set({ name, value: "", ...options });
        response.cookies.set({ name, value: "", ...options });
      }
    }
  });

  const { data: { user } } = await supabase.auth.getUser();
  return { response, supabase, user };
}
