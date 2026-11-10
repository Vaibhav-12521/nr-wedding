import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { getWedding } from "@/lib/wedding";

export const metadata: Metadata = { title: "Privacy Policy" };

export default async function PrivacyPage() {
  const w = await getWedding();
  return (
    <>
      <PageHero eyebrow="Your" title="Privacy" />
      <article className="mx-auto max-w-3xl space-y-8 px-4 py-20 leading-relaxed text-cocoa/85 [&_h2]:mb-3 [&_h2]:text-3xl">
        <section>
          <h2>Who can see what</h2>
          <p>This website has a public part (wedding information and a small gallery the family chose to share) and a private photo album. The private album is open only to guests the family has personally invited. Photos you upload are private to invited guests unless a family administrator approves them for the public gallery.</p>
        </section>
        <section>
          <h2>What we store</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>For invited guests: your name and email address, so you can sign in.</li>
            <li>Photos you upload, with your name as the uploader and the upload time.</li>
            <li>Your favourites and selections, so they are kept between visits.</li>
            <li>A record of uploads, downloads and deletions, so the family can look after the album.</li>
            <li>If you RSVP: the details you enter in the form.</li>
          </ul>
        </section>
        <section>
          <h2>How photos are protected</h2>
          <p>Private photos are kept in private storage and are never reachable through a permanent public link. Each time you view or download one, the site checks that you are allowed to and issues a link that expires within the hour. Small previews have location and camera details removed. Original files are kept exactly as uploaded, so download them only where you are comfortable doing so.</p>
        </section>
        <section>
          <h2>Removing your data</h2>
          <p>You can delete your own uploads at any time from the photo album. To remove your account, your RSVP or any photo of you, please contact the family{w.privacy_contact ? <> at <strong>{w.privacy_contact}</strong></> : " through the contact page"}.</p>
        </section>
        <section>
          <h2>Cookies</h2>
          <p>We use only the cookies needed to keep you signed in. There is no advertising or third-party tracking on this site.</p>
        </section>
      </article>
    </>
  );
}
