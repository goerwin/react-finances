// https://developers.google.com/drive/api/v3/reference/files/get

const GAPI_API_URL = 'https://www.googleapis.com';
const GOOGLE_DRIVE_UPLOAD_API_URL =
  'https://www.googleapis.com/upload/drive/v3';

let loadScriptPromises: Record<
  string,
  { promise: Promise<any>; domEl: HTMLElement } | undefined
> = {};

/** Loads any script via Promises */
async function loadScript(scriptId: string, scriptUrl: string) {
  // if script promise already set, return it

  if (loadScriptPromises[scriptId])
    return loadScriptPromises[scriptId]?.promise;

  // add script to the body
  const scriptDomEl = document.createElement('script');
  scriptDomEl.id = scriptId;
  document.body.appendChild(scriptDomEl);
  scriptDomEl.src = scriptUrl;

  const promise = new Promise((resolve, reject) => {
    scriptDomEl.onload = resolve;
    scriptDomEl.onerror = (err) => {
      loadScriptPromises[scriptId] = undefined;
      document.getElementById(scriptId);
      scriptDomEl.remove();
      reject(err);
    };
  });

  loadScriptPromises[scriptId] = { domEl: scriptDomEl, promise };
  return promise;
}

/**
 * Callback after the API client is loaded. Loads the
 * discovery doc to initialize the API.
 */
export async function loadGapiClient(attrs: { apiKey: string }) {
  await loadScript('gapiScript', 'https://apis.google.com/js/api.js');

  return new Promise<typeof gapi>((res, rej) => {
    gapi.load('client', async () => {
      try {
        await gapi.client.init({
          apiKey: attrs.apiKey,
          discoveryDocs: [
            'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
          ],
        });

        res(gapi);
      } catch (error) {
        rej(error);
      }
    });
  });
}

export async function loadGISClient() {
  await loadScript('gisScript', 'https://accounts.google.com/gsi/client');
  return google;
}

export async function requestGapiAccessToken(attrs: {
  gapi: typeof gapi;
  google: typeof google;
  clientId: string;
  scope: string;
  skipConsentOnNoToken?: true;
}) {
  return new Promise<google.accounts.oauth2.TokenResponse>((res, rej) => {
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: attrs.clientId,
      scope: attrs.scope,

      callback: (resp) => {
        if (resp.error !== undefined) return rej(resp);
        res(resp);
      },
      error_callback: (resp: any) => {
        rej(resp);
      },
    } as google.accounts.oauth2.TokenClientConfig);

    if (attrs.gapi.client.getToken() === null)
      tokenClient.requestAccessToken({
        prompt: attrs.skipConsentOnNoToken ? '' : 'consent',
      });
    else tokenClient.requestAccessToken({ prompt: '' });
  });
}

/**
 * You need to recursively navigate using the query syntax
 * provided by google drive api.
 *
 * For eg. If you want to search for path1/path2/file.json
 *
 * 'root' in parents and name = 'path1' and mimeType = 'application/vnd.google-apps.folder'
 *
 * and pick the first result, then get the folderId and
 *
 * '<id of path1>' in parents and name = 'path2' and mimeType = 'application/vnd.google-apps.folder'
 *
 * and finally, get the file
 *
 * '<id of path2>' in parents and name = 'file.json' and mimeType != 'application/vnd.google-apps.folder'
 *
 * https://stackoverflow.com/a/17276092/1623282
 *
 */
export async function getGoogleDriveElementInfo(attrs: {
  path: string;
  gapi: typeof gapi;
  accessToken: string;
}) {
  const { path, gapi, accessToken } = attrs;

  if (!accessToken) return new Error('accessToken required');
  if (path === '') return { id: 'root' };

  const dirs = path.split('/');
  const newDirs = ['root', ...dirs];
  const dirIds = new Array(newDirs.length).fill({ id: 'root' });

  for (let i = 0; i < newDirs.length - 1; i++) {
    const parentDirId = dirIds?.[i]?.id;
    if (!parentDirId) return null;
    const q = `'${parentDirId}' in parents and name = '${newDirs[i + 1]}'`;
    const response = await (gapi.client as any).drive.files.list({ q });
    dirIds[i + 1] = response.result.files[0];
  }

  return dirIds.at(-1);
}

export async function getGoogleDriveFileContent(attrs: {
  path: string;
  gapi: typeof gapi;
  accessToken: string;
}) {
  const { path, accessToken } = attrs;

  const gdElInfo = await getGoogleDriveElementInfo({ path, gapi, accessToken });

  const fileId: string | undefined = gdElInfo?.id;

  if (!fileId) return;

  return fetch(`${GAPI_API_URL}/drive/v3/files/${fileId}?alt=media`, {
    method: 'GET',
    headers: { Authorization: 'Bearer ' + accessToken },
  });
}

/**
 * Note: File inherits from Blob, meaning File is a Blob!
 */
export async function uploadGoogleDriveFile(attrs: {
  accessToken: string;
  parents?: string[];
  blob: Blob;
  name: string;
  mimeType: string;
}) {
  const { accessToken, parents, blob, name, mimeType } = attrs;
  const metadata = JSON.stringify({
    name, // Filename at Google Drive
    mimeType, // mimeType at Google Drive
    parents, // Folder IDs at Google Drive
  });

  // NOTE: order is important (Metadata first then media)
  const form = new FormData();
  form.append('Metadata', new Blob([metadata], { type: 'application/json' }));
  form.append('Media', blob);

  return await fetch(
    `${GOOGLE_DRIVE_UPLOAD_API_URL}/files?uploadType=multipart`,
    {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + accessToken },
      body: form,
    }
  );
}

export async function updateGoogleDriveFile(attrs: {
  accessToken: string;
  fileId: string;
  blob: Blob;
  metadata?: Record<string, string>;
}) {
  const { fileId, accessToken, metadata, blob } = attrs;
  let body: RequestInit['body'] = blob;
  const url = `${GOOGLE_DRIVE_UPLOAD_API_URL}/files/${fileId}?uploadType=${
    metadata ? 'multipart' : 'media'
  }`;

  if (metadata) {
    // NOTE: order is important (Metadata first then media)
    const form = new FormData();
    form.append(
      'Metadata',
      new Blob([JSON.stringify(metadata)], { type: 'application/json' })
    );
    form.append('Media', blob);
    body = form;
  }

  return fetch(url, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer ' + accessToken },
    body,
  });
}
