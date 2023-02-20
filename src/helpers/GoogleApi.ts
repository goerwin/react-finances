// https://developers.google.com/drive/api/v3/reference/files/get

import { GOOGLE_CLIENT_ID, GOOGLE_SERVICE_IDENTITY_CLIENT } from '../config';
import { loadScript } from './general';
import axios, { AxiosError } from 'axios';
import { z } from 'zod';

const GAPI_API_URL = 'https://www.googleapis.com';
const GOOGLE_DRIVE_UPLOAD_API_URL =
  'https://www.googleapis.com/upload/drive/v3';

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
  await loadScript('gisScript', GOOGLE_SERVICE_IDENTITY_CLIENT);
  return google;
}

export async function requestGapiAccessToken(attrs: {
  gapiClient: typeof gapi;
  googleClient: typeof google;
  clientId: string;
  scope: string;
  skipConsentOnNoToken?: true;
}) {
  return new Promise<google.accounts.oauth2.TokenResponse>((res, rej) => {
    const tokenClient = attrs.googleClient.accounts.oauth2.initTokenClient({
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

    if (attrs.gapiClient.client.getToken() === null)
      tokenClient.requestAccessToken({
        prompt: attrs.skipConsentOnNoToken ? '' : 'consent',
      });
    else tokenClient.requestAccessToken({ prompt: '' });
  });
}

export async function getNewAccessToken(
  clientSecret: string,
  refreshToken: string
) {
  return axios.post('https://oauth2.googleapis.com/token', {
    client_id: GOOGLE_CLIENT_ID,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });
}

// This function will retry functions that require accessTokens which can be expired,
// in that case, we will try to get a new accessToken using the refresh token in n tries
function renewAccessTokenRetrier<T>(
  tries: number,
  fn: (at: string, ...args: any[]) => Promise<T>
): (
  attrs: { at: string; rt: string; cs: string },
  ...args: any[]
) => Promise<{ data: T; accessToken?: string }> {
  return async (
    { at: accessToken, rt: refreshToken, cs: clientSecret },
    ...args
  ) => {
    let newAccessToken = accessToken;

    for (let i = 0; i < tries; i++) {
      try {
        const resp = await fn.call(null, newAccessToken, ...args);
        return {
          data: resp,
          accessToken:
            newAccessToken !== accessToken ? newAccessToken : undefined,
        };
      } catch (e: unknown) {
        if (!(e instanceof AxiosError)) break;
        if (e.response?.status !== 401) break;

        // it is an unauthorized 401 error, try get new accesstoken with refresh token
        newAccessToken = String(
          (await getNewAccessToken(clientSecret, refreshToken)).data
            .access_token
        );
      }
    }

    throw new Error('Max. number of tries attempted');
  };
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
export const getGoogleDriveElementInfo = renewAccessTokenRetrier(
  2,
  async function getGoogleDriveElementInfo(
    accessToken: string,
    attrs: { path: string }
  ): Promise<{ [x: string]: any } | null> {
    const { path } = attrs;

    if (!accessToken) return new Error('accessToken required');
    if (path === '') return { id: 'root' };

    const dirs = path.split('/');
    const newDirs = ['root', ...dirs];
    const dirIds = new Array(newDirs.length).fill({ id: 'root' });

    for (let i = 0; i < newDirs.length - 1; i++) {
      const parentDirId = dirIds?.[i]?.id;
      if (!parentDirId) return null;
      const q = `'${parentDirId}' in parents and name = '${newDirs[i + 1]}'`;

      const jsonResp = await axios.get(
        `${GAPI_API_URL}/drive/v3/files/?q=${q}`,
        {
          headers: { Authorization: 'Bearer ' + accessToken },
        }
      );

      dirIds[i + 1] = jsonResp.data.files[0];
    }

    return dirIds.at(-1);
  }
);

export const getGoogleDriveFileContent = renewAccessTokenRetrier(
  2,
  async function getGoogleDriveFileContentss(
    accessToken: string,
    attrs: { gdFileId: string }
  ) {
    return axios.get(
      `${GAPI_API_URL}/drive/v3/files/${attrs.gdFileId}?alt=media`,
      { headers: { Authorization: 'Bearer ' + accessToken } }
    );
  }
);

/**
 * Note: File inherits from Blob, meaning File is a Blob!
 */
export const uploadGoogleDriveFile = renewAccessTokenRetrier(
  2,
  async function uploadGoogleDriveFile(
    accessToken: string,
    attrs: { parents?: string[]; blob: Blob; name: string; mimeType: string }
  ) {
    const { parents, blob, name, mimeType } = attrs;
    const metadata = JSON.stringify({
      name, // Filename at Google Drive
      mimeType, // mimeType at Google Drive
      parents, // Folder IDs at Google Drive
    });

    // NOTE: order is important (Metadata first then media)
    const form = new FormData();
    form.append('Metadata', new Blob([metadata], { type: 'application/json' }));
    form.append('Media', blob);

    return axios.post(
      `${GOOGLE_DRIVE_UPLOAD_API_URL}/files?uploadType=multipart`,
      form,
      {
        headers: {
          Authorization: 'Bearer ' + accessToken,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
  }
);

export const updateGoogleDriveFile = renewAccessTokenRetrier(
  2,
  async function updateGoogleDriveFile(
    accessToken: string,
    attrs: { gdFileId: string; blob: Blob; metadata?: Record<string, string> }
  ) {
    const { gdFileId, metadata, blob } = attrs;
    let body: RequestInit['body'] = blob;
    const url = `${GOOGLE_DRIVE_UPLOAD_API_URL}/files/${gdFileId}?uploadType=${
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

    return axios.patch(url, body, {
      headers: {
        Authorization: 'Bearer ' + accessToken,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }
);
