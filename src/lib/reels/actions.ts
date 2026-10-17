"use server";

import { refresh } from "next/cache";
import { REEL_FIELDS } from "@/lib/reels/fields";
import { createClient } from "@/lib/supabase/server";

async function getAuthedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return { supabase, user };
}

export async function addReel(formData: FormData) {
  const { supabase, user } = await getAuthedClient();

  // Empty inputs are stored as null.
  const row: Record<string, string | null> = { user_id: user.id };
  for (const field of REEL_FIELDS) {
    const value = String(formData.get(field) ?? "").trim();
    row[field] = value === "" ? null : value;
  }

  const { error } = await supabase.from("reels").insert(row);
  if (error) {
    throw new Error(error.message);
  }
  refresh();
}

export async function deleteReel(id: string) {
  const { supabase } = await getAuthedClient();

  const { error } = await supabase.from("reels").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
  refresh();
}
