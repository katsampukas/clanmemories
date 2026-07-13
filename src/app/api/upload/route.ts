import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadDriveFile } from "@/lib/drive";
import { replacePhotoPeople, replacePhotoTags } from "@/lib/taxonomy";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Λείπει αρχείο" }, { status: 400 });
  }

  const description = (form.get("description") as string) || undefined;
  const eventName = (form.get("event_name") as string) || undefined;
  const occurredOn = (form.get("occurred_on") as string) || undefined;
  const occurredPeriod = (form.get("occurred_period") as string) || undefined;
  const location = (form.get("location") as string) || undefined;
  const peopleRaw = (form.get("people") as string) || "";
  const tagsRaw = (form.get("tags") as string) || "";

  const buffer = Buffer.from(await file.arrayBuffer());
  const driveFile = await uploadDriveFile(
    file.name,
    file.type || "image/jpeg",
    buffer
  );

  if (!driveFile.id) {
    return NextResponse.json(
      { error: "Αποτυχία ανεβάσματος στο Drive" },
      { status: 502 }
    );
  }

  const { data: photo, error } = await supabase
    .from("photos")
    .insert({
      drive_file_id: driveFile.id,
      filename: file.name,
      description,
      event_name: eventName,
      occurred_on: occurredOn || null,
      occurred_period: occurredPeriod,
      location,
      uploaded_by: user.email,
    })
    .select("id")
    .single();

  if (error || !photo) {
    return NextResponse.json(
      { error: error?.message ?? "Αποτυχία αποθήκευσης" },
      { status: 400 }
    );
  }

  const people = peopleRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const tags = tagsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (people.length) await replacePhotoPeople(supabase, photo.id, people);
  if (tags.length) await replacePhotoTags(supabase, photo.id, tags);

  return NextResponse.json({ id: photo.id });
}
