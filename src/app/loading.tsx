/**
 * Root loading state — KAIZEN logo with premium glow pulse on obsidian.
 */
import Image from "next/image";

const KAIZEN_LOGO = "https://res.cloudinary.com/dzqfrwizz/image/upload/v1779649962/image-removebg-preview_i3duhi.png";

export default function RootLoading() {
  return (
    <main className="min-h-[100svh] grid place-items-center bg-obsidian">
      <div className="flex flex-col items-center gap-5">
        <span
          className="relative grid place-items-center h-16 w-16 animate-pulse"
          style={{ filter: "drop-shadow(0 0 18px rgba(208,0,0,0.55))" }}
        >
          <Image
            src={KAIZEN_LOGO}
            alt="KAIZEN.SYS"
            width={64}
            height={64}
            className="object-contain"
            priority
          />
        </span>
        <span className="text-[10px] uppercase tracking-[0.32em] text-white/55">
          KAIZEN<span className="text-blood-500">.</span>SYS
        </span>
      </div>
    </main>
  );
}
