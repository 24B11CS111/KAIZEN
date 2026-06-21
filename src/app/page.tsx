import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { PlansSection } from "@/components/PlansSection";
import { HowItWorks } from "@/components/HowItWorks";
import { DashboardPreview } from "@/components/DashboardPreview";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <PlansSection />
        <HowItWorks />
        <DashboardPreview />
      </main>
      <Footer />
    </>
  );
}
