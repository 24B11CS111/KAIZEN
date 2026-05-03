"use client";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const Spline = dynamic(() => import("@splinetool/react-spline"), {
  ssr: false,
  loading: () => <SceneFallback />
});

function SceneFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative h-72 w-72 animate-pulse">
        <div className="absolute inset-0 rounded-full bg-blood-500/15 blur-3xl" />
        <div className="absolute inset-8 rounded-full border border-blood-500/40 shadow-blood" />
        <div className="absolute inset-16 rounded-full border border-blood-500/30" />
        <div className="absolute inset-24 rounded-full bg-blood-500/40 blur-md" />
      </div>
    </div>
  );
}

export function SplineHero() {
  const scene = process.env.NEXT_PUBLIC_SPLINE_SCENE;
  if (!scene) return <SceneFallback />;
  return (
    <Suspense fallback={<SceneFallback />}>
      <Spline scene={scene} className="!h-full !w-full" />
    </Suspense>
  );
}
