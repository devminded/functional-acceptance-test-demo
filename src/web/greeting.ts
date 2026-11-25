import type { Session } from './api.ts';

export function greetingFor(session: Session): string {
  if (session.isNewMember) {
    return `Welcome to Postboard, ${session.name}! Glad to have you as a new member.`;
  }
  return `Welcome back, ${session.name}!`;
}
