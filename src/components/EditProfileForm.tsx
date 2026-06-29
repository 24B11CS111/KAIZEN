"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { InteractiveButton } from "@/components/InteractiveButton";

export function EditProfileForm({ profile }: { profile: any }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    full_name: profile.full_name || "",
    whatsapp: profile.whatsapp || "",
    age: profile.age || "",
    field_of_study: profile.field_of_study || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    const supabase = createSupabaseBrowserClient();
    
    // Minimal validation
    if (!formData.full_name) throw new Error("Name is required");

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: formData.full_name,
        whatsapp: formData.whatsapp,
        age: formData.age ? parseInt(formData.age, 10) : null,
        field_of_study: formData.field_of_study,
      })
      .eq("id", profile.id);

    if (error) {
      throw new Error(error.message);
    }
    
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 ml-1">Full Name</label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blood-500/50 focus:ring-1 focus:ring-blood-500/50 transition-all"
            placeholder="Your name"
          />
        </div>
        
        <div>
          <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 ml-1">WhatsApp</label>
          <input
            type="tel"
            name="whatsapp"
            value={formData.whatsapp}
            onChange={handleChange}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blood-500/50 focus:ring-1 focus:ring-blood-500/50 transition-all"
            placeholder="+91..."
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 ml-1">Age</label>
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleChange}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blood-500/50 focus:ring-1 focus:ring-blood-500/50 transition-all"
            placeholder="e.g. 21"
          />
        </div>
        
        <div>
          <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 ml-1">Field of Study</label>
          <input
            type="text"
            name="field_of_study"
            value={formData.field_of_study}
            onChange={handleChange}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blood-500/50 focus:ring-1 focus:ring-blood-500/50 transition-all"
            placeholder="e.g. Computer Science"
          />
        </div>
      </div>

      <div className="pt-4">
        <InteractiveButton
          variant="primary"
          className="w-full"
          onClick={handleSave}
          successMessage="Profile updated"
        >
          Save Changes
        </InteractiveButton>
      </div>
    </div>
  );
}
