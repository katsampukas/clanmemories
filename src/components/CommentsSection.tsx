"use client";

import { useState } from "react";

type Comment = {
  id: string;
  body: string;
  author_email: string;
  created_at: string;
};

export default function CommentsSection({
  photoId,
  initialComments,
}: {
  photoId: string;
  initialComments: Comment[];
}) {
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/photos/${photoId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    setSubmitting(false);
    if (res.ok) {
      const { comment } = await res.json();
      setComments((prev) => [...prev, comment]);
      setBody("");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold">Σχόλια</h2>
      <ul className="flex flex-col gap-2">
        {comments.map((c) => (
          <li key={c.id} className="rounded border p-2 text-sm">
            <p>{c.body}</p>
            <p className="mt-1 text-xs text-neutral-500">
              {c.author_email} ·{" "}
              {new Date(c.created_at).toLocaleString("el-GR")}
            </p>
          </li>
        ))}
        {comments.length === 0 && (
          <p className="text-sm text-neutral-500">Δεν υπάρχουν σχόλια ακόμα.</p>
        )}
      </ul>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Γράψε ένα σχόλιο..."
          className="flex-1 rounded border border-neutral-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          Αποστολή
        </button>
      </form>
    </div>
  );
}
