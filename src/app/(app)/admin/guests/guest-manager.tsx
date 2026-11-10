"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MailPlus, RotateCw, Search, Trash2, UserX, UserCheck } from "lucide-react";
import { ActionForm, inputCls, L, Panel, runAction, Submit } from "@/components/admin/admin-ui";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteUser, inviteGuest, resendInvite, revokeInvitation, setUserActive, setUserRole } from "../actions";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type Member = { id: string; email: string; full_name: string; role: "guest" | "admin"; is_active: boolean; created_at: string; uploads: number };
type Invite = { id: string; email: string; full_name: string; role: string; created_at: string; user_id: string | null };

export function GuestManager({ me, members, pending }: { me: string; members: Member[]; pending: Invite[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [confirm, setConfirm] = useState<{ kind: "delete" | "deactivate" | "revoke"; id: string; name: string } | null>(null);
  const refresh = () => router.refresh();
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? members.filter((m) => `${m.full_name} ${m.email}`.toLowerCase().includes(t)) : members;
  }, [members, q]);

  return (
    <div className="space-y-6">
      <Panel title="Invite a guest" description="They'll get an email with a link to set their password. Only invited people can sign in.">
        <ActionForm action={inviteGuest} resetOnSuccess onSuccess={refresh} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
          {(pending) => (
            <>
              <L label="Name"><input name="full_name" required maxLength={120} className={inputCls} autoComplete="off" /></L>
              <L label="Email"><input name="email" type="email" required className={inputCls} autoComplete="off" /></L>
              <L label="Role">
                <select name="role" defaultValue="guest" className={inputCls}>
                  <option value="guest">Guest</option>
                  <option value="admin">Admin</option>
                </select>
              </L>
              <Submit pending={pending}><MailPlus className="size-4" /> Send invite</Submit>
            </>
          )}
        </ActionForm>
      </Panel>

      {pending.length > 0 && (
        <Panel title={`Pending invitations (${pending.length})`} description="Waiting for these people to accept.">
          <ul className="divide-y divide-champagne/30">
            {pending.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{i.full_name || i.email}</p>
                  <p className="truncate text-sm text-taupe">{i.email} · {i.role} · invited {formatDate(i.created_at, { day: "numeric", month: "short" })}</p>
                </div>
                <button type="button" onClick={() => runAction(resendInvite(i.email))}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-input px-3 text-sm hover:border-gold"><RotateCw className="size-4" /> Resend</button>
                <button type="button" onClick={() => setConfirm({ kind: "revoke", id: i.id, name: i.full_name || i.email })}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm text-destructive hover:bg-destructive/10">Revoke</button>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel title={`Members (${members.length})`}
        actions={
          <label className="relative">
            <span className="sr-only">Search members</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-taupe" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="h-10 rounded-full border border-input bg-ivory pl-9 pr-4 text-sm outline-none focus:border-gold" />
          </label>
        }>
        <div className="-mx-5 overflow-x-auto sm:mx-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-taupe">
              <tr><th className="px-5 py-2 sm:px-2">Name</th><th className="px-2">Role</th><th className="px-2">Status</th><th className="px-2">Uploads</th><th className="px-2">Joined</th><th className="px-2" /></tr>
            </thead>
            <tbody className="divide-y divide-champagne/30">
              {shown.map((m) => (
                <tr key={m.id} className={cn(!m.is_active && "opacity-60")}>
                  <td className="px-5 py-3 sm:px-2">
                    <p className="font-medium">{m.full_name || "-"}{m.id === me && <span className="ml-1.5 text-xs text-taupe">(you)</span>}</p>
                    <p className="text-taupe">{m.email}</p>
                  </td>
                  <td className="px-2">
                    <select value={m.role}
                      onChange={async (e) => { if (await runAction(setUserRole(m.id, e.target.value as Member["role"]), "Role updated")) refresh(); }}
                      className="h-9 rounded-lg border border-input bg-ivory px-2" aria-label={`Role for ${m.full_name || m.email}`}>
                      <option value="guest">Guest</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-2">
                    <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", m.is_active ? "bg-emerald-100 text-emerald-800" : "bg-muted text-taupe")}>
                      {m.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-2 tabular-nums">{m.uploads}</td>
                  <td className="px-2 text-taupe">{formatDate(m.created_at, { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td className="px-2">
                    {m.id !== me && (
                      <div className="flex justify-end gap-1">
                        {m.is_active ? (
                          <button type="button" onClick={() => setConfirm({ kind: "deactivate", id: m.id, name: m.full_name || m.email })}
                            className="inline-flex size-9 items-center justify-center rounded-full text-taupe hover:bg-muted" aria-label="Deactivate" title="Deactivate">
                            <UserX className="size-4" />
                          </button>
                        ) : (
                          <button type="button" onClick={async () => { if (await runAction(setUserActive(m.id, true), "Access restored")) refresh(); }}
                            className="inline-flex size-9 items-center justify-center rounded-full text-emerald-700 hover:bg-emerald-50" aria-label="Reactivate" title="Reactivate">
                            <UserCheck className="size-4" />
                          </button>
                        )}
                        <button type="button" onClick={() => setConfirm({ kind: "delete", id: m.id, name: m.full_name || m.email })}
                          className="inline-flex size-9 items-center justify-center rounded-full text-destructive hover:bg-destructive/10" aria-label="Delete account" title="Delete account">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={confirm?.kind === "delete" ? "Delete this account?" : confirm?.kind === "deactivate" ? "Deactivate this account?" : "Revoke this invitation?"}
        description={
          confirm?.kind === "delete" ? <>{confirm.name}&apos;s account will be permanently deleted. Photos they uploaded stay in the album.</>
          : confirm?.kind === "deactivate" ? <>{confirm?.name} will immediately lose access to the photo album. You can reactivate them later.</>
          : <>{confirm?.name} won&apos;t be able to use their invitation link.</>
        }
        confirmLabel={confirm?.kind === "delete" ? "Delete" : confirm?.kind === "deactivate" ? "Deactivate" : "Revoke"}
        onConfirm={async () => {
          if (!confirm) return;
          const p = confirm.kind === "delete" ? deleteUser(confirm.id) : confirm.kind === "deactivate" ? setUserActive(confirm.id, false) : revokeInvitation(confirm.id);
          if (await runAction(p)) refresh();
        }}
      />
    </div>
  );
}
