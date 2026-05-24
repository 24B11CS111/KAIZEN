/**
 * KAIZEN.SYS — @supabase/supabase-js type shim
 * 
 * The sandbox node_modules have a truncated @supabase/supabase-js package.
 * This shim re-declares just the types used by this project so `tsc --noEmit`
 * passes locally. On Vercel, `npm install` runs fresh and provides the full
 * package — this file is not used in production builds.
 * 
 * DO NOT reference this file directly — it is wired via tsconfig.json paths.
 */

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: User;
}

export interface User {
  id: string;
  app_metadata: Record<string, any>;
  user_metadata: Record<string, any>;
  aud: string;
  email?: string;
  phone?: string;
  created_at: string;
  confirmed_at?: string;
  email_confirmed_at?: string;
  phone_confirmed_at?: string;
  last_sign_in_at?: string;
  role?: string;
  updated_at?: string;
}

export interface AuthError {
  message: string;
  status?: number;
  code?: string;
}

export interface PostgrestError {
  message: string;
  details: string | null;
  hint: string | null;
  code: string;
}

export interface RealtimeChannel {
  topic: string;
  on: (type: string, filter: Record<string, any>, callback: (payload: any) => void) => RealtimeChannel;
  subscribe: (callback?: (status: string, err?: Error) => void) => RealtimeChannel;
  unsubscribe: () => Promise<"ok" | "timed out" | "error">;
  send: (args: { type: string; event: string; payload?: any }) => Promise<"ok" | "error" | "timed out">;
}

// Generic SupabaseClient — typed minimally for this project's usage
export declare class SupabaseClient<Database = any, SchemaName extends string = "public", Schema = any> {
  auth: SupabaseAuthClient;
  from<TableName extends string>(table: TableName): any;
  rpc(fn: string, params?: object): any;
  channel(name: string): RealtimeChannel;
  removeChannel(channel: RealtimeChannel): Promise<"ok" | "timed out" | "error">;
  getChannels(): RealtimeChannel[];
}

export interface SupabaseAuthClient {
  getSession(): Promise<{ data: { session: Session | null }; error: AuthError | null }>;
  getUser(): Promise<{ data: { user: User | null }; error: AuthError | null }>;
  signInWithPassword(credentials: { email: string; password: string }): Promise<{ data: { session: Session | null; user: User | null }; error: AuthError | null }>;
  signInWithOAuth(params: { provider: string; options?: { redirectTo?: string; queryParams?: Record<string, string>; scopes?: string } }): Promise<{ data: any; error: AuthError | null }>;
  signInWithOtp(params: { email?: string; phone?: string; options?: { emailRedirectTo?: string; shouldCreateUser?: boolean } }): Promise<{ data: any; error: AuthError | null }>;
  verifyOtp(params: { phone?: string; email?: string; token: string; type: string }): Promise<{ data: { session: Session | null }; error: AuthError | null }>;
  signOut(): Promise<{ error: AuthError | null }>;
  onAuthStateChange(callback: (event: string, session: Session | null) => void): { data: { subscription: { unsubscribe: () => void } } };
  exchangeCodeForSession(code: string): Promise<{ data: { session: Session | null }; error: AuthError | null }>;
  resetPasswordForEmail(email: string, options?: { redirectTo?: string }): Promise<{ data: object; error: AuthError | null }>;
  updateUser(attributes: { email?: string; password?: string; data?: object }): Promise<{ data: { user: User | null }; error: AuthError | null }>;
  admin: SupabaseAuthAdmin;
  setSession(params: { access_token: string; refresh_token: string }): Promise<{ data: { session: Session | null }; error: AuthError | null }>;
}

export interface SupabaseAuthAdmin {
  createUser(attributes: { email?: string; phone?: string; password?: string; email_confirm?: boolean; phone_confirm?: boolean; user_metadata?: object }): Promise<{ data: { user: User | null }; error: AuthError | null }>;
  deleteUser(id: string): Promise<{ data: object; error: AuthError | null }>;
  listUsers(): Promise<{ data: { users: User[] }; error: AuthError | null }>;
  updateUserById(uid: string, attributes: { email?: string; password?: string; email_confirm?: boolean; user_metadata?: object }): Promise<{ data: { user: User | null }; error: AuthError | null }>;
}

export declare function createClient<Database = any>(
  supabaseUrl: string,
  supabaseKey: string,
  options?: {
    auth?: {
      autoRefreshToken?: boolean;
      persistSession?: boolean;
      detectSessionInUrl?: boolean;
      flowType?: string;
      storage?: any;
    };
    global?: { headers?: Record<string, string>; fetch?: typeof fetch };
    db?: { schema?: string };
    realtime?: object;
  }
): SupabaseClient<Database>;
