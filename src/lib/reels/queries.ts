import { createClient } from "@/lib/supabase/server";

export type Reel = {
  id: string;
  url: string;
  platform: string | null;
  title: string | null;
  description: string | null;
  author: string | null;
  duration_sec: number | null;
  thumbnail_url: string | null;
  created_at: string;
};

export async function getReels(): Promise<Reel[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reels")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return data;
}
