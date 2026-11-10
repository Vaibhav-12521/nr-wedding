"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { runAction } from "@/components/admin/admin-ui";
import { createSuggestedAlbums } from "../actions";

export function SuggestedAlbumsButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button type="button" disabled={busy}
      onClick={async () => { setBusy(true); if (await runAction(createSuggestedAlbums())) router.refresh(); setBusy(false); }}
      className="inline-flex h-10 items-center gap-2 rounded-full border border-gold/50 px-4 text-sm font-medium text-gold-deep hover:bg-blush/30 disabled:opacity-60"
      title="31 January Celebration, Wedding Day – 15 February, Family Moments, Bride's Collection, Groom's Collection, Friends and Relatives, Behind the Scenes">
      {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Add suggested albums
    </button>
  );
}
