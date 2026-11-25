import { fetchSession, register, signIn } from './api.ts';
import { requireElement, showNotice, showProblems, textField } from './dom.ts';

const HOME_PAGE = '/';
const CONFIRMED_PARAMETER = 'confirmed';

function handleSignIn(form: HTMLFormElement): void {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const problems = await signIn({ email: textField(form, 'email'), password: textField(form, 'password') });
    if (problems.length === 0) {
      location.assign(HOME_PAGE);
      return;
    }
    showProblems(form, problems);
  });
}

function handleRegistration(form: HTMLFormElement): void {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = textField(form, 'name');
    const problems = await register({ name, email: textField(form, 'email'), password: textField(form, 'password') });
    showProblems(form, problems);
    if (problems.length === 0) {
      form.reset();
      showNotice(`Thanks, ${name}! Check your inbox for a link to confirm your email address.`);
    }
  });
}

async function start(): Promise<void> {
  if ((await fetchSession()) !== undefined) {
    location.replace(HOME_PAGE);
    return;
  }
  if (new URLSearchParams(location.search).has(CONFIRMED_PARAMETER)) {
    showNotice('Your email address is confirmed. You can sign in now.');
  }
  handleSignIn(requireElement<HTMLFormElement>('#sign-in-form'));
  handleRegistration(requireElement<HTMLFormElement>('#register-form'));
}

await start();
