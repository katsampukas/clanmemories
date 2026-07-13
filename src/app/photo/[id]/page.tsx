import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PhotoEditor from "@/components/PhotoEditor";
import CommentsSection from "@/components/CommentsSection";

export const dynamic = "force-dynamic";

export default async function PhotoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: photo } = await supabase
    .from("photos")
    .select(
      "id, drive_file_id, filename, description, event_name, occurred_on, occurred_period, location, uploaded_by, created_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (!photo) notFound();

  const [{ data: peopleLinks }, { data: tagLinks }, { data: comments }] =
    await Promise.all([
      supabase
        .from("photo_people")
        .select("people(name)")
        .eq("photo_id", id),
      supabase.from("photo_tags").select("tags(name)").eq("photo_id", id),
      supabase
        .from("comments")
        .select("id, body, author_email, created_at")
        .eq("photo_id", id)
        .order("created_at", { ascending: true }),
    ]);

  const peopleNames = (peopleLinks ?? [])
    .map((r) => (r.people as unknown as { name: string } | null)?.name)
    .filter((n): n is string => Boolean(n));
  const tagNames = (tagLinks ?? [])
    .map((r) => (r.tags as unknown as { name: string } | null)?.name)
    .filter((n): n is string => Boolean(n));

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="relative mb-6 aspect-video w-full overflow-hidden rounded-lg bg-neutral-100">
        <Image
          src={`/api/drive/image/${photo.drive_file_id}`}
          alt={photo.description ?? photo.filename}
          fill
          className="object-contain"
          unoptimized
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <PhotoEditor
          photo={photo}
          initialPeople={peopleNames}
          initialTags={tagNames}
        />
        <CommentsSection photoId={photo.id} initialComments={comments ?? []} />
      </div>
    </main>
  );
}
