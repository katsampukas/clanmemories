# ClanMemories

Οικογενειακό φωτογραφικό αρχείο. Οι φωτογραφίες μένουν στο Google Drive· η εφαρμογή προσθέτει login περιορισμένο σε συγκεκριμένα emails, tags/φίλτρα, tagging ατόμων, περιγραφή context/event/εποχής, και σχόλια ανά φωτογραφία.

**Stack:** Next.js (App Router) · Supabase (Postgres + Auth) · Google Drive API

## 1. Supabase

1. Δημιούργησε project στο [supabase.com](https://supabase.com).
2. Στο SQL Editor, τρέξε το περιεχόμενο του `supabase/migrations/0001_init.sql`.
3. Project Settings → API: πάρε το **Project URL** και το **anon public key**.
4. Authentication → Providers: βεβαιώσου ότι το **Email** provider είναι ενεργό (χρησιμοποιούμε magic link / OTP, όχι password).
5. Authentication → URL Configuration: πρόσθεσε το production URL σου (και `http://localhost:3000` για dev) στα **Redirect URLs**.
6. Πρόσθεσε τα επιτρεπόμενα emails στον πίνακα `allowed_emails` (SQL Editor):
   ```sql
   insert into allowed_emails (email, note) values
     ('kapoios@gmail.com', 'εξάδελφος'),
     ('allos@gmail.com', 'θεία');
   ```

## 2. Google Drive

Οι φωτογραφίες σου είναι πιθανότατα σε προσωπικό (όχι Workspace) Google Drive. Ένα **service account δεν έχει δικό του storage quota** σε προσωπικό Drive, οπότε τα uploads θα απέτυχαν αν χρησιμοποιούσαμε αυτή την προσέγγιση. Αντ' αυτού η εφαρμογή εξουσιοδοτείται μία φορά σαν **ο δικός σου λογαριασμός** μέσω OAuth, ώστε τα νέα αρχεία να μετράνε στο δικό σου quota.

1. Στο [Google Cloud Console](https://console.cloud.google.com/), δημιούργησε project και ενεργοποίησε το **Google Drive API**.
2. OAuth consent screen: τύπος **External**, πρόσθεσε τον εαυτό σου (και τυχόν άλλους συγγενείς-uploaders) ως test users. Δεν χρειάζεται verification αφού θα μείνει σε test mode.
3. Credentials → Create Credentials → OAuth client ID → τύπος **Desktop app**. Πάρε το **Client ID** και **Client Secret**.
4. Πάρε ένα **refresh token** για τον λογαριασμό σου με scope `https://www.googleapis.com/auth/drive`. Ευκολότερος τρόπος: [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground)
   - Πάνω δεξιά (⚙️) βάλε τα δικά σου Client ID/Secret ("Use your own OAuth credentials").
   - Στο βήμα 1, βάλε scope `https://www.googleapis.com/auth/drive`, Authorize, συνδέσου με τον λογαριασμό που έχει τις φωτογραφίες.
   - Στο βήμα 2, "Exchange authorization code for tokens" → πάρε το **Refresh token**.
5. Στο Drive, δημιούργησε (ή χρησιμοποίησε υπάρχοντα) φάκελο για τις φωτογραφίες. Το **Folder ID** είναι το τμήμα του URL μετά το `/folders/`.

## 3. Environment variables

Αντίγραψε το `.env.example` σε `.env.local` και συμπλήρωσε:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REFRESH_TOKEN=
GOOGLE_DRIVE_FOLDER_ID=
```

## 4. Τοπική εκτέλεση

```bash
npm install
npm run dev
```

Άνοιξε [http://localhost:3000](http://localhost:3000) — θα σε στείλει στο `/login`. Βάλε ένα από τα emails που πρόσθεσες στο `allowed_emails`.

## 5. Deploy

Πρότεινεται [Vercel](https://vercel.com) (native Next.js support). Πρόσθεσε τα ίδια env vars στο project settings. Πρόσεξε: όταν βάζεις το `GOOGLE_OAUTH_REFRESH_TOKEN`/secrets σε Vercel, επικόλλησε ακριβώς την τιμή (χωρίς επιπλέον escaping).

## Δομή

- `supabase/migrations/0001_init.sql` — schema (photos, people, tags, comments, allowed_emails) + Row Level Security.
- `src/lib/drive.ts` — ανάγνωση/ανέβασμα αρχείων στο Drive folder.
- `src/app/api/drive/image/[fileId]` — proxy που στριμάρει τα bytes της φωτογραφίας μόνο σε συνδεδεμένους χρήστες (τα αρχεία στο Drive δεν χρειάζεται να είναι public).
- `src/app/page.tsx` — gallery με φίλτρα ανά tag / άτομο.
- `src/app/photo/[id]` — σελίδα φωτογραφίας: tagging ατόμων, περιγραφή/event/εποχή/τοποθεσία, σχόλια.
- `src/app/upload` — φόρμα ανεβάσματος.

## Πιθανές επεκτάσεις

- Face detection για auto-suggest tagging ατόμων.
- Bulk import των ήδη σκαναρισμένων φωτογραφιών από το Drive (script που διαβάζει τον φάκελο και δημιουργεί εγγραφές `photos`).
- Πρόσβαση read-only vs read-write ανά email (π.χ. `role` column στο `allowed_emails`).
