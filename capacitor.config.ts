/**
 * KAIZEN - Capacitor config (TS form, kept in sync with capacitor.config.json).
 *
 * This file does NOT import from @capacitor/cli, because that package is
 * a dev-only dependency installed locally when you actually scaffold the
 * Android project. Vercel does not install it, and pulling its types in
 * would break `next build`.
 *
 * Capacitor CLI accepts .ts, .js, or .json - we keep both this stub and
 * capacitor.config.json. capacitor.config.json is the source of truth
 * if Capacitor CLI ever skips the .ts.
 */

interface CapacitorConfigShape {
  appId: string;
  appName: string;
  webDir: string;
  server?: {
    url?: string;
    cleartext?: boolean;
    allowNavigation?: string[];
  };
  android?: {
    allowMixedContent?: boolean;
    captureInput?: boolean;
    webContentsDebuggingEnabled?: boolean;
    backgroundColor?: string;
  };
  plugins?: Record<string, unknown>;
}

const config: CapacitorConfigShape = {
  appId: "com.kaizen.sys",
  appName: "KAIZEN",
  webDir: "public-shell",
  server: {
    url: "https://your-kaizen-domain.com",
    cleartext: false,
    allowNavigation: [
      "your-kaizen-domain.com",
      "*.your-kaizen-domain.com",
      "*.supabase.co",
      "*.supabase.in"
    ]
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: "#050505"
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: "#050505",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#050505",
      overlaysWebView: false
    },
    App: {
      launchUrl: ""
    }
  }
};

export default config;
