import { randomBytes } from 'node:crypto';
import { hashPassword, isMatchingPassword, type PasswordHash } from './passwords.ts';
import {
  normalizeEmail,
  registrationProblems,
  type Credentials,
  type Registration,
} from './validation.ts';

const CONFIRMATION_TOKEN_BYTES = 32;

type Member = {
  readonly name: string;
  readonly email: string;
  readonly passwordHash: PasswordHash;
  readonly isConfirmed: boolean;
  readonly hasSignedInBefore: boolean;
};

export type RegistrationOutcome =
  | { readonly kind: 'registered'; readonly name: string; readonly email: string; readonly confirmationToken: string }
  | { readonly kind: 'invalid'; readonly problems: readonly string[] }
  | { readonly kind: 'email-taken' };

export type SignInOutcome =
  | { readonly kind: 'signed-in'; readonly name: string; readonly email: string; readonly isNewMember: boolean }
  | { readonly kind: 'wrong-credentials' }
  | { readonly kind: 'unconfirmed' };

/** The member register. Kept in memory: the demo is about tests, not storage. */
export class Members {
  readonly #byEmail = new Map<string, Member>();
  readonly #emailByConfirmationToken = new Map<string, string>();

  async register(registration: Registration): Promise<RegistrationOutcome> {
    const problems = registrationProblems(registration);
    if (problems.length > 0) {
      return { kind: 'invalid', problems };
    }
    // Hash before the duplicate check, so check and insert happen without an await in between
    // and two simultaneous registrations for the same address cannot both succeed.
    const passwordHash = await hashPassword(registration.password);
    const email = normalizeEmail(registration.email);
    if (this.#byEmail.has(email)) {
      return { kind: 'email-taken' };
    }
    const name = registration.name.trim();
    this.#byEmail.set(email, { name, email, passwordHash, isConfirmed: false, hasSignedInBefore: false });
    const confirmationToken = randomBytes(CONFIRMATION_TOKEN_BYTES).toString('base64url');
    this.#emailByConfirmationToken.set(confirmationToken, email);
    return { kind: 'registered', name, email, confirmationToken };
  }

  /** Confirms the address the token was sent to. A token works once. */
  confirm(confirmationToken: string): boolean {
    const email = this.#emailByConfirmationToken.get(confirmationToken);
    const member = email === undefined ? undefined : this.#byEmail.get(email);
    if (member === undefined) {
      return false;
    }
    this.#emailByConfirmationToken.delete(confirmationToken);
    this.#byEmail.set(member.email, { ...member, isConfirmed: true });
    return true;
  }

  async signIn(credentials: Credentials): Promise<SignInOutcome> {
    const member = this.#byEmail.get(normalizeEmail(credentials.email));
    if (member === undefined || !(await isMatchingPassword(credentials.password, member.passwordHash))) {
      return { kind: 'wrong-credentials' };
    }
    // Checked after the password, so only the owner of the account learns it is unconfirmed.
    if (!member.isConfirmed) {
      return { kind: 'unconfirmed' };
    }
    this.#byEmail.set(member.email, { ...member, hasSignedInBefore: true });
    return { kind: 'signed-in', name: member.name, email: member.email, isNewMember: !member.hasSignedInBefore };
  }
}
