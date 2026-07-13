import { Readable } from "stream";
import { createClient } from "@/lib/supabase/server";
import { streamDriveFile } from "@/lib/drive";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { fileId } = await params;

  const { data: photo } = await supabase
    .from("photos")
    .select("id")
    .eq("drive_file_id", fileId)
    .maybeSingle();

  if (!photo) {
    return new Response("Not found", { status: 404 });
  }

  const stream = await streamDriveFile(fileId);
  const webStream = Readable.toWeb(stream) as ReadableStream;

  return new Response(webStream, {
    headers: {
      "Cache-Control": "private, max-age=3600",
    },
  });
}
