export type Post = {
  readonly author: string;
  readonly text: string;
  readonly sharedAt: string;
};

export class Timeline {
  readonly #posts: Post[] = [];

  share(post: Post): void {
    this.#posts.push(post);
  }

  newestFirst(): readonly Post[] {
    return this.#posts.toReversed();
  }
}
