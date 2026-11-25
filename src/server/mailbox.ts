import { normalizeEmail } from './validation.ts';

export type Email = {
  readonly to: string;
  readonly subject: string;
  readonly body: string;
  readonly link: string;
};

/**
 * Stands in for a mail provider: the demo sends no real email. Sent mail stays here, which is
 * what lets tests follow a confirmation link the way a member would from their inbox.
 */
export class Mailbox {
  readonly #sent: Email[] = [];

  send(email: Email): void {
    this.#sent.push(email);
  }

  emailsTo(address: string): readonly Email[] {
    const recipient = normalizeEmail(address);
    return this.#sent.filter((email) => email.to === recipient);
  }
}
