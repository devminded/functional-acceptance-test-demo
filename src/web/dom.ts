export function requireElement<T extends Element>(selector: string, root: ParentNode = document): T {
  const element = root.querySelector<T>(selector);
  if (element === null) {
    throw new Error(`The page has no element matching ${selector}`);
  }
  return element;
}

export function textField(form: HTMLFormElement, name: string): string {
  const value = new FormData(form).get(name);
  if (typeof value !== 'string') {
    throw new Error(`The form has no text field called ${name}`);
  }
  return value;
}

export function showProblems(form: HTMLFormElement, problems: readonly string[]): void {
  const error = requireElement<HTMLElement>('.error', form);
  error.textContent = problems.join(' ');
  error.hidden = problems.length === 0;
}

export function showNotice(message: string): void {
  const notice = requireElement<HTMLElement>('#notice');
  notice.textContent = message;
  notice.hidden = false;
}
