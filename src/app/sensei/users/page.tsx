import { requireAdminPage } from "@/lib/admin";
import { getSenseiDirectoryUsers } from "@/lib/adminData";
import { SenseiUsersClient } from "./SenseiUsersClient";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  await requireAdminPage();
  const users = await getSenseiDirectoryUsers();

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500 flex flex-col h-[calc(100svh-6rem)]">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Warrior Directory</h1>
        <p className="text-white/50 text-sm mt-1">Complete CRM visibility and management for all registered users.</p>
      </div>
      
      <div className="flex-1 min-h-0">
        <SenseiUsersClient initialUsers={users} />
      </div>
    </div>
  );
}
