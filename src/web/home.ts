import { fetchSession, fetchTimeline, sharePost, signOut, type Post } from './api.ts';
import { requireElement, showProblems, textField } from './dom.ts';
import { greetingFor } from './greeting.ts';

const SIGN_IN_PAGE = '/sign-in.html';

function postItem(post: Post): HTMLLIElement {
  const item = document.createElement('li');
  const text = document.createElement('p');
  text.textContent = post.text;
  const byline = document.createElement('small');
  byline.textContent = `${post.author} · ${new Date(post.sharedAt).toLocaleString()}`;
  item.append(text, byline);
  return item;
}

async function showTimeline(): Promise<void> {
  const posts = await fetchTimeline();
  requireElement('#timeline').replaceChildren(...posts.map(postItem));
}

function handleSharing(form: HTMLFormElement): void {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const problems = await sharePost(textField(form, 'text'));
    showProblems(form, problems);
    if (problems.length === 0) {
      form.reset();
      await showTimeline();
    }
  });
}

function handleSignOut(button: HTMLButtonElement): void {
  button.addEventListener('click', async () => {
    await signOut();
    location.assign(SIGN_IN_PAGE);
  });
}

async function start(): Promise<void> {
  const session = await fetchSession();
  if (session === undefined) {
    location.replace(SIGN_IN_PAGE);
    return;
  }
  requireElement('#greeting').textContent = greetingFor(session);
  handleSharing(requireElement<HTMLFormElement>('#share-form'));
  handleSignOut(requireElement<HTMLButtonElement>('#sign-out'));
  await showTimeline();
  requireElement<HTMLElement>('main').hidden = false;
}

await start();
