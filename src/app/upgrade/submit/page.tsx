"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Upload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function SubmitPaymentPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  
  const [plan, setPlan] = useState<"ronin" | "shogun">("shogun");
  const [amount, setAmount] = useState<string>("99");
  const [transactionId, setTransactionId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handlePlanChange = (selected: "ronin" | "shogun") => {
    setPlan(selected);
    setAmount(selected === "shogun" ? "99" : "49");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!transactionId) return setError("Transaction ID is required");
    if (!file) return setError("Payment screenshot is required");

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to submit a payment");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload screenshot
      const { error: uploadError } = await (supabase as any).storage
        .from("receipts")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Insert submission
      const { error: dbError } = await supabase
        .from("payment_submissions")
        .insert({
          user_id: user.id,
          plan: plan,
          amount: parseInt(amount, 10),
          transaction_id: transactionId,
          payment_screenshot: fileName,
          status: "pending"
        });

      if (dbError) throw dbError;

      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while submitting payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-obsidian text-white selection:bg-blood-500/30">
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-3xl border border-white/10 bg-black/50 backdrop-blur-xl"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
              Submit Payment
            </h1>
            <p className="text-white/60">
              Upload your payment receipt. A Sensei will review and upgrade your account shortly.
            </p>
          </div>

          {success ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 border border-emerald-500/30">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Submission Received</h2>
              <p className="text-white/60 mb-8 max-w-sm">
                Your payment is under review. You'll have access to your new features once approved.
              </p>
              <button
                onClick={() => router.push("/dojo")}
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-all"
              >
                Return to Dojo
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-blood-500/10 border border-blood-500/20 text-blood-400 text-sm">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div 
                  onClick={() => handlePlanChange("ronin")}
                  className={`cursor-pointer rounded-2xl border p-4 text-center transition-all ${plan === "ronin" ? "border-amber-500/50 bg-amber-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                >
                  <p className="font-bold text-white">Ronin</p>
                  <p className="text-sm text-white/60">₹49 / month</p>
                </div>
                <div 
                  onClick={() => handlePlanChange("shogun")}
                  className={`cursor-pointer rounded-2xl border p-4 text-center transition-all ${plan === "shogun" ? "border-blood-500/50 bg-blood-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                >
                  <p className="font-bold text-white">Shogun</p>
                  <p className="text-sm text-white/60">₹99 / month</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Amount Paid (₹)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder:text-white/30 focus:border-blood-500/50 focus:outline-none"
                    placeholder="e.g. 99"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Transaction ID / UTR</label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder:text-white/30 focus:border-blood-500/50 focus:outline-none"
                    placeholder="Enter the 12-digit UPI reference number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Payment Screenshot</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-white/10 border-dashed rounded-xl cursor-pointer bg-white/5 hover:bg-white/10 transition-all">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-6 h-6 mb-2 text-white/40" />
                      <p className="text-sm text-white/60">
                        {file ? <span className="text-white font-medium">{file.name}</span> : "Click to upload receipt"}
                      </p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      required
                    />
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-4 rounded-xl font-bold text-white bg-blood-500 hover:bg-blood-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit for Approval"}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </main>
  );
}
