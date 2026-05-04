/**
 * Type shim for @capacitor/cli.
 *
 * @capacitor/cli is a dev-only dependency. It is NOT installed on Vercel
 * because we don't ship it in package.json. Without this declaration,
 * `next build` would fail to resolve `import type { CapacitorConfig }` in
 * capacitor.config.ts.
 *
 * This file resolves the type at build time without requiring the package
 * to be present. The local Capacitor CLI continues to use the real types
 * because node_modules takes precedence when the package IS installed.
 */
declare module "@capacitor/cli" {
  export interface CapacitorConfig {
    appId?: string;
    appName?: string;
    webDir?: string;
    bundledWebRuntime?: boolean;
    server?: {
      url?: string;
      hostname?: string;
      iosScheme?: string;
      androidScheme?: string;
      cleartext?: boolean;
      allowNavigation?: string[];
      errorPath?: string;
    };
    android?: Record<string, unknown>;
    ios?: Record<string, unknown>;
    plugins?: Record<string, Record<string, unknown>>;
    [key: string]: unknown;
  }
}
