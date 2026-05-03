import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/5 mt-10">
      <div className="container-page py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <span className="grid place-items-center h-7 w-7 rounded-md bg-blood-500/15 border border-blood-500/40">
            <span className="h-1.5 w-1.5 rounded-full bg-blood-500" />
          </span>
          <span className="text-sm font-semibold tracking-wide">
            KAIZEN<span className="text-blood-500">.</span>SYS
          </span>
        </div>

        <div className="flex items-center gap-6 text-xs text-white/50">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <Link href="/dojo" className="hover:text-white transition-colors">Dojo</Link>
          <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="/auth/login" className="hover:text-white transition-colors">Login</Link>
        </div>

        <div className="text-xs text-white/40">
          &copy; {new Date().getFullYear()} KAIZEN.SYS &mdash; All rights reserved.
        </div>
      </div>
    </footer>
  );
}
