"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UploadPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    setSubmitting(false);

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Σφάλμα" }));
      setError(error);
      return;
    }

    const { id } = await res.json();
    router.push(`/photo/${id}`);
  }

  return (
    <main className="mx-auto max-w-lg p-6">
      <h1 className="mb-6 text-xl font-semibold">Ανέβασμα φωτογραφίας</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Αρχείο
          <input type="file" name="file" accept="image/*" required />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Περιγραφή / context
          <textarea
            name="description"
            rows={3}
            className="rounded border border-neutral-300 px-3 py-2"
            placeholder="Τι συμβαίνει στη φωτογραφία..."
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Event
          <input
            name="event_name"
            className="rounded border border-neutral-300 px-3 py-2"
            placeholder="π.χ. Γάμος, Πάσχα..."
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Ημερομηνία (αν γνωστή)
            <input
              type="date"
              name="occurred_on"
              className="rounded border border-neutral-300 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Περίοδος (αν όχι ακριβής)
            <input
              name="occurred_period"
              className="rounded border border-neutral-300 px-3 py-2"
              placeholder="π.χ. δεκαετία '70"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          Τοποθεσία
          <input
            name="location"
            className="rounded border border-neutral-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Άτομα (χωρισμένα με κόμμα)
          <input
            name="people"
            className="rounded border border-neutral-300 px-3 py-2"
            placeholder="Γιαγιά Μαργαρίτα, Παππούς Νίκος"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Tags (χωρισμένα με κόμμα)
          <input
            name="tags"
            className="rounded border border-neutral-300 px-3 py-2"
            placeholder="γάμος, χριστούγεννα"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
        >
          {submitting ? "Ανεβαίνει..." : "Ανέβασμα"}
        </button>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </main>
  );
}
