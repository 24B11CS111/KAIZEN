import type { CapacitorConfig } from "@capacitor/cli";

/**
 * KAIZEN - Capacitor Android shell.
 *
 * The Next.js app runs on a server (Vercel/etc); this shell loads it
 * inside a WebView. To switch to a static-export build, remove the
 * `server` block and point `webDir` at `out/`.
 */
const config: CapacitorConfig = {
  appId: "com.kaizen.sys",
  appName: "KAIZEN",
  // Required by Capacitor even when using a remote `server.url`.
  // Holds the offline shell + splash; create it via `mkdir public-shell`
  // and place an index.html "Reconnect..." page there.
  webDir: "public-shell",

  server: {
    // Production web URL the WebView loads. Replace before building.
    url: "https://your-kaizen-domain.com",
    // Allows http during local dev; remove for production builds.
    cleartext: false,
    // Domains the WebView is permitted to navigate to.
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
    webContentsDebuggingEnabled: false, // flip to true for `chrome://inspect`
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
