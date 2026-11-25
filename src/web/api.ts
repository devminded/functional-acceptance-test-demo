export type Session = { readonly name: string; readonly isNewMember: boolean };
export type Post = { readonly author: string; readonly text: string; readonly sharedAt: string };
export type Credentials = { readonly email: string; readonly password: string };
export type Registration = Credentials & { readonly name: string };

const UNAUTHORIZED = 401;

async function send(method: 'GET' | 'POST' | 'DELETE', path: string, body?: unknown): Promise<Response> {
  if (body === undefined) {
    return fetch(path, { method });
  }
  return fetch(path, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
}

/** The problems the server reported, or none when the request succeeded. */
async function problemsIn(response: Response): Promise<readonly string[]> {
  if (response.ok) {
    return [];
  }
  const body = (await response.json()) as { problems?: string[]; message?: string };
  return body.problems ?? [body.message ?? `Something went wrong (${response.status})`];
}

async function requireOk(response: Response, action: string): Promise<Response> {
  if (!response.ok) {
    throw new Error(`Could not ${action}: ${response.status}`);
  }
  return response;
}

export async function fetchSession(): Promise<Session | undefined> {
  const response = await send('GET', '/api/session');
  if (response.status === UNAUTHORIZED) {
    return undefined;
  }
  return (await requireOk(response, 'check the session')).json() as Promise<Session>;
}

export async function register(registration: Registration): Promise<readonly string[]> {
  return problemsIn(await send('POST', '/api/members', registration));
}

export async function signIn(credentials: Credentials): Promise<readonly string[]> {
  return problemsIn(await send('POST', '/api/session', credentials));
}

export async function signOut(): Promise<void> {
  await requireOk(await send('DELETE', '/api/session'), 'sign out');
}

export async function fetchTimeline(): Promise<readonly Post[]> {
  return (await requireOk(await send('GET', '/api/posts'), 'load the timeline')).json() as Promise<Post[]>;
}

export async function sharePost(text: string): Promise<readonly string[]> {
  return problemsIn(await send('POST', '/api/posts', { text }));
}
