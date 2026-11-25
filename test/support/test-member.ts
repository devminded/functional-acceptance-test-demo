import { randomUUID } from 'node:crypto';

export type Credentials = { readonly email: string; readonly password: string };
export type Registration = Credentials & { readonly name: string };

const PASSWORD = 'Secret123';

/**
 * A registration nobody has used before. The address is unique per call, so tests running in
 * parallel against the same app never meet each other's members.
 */
export function aNewMemberCalled(name: string): Registration {
  return { name, email: `${name.toLowerCase()}.${randomUUID()}@example.com`, password: PASSWORD };
}

/** Distinctive text, so a test can find its own post among everything others have shared. */
export function aPostAbout(subject: string): string {
  return `${subject} (${randomUUID().slice(0, 8)})`;
}
