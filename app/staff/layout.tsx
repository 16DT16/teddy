import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { TopNav } from "@/components/TopNav";
export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login?role=staff");
  }

  return (
    <>
      <TopNav
        title="የሰራተኞች ገጽ"
        role={session.role}
      />

      {children}
    </>
  );
}