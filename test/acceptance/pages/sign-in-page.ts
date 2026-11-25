import type { Locator, Page } from '@playwright/test';
import type { Credentials, Registration } from '../../support/test-member.ts';

export class SignInPage {
  static readonly path = '/sign-in.html';

  readonly heading: Locator;
  readonly notice: Locator;
  readonly signInError: Locator;
  readonly #page: Page;
  readonly #signInForm: Locator;
  readonly #registerForm: Locator;

  constructor(page: Page) {
    this.#page = page;
    this.heading = page.getByRole('heading', { name: 'Sign in' });
    this.notice = page.getByRole('status');
    this.#signInForm = page.getByRole('form', { name: 'Sign in' });
    this.#registerForm = page.getByRole('form', { name: 'New here? Join us' });
    this.signInError = this.#signInForm.getByRole('alert');
  }

  async open(): Promise<void> {
    await this.#page.goto(SignInPage.path);
  }

  async signIn(credentials: Credentials): Promise<void> {
    await this.#signInForm.getByLabel('Email address').fill(credentials.email);
    await this.#signInForm.getByLabel('Password').fill(credentials.password);
    await this.#signInForm.getByRole('button', { name: 'Sign in' }).click();
  }

  async register(registration: Registration): Promise<void> {
    await this.#registerForm.getByLabel('Name').fill(registration.name);
    await this.#registerForm.getByLabel('Email address').fill(registration.email);
    await this.#registerForm.getByLabel('Password').fill(registration.password);
    await this.#registerForm.getByRole('button', { name: 'Register' }).click();
  }
}
