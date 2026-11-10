export type AppRole = "guest" | "admin";
export type AlbumVisibility = "public" | "members" | "restricted";
export type PhotoVisibility = "private" | "public";
export type ApprovalStatus = "none" | "pending" | "approved" | "rejected";

export type Profile = {
  id: string;
  full_name: string;
  role: AppRole;
  is_active: boolean;
};

export type TimelineItem = { date?: string; title: string; text?: string };
export type FamilyMember = { side: "bride" | "groom"; name: string; relation?: string; note?: string };
export type Faq = { question: string; answer: string };
export type Contact = { name: string; role?: string; phone?: string; email?: string };

export type WeddingDetails = {
  bride_name: string;
  groom_name: string | null;
  tagline: string;
  wedding_date: string | null;
  venue_name: string | null;
  venue_address: string | null;
  location: string | null;
  maps_url: string | null;
  hero_image_path: string | null;
  bride_photo_path: string | null;
  groom_photo_path: string | null;
  bride_intro: string | null;
  groom_intro: string | null;
  story_intro: string | null;
  story_timeline: TimelineItem[];
  families: FamilyMember[];
  faqs: Faq[];
  contacts: Contact[];
  invitation_message: string | null;
  rsvp_enabled: boolean;
  rsvp_deadline: string | null;
  privacy_contact: string | null;
};

export type Wish = { id: string; name: string; message: string; created_at: string };

export type WeddingEvent = {
  id: string;
  title: string;
  date_label: string | null;
  starts_at: string | null;
  ends_at: string | null;
  venue_name: string | null;
  address: string | null;
  maps_url: string | null;
  description: string | null;
  dress_code: string | null;
  image_path: string | null;
  sort_order: number;
  is_published: boolean;
};

export type Album = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  visibility: AlbumVisibility;
  event_id: string | null;
  allow_uploads: boolean;
  allow_downloads: boolean;
  cover_photo_id: string | null;
  sort_order: number;
  created_at: string;
};

export type GalleryPhoto = {
  id: string;
  title: string | null;
  filename: string;
  width: number | null;
  height: number | null;
  size: number;
  createdAt: string;
  albumId: string;
  albumName: string | null;
  uploaderId: string | null;
  uploaderName: string | null;
  visibility: PhotoVisibility;
  approval: ApprovalStatus;
  thumbUrl: string;
  previewUrl: string;
  favourite: boolean;
  canDelete: boolean;
};
