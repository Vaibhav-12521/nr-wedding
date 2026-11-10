"use client";

import { useRouter } from "next/navigation";
import { ActionForm, inputCls, L, Panel, Submit, textareaCls, Toggle } from "@/components/admin/admin-ui";
import { ImageField, ListEditor, toLocalInput } from "@/components/admin/editors";
import { saveWedding } from "../actions";
import type { WeddingDetails } from "@/lib/types";

export function WeddingForm({ w }: { w: WeddingDetails }) {
  const router = useRouter();
  return (
    <ActionForm action={saveWedding} onSuccess={() => router.refresh()} className="space-y-6">
      {(pending) => (
        <>
          <Panel title="The couple" description="Portraits appear in the opening scene, on the homepage and on Our Story. Tall (portrait) photos look best.">
            <div className="grid gap-4 sm:grid-cols-2">
              <ImageField name="bride_photo_path" folder="couple" portrait initial={w.bride_photo_path} label="Bride's photo" />
              <ImageField name="groom_photo_path" folder="couple" portrait initial={w.groom_photo_path} label="Groom's photo" />
              <L label="Bride's name"><input name="bride_name" required defaultValue={w.bride_name} className={inputCls} /></L>
              <L label="Groom's name" hint="Leave empty until you're ready to show it."><input name="groom_name" defaultValue={w.groom_name ?? ""} className={inputCls} /></L>
              <L label="Tagline" className="sm:col-span-2"><input name="tagline" required defaultValue={w.tagline} className={inputCls} /></L>
            </div>
          </Panel>

          <Panel title="Date & venue" description="The countdown on the homepage starts once the date is set. Times are Indian Standard Time.">
            <div className="grid gap-4 sm:grid-cols-2">
              <L label="Wedding date & time"><input type="datetime-local" name="wedding_date" defaultValue={toLocalInput(w.wedding_date)} className={inputCls} /></L>
              <L label="Venue name"><input name="venue_name" defaultValue={w.venue_name ?? ""} className={inputCls} /></L>
              <L label="Venue address" className="sm:col-span-2"><input name="venue_address" defaultValue={w.venue_address ?? ""} className={inputCls} /></L>
              <L label="City / location"><input name="location" defaultValue={w.location ?? ""} className={inputCls} /></L>
              <L label="Google Maps link" hint="Optional - otherwise directions use the address."><input name="maps_url" type="url" placeholder="https://maps.app.goo.gl/…" defaultValue={w.maps_url ?? ""} className={inputCls} /></L>
            </div>
          </Panel>

          <Panel title="Homepage & invitation">
            <div className="grid gap-4">
              <ImageField name="hero_image_path" folder="hero" initial={w.hero_image_path} label="Hero background photo" />
              <L label="Welcome message (homepage & story intro)"><textarea name="story_intro" defaultValue={w.story_intro ?? ""} className={textareaCls} rows={3} /></L>
              <L label="Invitation wording" hint="Shown above your names on the digital invitation."><textarea name="invitation_message" defaultValue={w.invitation_message ?? ""} className={textareaCls} rows={3} /></L>
            </div>
          </Panel>

          <Panel title="Our story">
            <div className="grid gap-4 sm:grid-cols-2">
              <L label="About the bride"><textarea name="bride_intro" defaultValue={w.bride_intro ?? ""} className={textareaCls} rows={5} /></L>
              <L label="About the groom"><textarea name="groom_intro" defaultValue={w.groom_intro ?? ""} className={textareaCls} rows={5} /></L>
            </div>
            <h3 className="mb-2 mt-6 font-display text-xl">Timeline</h3>
            <ListEditor name="story_timeline" addLabel="Add a moment" initial={w.story_timeline}
              empty={{ date: "", title: "", text: "" }}
              fields={[{ key: "date", label: "When" }, { key: "title", label: "Title", required: true }, { key: "text", label: "Story", type: "textarea" }]} />
          </Panel>

          <Panel title="Families">
            <ListEditor name="families" addLabel="Add a family member" initial={w.families}
              empty={{ side: "bride", name: "", relation: "", note: "" }}
              fields={[
                { key: "side", label: "Side", type: "select", options: [["bride", "Bride's family"], ["groom", "Groom's family"]] },
                { key: "name", label: "Name", required: true }, { key: "relation", label: "Relation" }, { key: "note", label: "Note" },
              ]} />
          </Panel>

          <Panel title="FAQ">
            <ListEditor name="faqs" addLabel="Add a question" initial={w.faqs}
              empty={{ question: "", answer: "" }}
              fields={[{ key: "question", label: "Question", required: true }, { key: "answer", label: "Answer", type: "textarea", required: true }]} />
          </Panel>

          <Panel title="Contacts & privacy">
            <ListEditor name="contacts" addLabel="Add a contact" initial={w.contacts}
              empty={{ name: "", role: "", phone: "", email: "" }}
              fields={[{ key: "name", label: "Name", required: true }, { key: "role", label: "Role (e.g. Travel & stay)" }, { key: "phone", label: "Phone" }, { key: "email", label: "Email" }]} />
            <L label="Privacy contact (shown on the privacy page)" className="mt-4"><input name="privacy_contact" defaultValue={w.privacy_contact ?? ""} className={inputCls} /></L>
          </Panel>

          <Panel title="RSVP">
            <div className="grid gap-4 sm:grid-cols-2">
              <Toggle name="rsvp_enabled" label="Accept RSVPs" defaultChecked={w.rsvp_enabled} />
              <L label="Reply-by date"><input type="date" name="rsvp_deadline" defaultValue={w.rsvp_deadline ?? ""} className={inputCls} /></L>
            </div>
          </Panel>

          <div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-10 flex justify-end md:bottom-4">
            <Submit pending={pending} className="shadow-lg">Save all changes</Submit>
          </div>
        </>
      )}
    </ActionForm>
  );
}
