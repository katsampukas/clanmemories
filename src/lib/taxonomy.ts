import { SupabaseClient } from "@supabase/supabase-js";

function normalizeTag(raw: string) {
  return raw.trim().replace(/^#/, "").toLowerCase().replace(/\s+/g, "-");
}

export async function upsertTagIds(supabase: SupabaseClient, names: string[]) {
  const clean = Array.from(new Set(names.map(normalizeTag).filter(Boolean)));
  if (clean.length === 0) return [];

  const { data: existing } = await supabase
    .from("tags")
    .select("id, name")
    .in("name", clean);

  const existingNames = new Set((existing ?? []).map((t) => t.name));
  const toCreate = clean.filter((n) => !existingNames.has(n));

  let created: { id: string; name: string }[] = [];
  if (toCreate.length) {
    const { data } = await supabase
      .from("tags")
      .insert(toCreate.map((name) => ({ name })))
      .select("id, name");
    created = data ?? [];
  }

  return [...(existing ?? []), ...created].map((t) => t.id);
}

export async function upsertPersonIds(
  supabase: SupabaseClient,
  names: string[]
) {
  const clean = Array.from(
    new Set(names.map((n) => n.trim()).filter(Boolean))
  );
  if (clean.length === 0) return [];

  const { data: existing } = await supabase
    .from("people")
    .select("id, name")
    .in("name", clean);

  const existingNames = new Set((existing ?? []).map((p) => p.name));
  const toCreate = clean.filter((n) => !existingNames.has(n));

  let created: { id: string; name: string }[] = [];
  if (toCreate.length) {
    const { data } = await supabase
      .from("people")
      .insert(toCreate.map((name) => ({ name })))
      .select("id, name");
    created = data ?? [];
  }

  return [...(existing ?? []), ...created].map((p) => p.id);
}

export async function replacePhotoTags(
  supabase: SupabaseClient,
  photoId: string,
  tagNames: string[]
) {
  const tagIds = await upsertTagIds(supabase, tagNames);
  await supabase.from("photo_tags").delete().eq("photo_id", photoId);
  if (tagIds.length) {
    await supabase
      .from("photo_tags")
      .insert(tagIds.map((tag_id) => ({ photo_id: photoId, tag_id })));
  }
}

export async function replacePhotoPeople(
  supabase: SupabaseClient,
  photoId: string,
  personNames: string[]
) {
  const personIds = await upsertPersonIds(supabase, personNames);
  await supabase.from("photo_people").delete().eq("photo_id", photoId);
  if (personIds.length) {
    await supabase
      .from("photo_people")
      .insert(
        personIds.map((person_id) => ({ photo_id: photoId, person_id }))
      );
  }
}
