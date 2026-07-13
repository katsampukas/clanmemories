"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Photo = {
  id: string;
  description: string | null;
  event_name: string | null;
  occurred_on: string | null;
  occurred_period: string | null;
  location: string | null;
};

export default function PhotoEditor({
  photo,
  initialPeople,
  initialTags,
}: {
  photo: Photo;
  initialPeople: string[];
  initialTags: string[];
}) {
  const router = useRouter();
  const [description, setDescription] = useState(photo.description ?? "");
  const [eventName, setEventName] = useState(photo.event_name ?? "");
  const [occurredOn, setOccurredOn] = useState(photo.occurred_on ?? "");
  const [occurredPeriod, setOccurredPeriod] = useState(
    photo.occurred_period ?? ""
  );
  const [location, setLocation] = useState(photo.location ?? "");
  const [people, setPeople] = useState(initialPeople.join(", "));
  const [tags, setTags] = useState(initialTags.join(", "));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await fetch(`/api/photos/${photo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description,
        event_name: eventName,
        occurred_on: occurredOn,
        occurred_period: occurredPeriod,
        location,
        people: people.split(",").map((s) => s.trim()).filter(Boolean),
        tags: tags.split(",").map((s) => s.trim()).filter(Boolean),
      }),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Περιγραφή / context
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="rounded border border-neutral-300 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Event
        <input
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          className="rounded border border-neutral-300 px-3 py-2"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Ημερομηνία
          <input
            type="date"
            value={occurredOn}
            onChange={(e) => setOccurredOn(e.target.value)}
            className="rounded border border-neutral-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Περίοδος
          <input
            value={occurredPeriod}
            onChange={(e) => setOccurredPeriod(e.target.value)}
            className="rounded border border-neutral-300 px-3 py-2"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Τοποθεσία
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="rounded border border-neutral-300 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Άτομα (χωρισμένα με κόμμα)
        <input
          value={people}
          onChange={(e) => setPeople(e.target.value)}
          className="rounded border border-neutral-300 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Tags (χωρισμένα με κόμμα)
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="rounded border border-neutral-300 px-3 py-2"
        />
      </label>

      <button
        onClick={handleSave}
        disabled={saving}
        className="self-start rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
      >
        {saving ? "Αποθήκευση..." : saved ? "Αποθηκεύτηκε ✓" : "Αποθήκευση"}
      </button>
    </div>
  );
}
