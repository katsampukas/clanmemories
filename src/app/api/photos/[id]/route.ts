import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { replacePhotoPeople, replacePhotoTags } from "@/lib/taxonomy";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const {
    description,
    event_name,
    occurred_on,
    occurred_period,
    location,
    people,
    tags,
  } = body as {
    description?: string;
    event_name?: string;
    occurred_on?: string | null;
    occurred_period?: string;
    location?: string;
    people?: string[];
    tags?: string[];
  };

  const { error: updateError } = await supabase
    .from("photos")
    .update({
      description,
      event_name,
      occurred_on: occurred_on || null,
      occurred_period,
      location,
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  if (Array.isArray(people)) {
    await replacePhotoPeople(supabase, id, people);
  }
  if (Array.isArray(tags)) {
    await replacePhotoTags(supabase, id, tags);
  }

  return NextResponse.json({ ok: true });
}
