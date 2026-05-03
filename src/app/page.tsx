import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { TracksSection } from "@/components/TracksSection";
import { HowItWorks } from "@/components/HowItWorks";
import { DashboardPreview } from "@/components/DashboardPreview";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <TracksSection />
        <HowItWorks />
        <DashboardPreview />
      </main>
      <Footer />
    </>
  );
}
