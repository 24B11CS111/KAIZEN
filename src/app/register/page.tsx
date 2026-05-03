import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RegistrationFlow } from "@/components/RegistrationFlow";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return (
    <>
      <Navbar />
      <main className="pt-32 pb-20">
        <div className="container-page">
          <div className="text-center max-w-xl mx-auto mb-10">
            <p className="eyebrow justify-center">Join the system</p>
            <h1 className="h2 mt-3">Bind your vow.</h1>
            <p className="lead mt-3">
              Four steps. One verified account. Your dojo opens within minutes.
            </p>
          </div>
          <RegistrationFlow />
        </div>
      </main>
      <Footer />
    </>
  );
}
