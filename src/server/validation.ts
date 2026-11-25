export const MINIMUM_PASSWORD_LENGTH = 8;
export const MAXIMUM_POST_LENGTH = 280;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type Registration = {
  readonly name: string;
  readonly email: string;
  readonly password: string;
};

export type Credentials = {
  readonly email: string;
  readonly password: string;
};

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function registrationProblems(registration: Registration): string[] {
  const problems: string[] = [];
  if (registration.name.trim() === '') {
    problems.push('Please tell us your name');
  }
  if (!EMAIL_PATTERN.test(normalizeEmail(registration.email))) {
    problems.push('That does not look like an email address');
  }
  if (registration.password.length < MINIMUM_PASSWORD_LENGTH) {
    problems.push(`Your password needs at least ${MINIMUM_PASSWORD_LENGTH} characters`);
  }
  return problems;
}

export function postProblems(text: string): string[] {
  if (text.trim() === '') {
    return ['A post needs some text'];
  }
  if (text.length > MAXIMUM_POST_LENGTH) {
    return [`A post can be at most ${MAXIMUM_POST_LENGTH} characters`];
  }
  return [];
}
