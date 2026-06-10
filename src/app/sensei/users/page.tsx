import { requireAdminPage } from "@/lib/admin";
import { getSenseiDirectoryUsers } from "@/lib/adminData";
import { SenseiUsersClient } from "./SenseiUsersClient";
import { ErrorBoundary } from "@/components/admin/ErrorBoundary";
import { SenseiPage } from "@/components/admin/SenseiPage";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  await requireAdminPage();
  const users = await getSenseiDirectoryUsers();

  return (
    <SenseiPage
      title="Warrior Directory"
      description="Complete CRM visibility and management for all registered users."
      fullHeight
    >
      <ErrorBoundary name="User Directory">
        <SenseiUsersClient initialUsers={users} />
      </ErrorBoundary>
    </SenseiPage>
  );
}
