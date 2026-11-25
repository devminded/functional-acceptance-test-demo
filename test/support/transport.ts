export type ApiRequest = {
  readonly method: 'GET' | 'POST' | 'DELETE';
  readonly path: string;
  readonly body?: unknown;
};

export type ApiResponse = {
  readonly status: number;
  readonly body: unknown;
  readonly location?: string;
};

/**
 * How a request reaches the app. Functional tests send it in-process; acceptance tests send it
 * over HTTP through the same browser context the actor uses, so they share its cookies.
 * Redirects are never followed, so tests can see them.
 */
export type Transport = (request: ApiRequest) => Promise<ApiResponse>;
