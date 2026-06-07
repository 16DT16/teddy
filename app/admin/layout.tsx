import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { TopNav } from "@/components/TopNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login?role=admin");
  }

  if (session.role !== "admin") {
    redirect("/staff");
  }

  return (
    <>
      <TopNav
        title="የአስተዳዳሪ ገጽ"
        role="admin"
      />

      {children}
    </>
  );
}