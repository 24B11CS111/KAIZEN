"use client";
import { useEffect, useState } from "react";
import { Check, X, RefreshCw } from "lucide-react";

interface Check {
  ok: boolean;
  error?: string;
  hint?: string;
  detail?: Record<string, boolean>;
  value?: string;
}

export default function HealthPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const json = await res.json();
      setData(json);
    } catch (e) {
      setData({ error: e instanceof Error ? e.message : String(e) });
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <main className="min-h-screen p-6 md:p-12">
      <div className="container-page">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="eyebrow">Diagnostics</p>
            <h1 className="h2 mt-2">System health</h1>
            <p className="lead mt-2">
              If anything is red, follow its hint. Then come back and reload.
            </p>
          </div>
          <button onClick={load} className="btn-secondary">
            <RefreshCw className={"h-4 w-4 " + (loading ? "animate-spin" : "")} /> Reload
          </button>
        </div>

        {loading && !data && (
          <div className="card p-6 text-white/60">Running checks...</div>
        )}

        {data && (
          <div className="space-y-3">
            {(["env","url_shape","supabase_anon","profiles_table","path_branch_columns","summary"] as const).map((key) => {
              const v = data[key] as Check | undefined;
              if (!v) return null;
              return (
                <div
                  key={key}
                  className={
                    "card p-5 " +
                    (v.ok
                      ? "border-emerald-500/30 bg-emerald-500/[0.04]"
                      : "border-blood-500/40 bg-blood-500/[0.04]")
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={
                          "grid place-items-center h-7 w-7 rounded-md " +
                          (v.ok
                            ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-400"
                            : "bg-blood-500/15 border border-blood-500/40 text-blood-500")
                        }
                      >
                        {v.ok ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      </span>
                      <span className="font-semibold">{key}</span>
                    </div>
                    <span className={"text-xs " + (v.ok ? "text-emerald-400" : "text-blood-500")}>
                      {v.ok ? "OK" : "FAIL"}
                    </span>
                  </div>
                  {v.error && (
                    <pre className="text-xs text-blood-500 mt-3 whitespace-pre-wrap break-words">
                      {v.error}
                    </pre>
                  )}
                  {v.hint && (
                    <p className="text-xs text-white/70 mt-3 leading-relaxed">
                      <span className="font-semibold text-white">Fix: </span>
                      {v.hint}
                    </p>
                  )}
                  {v.detail && (
                    <ul className="text-xs text-white/60 mt-3 space-y-1">
                      {Object.entries(v.detail).map(([k, ok]) => (
                        <li key={k} className="flex items-center gap-2">
                          <span className={ok ? "text-emerald-400" : "text-blood-500"}>
                            {ok ? "OK " : "X  "}
                          </span>
                          <code className="font-mono">{k}</code>
                        </li>
                      ))}
                    </ul>
                  )}
                  {v.value && (
                    <p className="text-xs text-white/40 mt-2 font-mono">value: {v.value}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
