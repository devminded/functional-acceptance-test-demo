import { randomBytes } from 'node:crypto';

const SESSION_ID_BYTES = 32;

export type Session = {
  readonly name: string;
  readonly email: string;
  readonly isNewMember: boolean;
};

export class Sessions {
  readonly #byId = new Map<string, Session>();

  start(session: Session): string {
    const id = randomBytes(SESSION_ID_BYTES).toString('base64url');
    this.#byId.set(id, session);
    return id;
  }

  find(id: string | undefined): Session | undefined {
    return id === undefined ? undefined : this.#byId.get(id);
  }

  end(id: string | undefined): void {
    if (id !== undefined) {
      this.#byId.delete(id);
    }
  }
}
