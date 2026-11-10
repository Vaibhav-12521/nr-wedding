import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/server";
import { env, isSupabaseConfigured, SITE_BUCKET } from "@/lib/env";
import type { WeddingDetails, WeddingEvent } from "@/lib/types";

export const DEFAULT_DETAILS: WeddingDetails = {
  bride_name: "Neha",
  groom_name: "Rudra",
  tagline: "A Celebration of Love, Family & Forever.",
  wedding_date: "2027-02-15T00:00:00+05:30",
  venue_name: null,
  venue_address: null,
  location: null,
  maps_url: null,
  hero_image_path: null,
  bride_photo_path: null,
  groom_photo_path: null,
  bride_intro: null,
  groom_intro: null,
  story_intro: null,
  story_timeline: [],
  families: [],
  faqs: [],
  contacts: [],
  invitation_message: null,
  rsvp_enabled: true,
  rsvp_deadline: null,
  privacy_contact: null,
};

const DEFAULT_EVENTS: WeddingEvent[] = [
  { id: "default-1", title: "31 January Celebration", date_label: "31 January 2027", starts_at: null, ends_at: null, venue_name: null,
    address: null, maps_url: null, description: null, dress_code: null, image_path: null, sort_order: 1, is_published: true },
  { id: "default-2", title: "Wedding Day", date_label: "15 February 2027", starts_at: null, ends_at: null, venue_name: null,
    address: null, maps_url: null, description: null, dress_code: null, image_path: null, sort_order: 2, is_published: true },
];

export const getWedding = cache(async (): Promise<WeddingDetails> => {
  if (!isSupabaseConfigured) return DEFAULT_DETAILS;
  const { data, error } = await createPublicClient().from("wedding_details").select("*").eq("id", 1).single();
  if (error || !data) {
    console.error("wedding_details", error);
    return DEFAULT_DETAILS;
  }
  return { ...DEFAULT_DETAILS, ...(data as WeddingDetails) };
});

export const getEvents = cache(async (): Promise<WeddingEvent[]> => {
  if (!isSupabaseConfigured) return DEFAULT_EVENTS;
  const { data, error } = await createPublicClient()
    .from("wedding_events")
    .select("*")
    .eq("is_published", true)
    .order("sort_order")
    .order("starts_at", { nullsFirst: false });
  if (error) {
    console.error("wedding_events", error);
    return DEFAULT_EVENTS;
  }
  return data as WeddingEvent[];
});

export function siteImageUrl(path: string | null | undefined): string | null {
  if (!path || !env.supabaseUrl) return null;
  return `${env.supabaseUrl}/storage/v1/object/public/${SITE_BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

export function coupleNames(d: WeddingDetails): string {
  return d.groom_name ? `${d.bride_name} & ${d.groom_name}` : d.bride_name;
}
