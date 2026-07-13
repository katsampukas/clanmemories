import { google } from "googleapis";
import type { Readable } from "stream";

// Uses OAuth 2.0 with a refresh token for a real Google account (not a
// service account): service accounts have no storage quota of their own on
// a personal (non-Workspace) Drive, so uploads from one fail. Authorizing
// as a real account means files count against that account's own quota.
function getAuth() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET / GOOGLE_OAUTH_REFRESH_TOKEN env vars"
    );
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
}

function driveClient() {
  return google.drive({ version: "v3", auth: getAuth() });
}

export const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID!;

export async function listDriveFiles(pageToken?: string) {
  const drive = driveClient();
  const res = await drive.files.list({
    q: `'${DRIVE_FOLDER_ID}' in parents and trashed = false and mimeType contains 'image/'`,
    fields:
      "nextPageToken, files(id, name, mimeType, createdTime, imageMediaMetadata)",
    pageSize: 100,
    pageToken,
    orderBy: "createdTime desc",
  });
  return { files: res.data.files ?? [], nextPageToken: res.data.nextPageToken };
}

export async function getDriveFileMeta(fileId: string) {
  const drive = driveClient();
  const res = await drive.files.get({
    fileId,
    fields: "id, name, mimeType, createdTime, imageMediaMetadata",
  });
  return res.data;
}

export async function streamDriveFile(fileId: string) {
  const drive = driveClient();
  const res = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "stream" }
  );
  return res.data as Readable;
}

export async function uploadDriveFile(
  filename: string,
  mimeType: string,
  body: Readable | Buffer
) {
  const drive = driveClient();
  const res = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [DRIVE_FOLDER_ID],
    },
    media: {
      mimeType,
      body: body as never,
    },
    fields: "id, name, mimeType, createdTime",
  });
  return res.data;
}
