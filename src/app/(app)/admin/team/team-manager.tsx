"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ShieldMinus, UserPlus } from "lucide-react";
import { ActionForm, inputCls, L, Panel, runAction, Submit } from "@/components/admin/admin-ui";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { inviteGuest, setUserRole } from "../actions";

type Person = { id: string; email: string; full_name: string };

export function TeamManager({ me, admins, guests, pending }: { me: string; admins: Person[]; guests: Person[]; pending: { id: string; email: string; full_name: string }[] }) {
  const router = useRouter();
  const [promote, setPromote] = useState("");
  const [demote, setDemote] = useState<Person | null>(null);

  return (
    <div className="space-y-6">
      <Panel title={`Admins (${admins.length})`}
        description="Admins can invite guests, manage albums and photos, approve what's public, and edit the website. Add people you trust.">
        <ul className="divide-y divide-champagne/30">
          {admins.map((a) => (
            <li key={a.id} className="flex items-center gap-3 py-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-champagne to-gold font-display text-lg text-cream">
                {(a.full_name || a.email).charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{a.full_name || "-"}{a.id === me && <span className="ml-1.5 text-xs text-taupe">(you)</span>}</p>
                <p className="truncate text-sm text-taupe">{a.email}</p>
              </div>
              {a.id !== me && (
                <button type="button" onClick={() => setDemote(a)} className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm text-taupe hover:bg-muted">
                  <ShieldMinus className="size-4" /> Remove admin
                </button>
              )}
            </li>
          ))}
          {pending.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-3 opacity-70">
              <span className="flex size-10 items-center justify-center rounded-full border border-dashed border-gold/60 text-gold">?</span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{p.full_name || p.email}</p>
                <p className="truncate text-sm text-taupe">{p.email} · invitation sent, not accepted yet</p>
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Add a new admin" description="Sends an invitation email. They become an admin as soon as they accept.">
          <ActionForm action={inviteGuest} resetOnSuccess onSuccess={() => router.refresh()} className="grid gap-3">
            {(pending) => (
              <>
                <input type="hidden" name="role" value="admin" />
                <L label="Name"><input name="full_name" required maxLength={120} className={inputCls} autoComplete="off" /></L>
                <L label="Email"><input name="email" type="email" required className={inputCls} autoComplete="off" /></L>
                <Submit pending={pending}><UserPlus className="size-4" /> Invite as admin</Submit>
              </>
            )}
          </ActionForm>
        </Panel>

        <Panel title="Make a guest an admin" description="For someone who already has an account.">
          {guests.length ? (
            <div className="grid gap-3">
              <L label="Guest">
                <select value={promote} onChange={(e) => setPromote(e.target.value)} className={inputCls}>
                  <option value="">Choose a guest…</option>
                  {guests.map((g) => <option key={g.id} value={g.id}>{g.full_name || g.email} ({g.email})</option>)}
                </select>
              </L>
              <button type="button" disabled={!promote}
                onClick={async () => { if (await runAction(setUserRole(promote, "admin"), "They're now an admin")) { setPromote(""); router.refresh(); } }}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gold px-6 font-medium text-cream hover:bg-gold-deep disabled:opacity-50">
                <ShieldCheck className="size-4" /> Make admin
              </button>
            </div>
          ) : (
            <p className="text-taupe">No guests have joined yet.</p>
          )}
        </Panel>
      </div>

      <ConfirmDialog open={demote !== null} onOpenChange={(o) => !o && setDemote(null)}
        title={`Remove ${demote?.full_name || demote?.email} as admin?`}
        description="They'll stay a guest and keep access to the photo album, but lose access to this dashboard."
        confirmLabel="Remove admin"
        onConfirm={async () => { if (demote && (await runAction(setUserRole(demote.id, "guest"), "Admin rights removed"))) router.refresh(); }} />
    </div>
  );
}
