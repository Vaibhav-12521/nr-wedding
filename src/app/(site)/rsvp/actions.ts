"use server";

import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWedding } from "@/lib/wedding";

export type RsvpState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string> };

const schema = z.object({
  name: z.string().trim().min(1, "Please tell us your name").max(120),
  email: z.union([z.literal(""), z.string().trim().email("Please check the email address").max(200)]),
  phone: z.string().trim().max(30).regex(/^[0-9+()\-\s]*$/, "Please check the phone number"),
  attending: z.enum(["yes", "no"], { message: "Please let us know if you can come" }),
  guests: z.coerce.number().int().min(0).max(20),
  events: z.array(z.string().uuid()).max(20),
  message: z.string().trim().max(1000),
  website: z.string().max(0),
});

export async function submitRsvp(_prev: RsvpState, form: FormData): Promise<RsvpState> {
  const wedding = await getWedding();
  if (!wedding.rsvp_enabled) return { error: "RSVPs are closed." };
  if (wedding.rsvp_deadline && new Date(`${wedding.rsvp_deadline}T23:59:59+05:30`) < new Date()) {
    return { error: "The RSVP deadline has passed - please contact the family directly." };
  }

  const parsed = schema.safeParse({
    name: form.get("name") ?? "",
    email: form.get("email") ?? "",
    phone: form.get("phone") ?? "",
    attending: form.get("attending") ?? undefined,
    guests: form.get("guests") ?? 1,
    events: form.getAll("events").map(String),
    message: form.get("message") ?? "",
    website: form.get("website") ?? "",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    if (fieldErrors.website) return { ok: true };
    return { error: "Please check the highlighted fields.", fieldErrors };
  }
  if (!(await rateLimit(`rsvp:${await clientIp()}`, 5, 3600))) {
    return { error: "Too many responses from this connection - please try again later." };
  }

  const d = parsed.data;
  const { error } = await createAdminClient().from("rsvps").insert({
    name: d.name,
    email: d.email || null,
    phone: d.phone || null,
    attending: d.attending === "yes",
    guests_count: d.attending === "yes" ? Math.max(1, d.guests) : 0,
    event_ids: d.events,
    message: d.message || null,
  });
  if (error) {
    console.error("rsvp insert", error);
    return { error: "Sorry, something went wrong. Please try again." };
  }
  return { ok: true };
}
