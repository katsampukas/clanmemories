import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SearchParams = { tag?: string; person?: string };

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { tag, person } = await searchParams;
  const supabase = await createClient();

  const [{ data: tags }, { data: people }] = await Promise.all([
    supabase.from("tags").select("id, name").order("name"),
    supabase.from("people").select("id, name").order("name"),
  ]);

  let photoIds: string[] | null = null;

  if (tag) {
    const { data } = await supabase
      .from("photo_tags")
      .select("photo_id, tags!inner(name)")
      .eq("tags.name", tag);
    photoIds = (data ?? []).map((r) => r.photo_id);
  } else if (person) {
    const { data } = await supabase
      .from("photo_people")
      .select("photo_id, people!inner(name)")
      .eq("people.name", person);
    photoIds = (data ?? []).map((r) => r.photo_id);
  }

  let query = supabase
    .from("photos")
    .select("id, drive_file_id, filename, description, event_name, occurred_on")
    .order("created_at", { ascending: false });

  if (photoIds) {
    query = query.in(
      "id",
      photoIds.length ? photoIds : ["00000000-0000-0000-0000-000000000000"]
    );
  }

  const { data: photos } = await query;

  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">ClanMemories</h1>
        <Link
          href="/upload"
          className="rounded bg-black px-3 py-2 text-sm text-white"
        >
          + Ανέβασμα φωτογραφίας
        </Link>
      </header>

      <div className="mb-6 flex flex-wrap gap-2 text-sm">
        <Link
          href="/"
          className={`rounded-full border px-3 py-1 ${!tag && !person ? "bg-black text-white" : ""}`}
        >
          Όλες
        </Link>
        {(people ?? []).map((p) => (
          <Link
            key={p.id}
            href={`/?person=${encodeURIComponent(p.name)}`}
            className={`rounded-full border px-3 py-1 ${person === p.name ? "bg-black text-white" : ""}`}
          >
            {p.name}
          </Link>
        ))}
        {(tags ?? []).map((t) => (
          <Link
            key={t.id}
            href={`/?tag=${encodeURIComponent(t.name)}`}
            className={`rounded-full border px-3 py-1 ${tag === t.name ? "bg-black text-white" : ""}`}
          >
            #{t.name}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {(photos ?? []).map((photo) => (
          <Link
            key={photo.id}
            href={`/photo/${photo.id}`}
            className="group block overflow-hidden rounded-lg border"
          >
            <div className="relative aspect-square bg-neutral-100">
              <Image
                src={`/api/drive/image/${photo.drive_file_id}`}
                alt={photo.description ?? photo.filename}
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover transition group-hover:scale-105"
                unoptimized
              />
            </div>
            {photo.event_name && (
              <p className="truncate p-2 text-xs text-neutral-600">
                {photo.event_name}
              </p>
            )}
          </Link>
        ))}
      </div>

      {(photos ?? []).length === 0 && (
        <p className="mt-10 text-center text-neutral-500">
          Δεν βρέθηκαν φωτογραφίες.
        </p>
      )}
    </main>
  );
}
