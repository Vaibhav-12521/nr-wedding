import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { DEFAULT_DETAILS } from "@/lib/wedding";
import type { WeddingDetails } from "@/lib/types";
import { WeddingForm } from "./wedding-form";

export const metadata: Metadata = { title: "Wedding details · Admin" };

export default async function WeddingDetailsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("wedding_details").select("*").eq("id", 1).single();
  return <WeddingForm w={{ ...DEFAULT_DETAILS, ...(data as WeddingDetails | null) }} />;
}
