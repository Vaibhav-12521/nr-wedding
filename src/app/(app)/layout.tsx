import { AppNav } from "@/components/photos/app-nav";
import { SelectionProvider } from "@/components/photos/selection-context";
import { requireMember } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireMember();
  return (
    <SelectionProvider>
      <AppNav isAdmin={session.profile.role === "admin"} name={session.profile.full_name || session.email} />
      <main className="mx-auto min-h-svh max-w-7xl px-4 pt-20 sm:px-6">{children}</main>
    </SelectionProvider>
  );
}
