import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { body } = await req.json();

  if (!body || typeof body !== "string" || !body.trim()) {
    return NextResponse.json({ error: "Empty comment" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({ photo_id: id, author_email: user.email, body: body.trim() })
    .select("id, body, author_email, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ comment: data });
}
