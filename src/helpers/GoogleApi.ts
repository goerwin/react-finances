// This is meant to be used on the browser
// It will require refreshToken, ClientSecret and ClientId

import axios, { AxiosError } from 'axios';

const GAPI_API_URL = 'https://www.googleapis.com';
const GOOGLE_DRIVE_UPLOAD_API_URL =
  'https://www.googleapis.com/upload/drive/v3';

type RemoveFirstFromArray<T extends unknown[]> = T extends [infer _, ...infer R]
  ? R
  : never;

type GetSecondItemOfArray<T extends unknown[]> = T extends [
  infer _,
  infer R,
  ...infer _R
]
  ? R
  : never;

function stringifyAxiosErrorData(error: any): string {
  try {
    if (error instanceof AxiosError)
      return JSON.stringify(error.response?.data);
    throw '';
  } catch {
    // TODO: error: any yikes
    return error?.message || '';
  }
}

let localStorageNamespace = 'googleApiHelpers_';
export function setLocalStorageNamespace(namespace: string) {
  localStorageNamespace = namespace;
}

function setLSAccessToken(at: string) {
  return localStorage.setItem(`${localStorageNamespace}_at`, at);
}

function getLSAccessToken() {
  return localStorage.getItem(`${localStorageNamespace}_at`) || '';
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

export async function getNewAccessToken(cid: string, cs: string, rt: string) {
  return axios.post('https://oauth2.googleapis.com/token', {
    client_id: cid,
    client_secret: cs,
    grant_type: 'refresh_token',
    refresh_token: rt,
  });
}

// This function will retry functions that require accessTokens which can be expired,
// in that case, we will try to get a new accessToken using the refresh token in n tries
function renewAccessTokenRetrier<T, R extends unknown[]>(
  tries: number,
  fn: (at: string, ...args: R) => Promise<T>
): (
  attrs: { cid: string; at: string; rt: string; cs: string },
  ...restArgs: RemoveFirstFromArray<Parameters<typeof fn>>
) => Promise<{ data: T; accessToken?: string }> {
  return async ({ cid, at, rt, cs }, ...restArgs) => {
    let newAccessToken = at;
    let error: unknown;

    for (let i = 0; i < tries; i++) {
      try {
        // TODO: Remove this any. Hard to do
        const data = await fn.call(null, newAccessToken, ...(restArgs as any));
        return {
          data,
          accessToken: newAccessToken !== at ? newAccessToken : undefined,
        };
      } catch (e: unknown) {
        error = e;
        if (!(e instanceof AxiosError)) break;
        if (e.response?.status !== 401 && e.response?.status !== 403) break;

        // it is an unauthorized 401/403 error, try get new accesstoken with refresh token
        newAccessToken = String(
          (await getNewAccessToken(cid, cs, rt)).data.access_token
        );
      }
    }

    throw new Error(
      `Max. number of tries attempted. Error: ${stringifyAxiosErrorData(error)}`
    );
  };
}

const renewAccessTokenRetrierWithAutoSaveAccessToken = <T, R extends unknown[]>(
  ...args: Parameters<typeof renewAccessTokenRetrier<T, R>>
): ((
  attrs: { rt: string; cs: string; cid: string },
  ...restArgs: RemoveFirstFromArray<
    Parameters<
      GetSecondItemOfArray<Parameters<typeof renewAccessTokenRetrier<T, R>>>
    >
  >
) => Promise<T>) => {
  if (!localStorageNamespace) throw new Error('NoLocalStorageNamespace');

  return async ({ rt, cs, cid }, ...restArgs) => {
    const renewAccessTokenRetrierEl = renewAccessTokenRetrier<T, R>(...args);
    const { data, accessToken } = await renewAccessTokenRetrierEl(
      { at: getLSAccessToken(), rt, cs, cid },
      ...restArgs
    );

    if (accessToken) setLSAccessToken(accessToken);
    return data;
  };
};

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
export const getGoogleDriveElementInfo =
  renewAccessTokenRetrierWithAutoSaveAccessToken(
    2,
    async function getGoogleDriveElementInfo(
      accessToken: string,
      attrs: { path: string }
    ): Promise<{ [x: string]: any } | null> {
      const { path } = attrs;

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

export const getGoogleDriveElementInfoById =
  renewAccessTokenRetrierWithAutoSaveAccessToken(
    2,
    async function getGoogleDriveElementInfoById(
      accessToken: string,
      attrs: { gdElementId: string }
    ) {
      return axios.get(
        `${GAPI_API_URL}/drive/v3/files/${attrs.gdElementId}/?fields=id,kind,name,mimeType,owners,isAppAuthorized`,
        { headers: { Authorization: 'Bearer ' + accessToken } }
      );
    }
  );

export const getGoogleDriveFileContent =
  renewAccessTokenRetrierWithAutoSaveAccessToken(
    2,
    async function getGoogleDriveFileContent(
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
export const uploadGoogleDriveFile =
  renewAccessTokenRetrierWithAutoSaveAccessToken(
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
      form.append(
        'Metadata',
        // TODO: Not sure if type application/json can be replaced by mimeType
        new Blob([metadata], { type: 'application/json' })
      );
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

export const updateGoogleDriveFile =
  renewAccessTokenRetrierWithAutoSaveAccessToken(
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

export const deleteGoogleDriveFile =
  renewAccessTokenRetrierWithAutoSaveAccessToken(
    2,
    async function deleteGoogleDriveFile(
      accessToken: string,
      attrs: { gdFileId: string }
    ) {
      const { gdFileId } = attrs;
      const url = `${GAPI_API_URL}/drive/v3/files/${gdFileId}`;

      return axios.delete(url, {
        headers: {
          Authorization: 'Bearer ' + accessToken,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
    }
  );
