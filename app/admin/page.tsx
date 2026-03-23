import { redirect } from "next/navigation";

import AdminConsole from "@/components/patent-lens/admin-console";
import { AuthSessionError, requireAdminSession } from "@/lib/auth/session";

export default async function AdminPage() {
  try {
    await requireAdminSession({ createAccountIfMissing: true });
  } catch (error) {
    if (error instanceof AuthSessionError && error.status <= 403) {
      redirect("/");
    }

    throw error;
  }

  return <AdminConsole />;
}
