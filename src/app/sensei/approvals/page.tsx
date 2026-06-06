import { requireAdminPage } from "@/lib/admin";
import { getSenseiDirectoryUsers } from "@/lib/adminData";
import { SenseiApprovalsClient } from "./SenseiApprovalsClient";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  await requireAdminPage();
  const users = await getSenseiDirectoryUsers();
  
  // Filter only users who need review (pending payments)
  const pendingUsers = users.filter((u) => u.reviewable);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Sensei Approvals</h1>
        <p className="text-white/50 text-sm mt-1">Review and verify UTR payments to activate premium access.</p>
      </div>
      
      <SenseiApprovalsClient pendingUsers={pendingUsers} />
    </div>
  );
}
