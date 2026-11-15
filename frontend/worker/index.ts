/**
 * Runs only for requests that match no file in dist/ and are not page
 * navigations: files that exist, and navigations to app routes, are served
 * straight from static assets without invoking this.
 *
 * Without it, single-page-application fallback answers every miss with
 * index.html -- including a stale /assets/ chunk requested after a deploy,
 * which _headers then marks immutable for a year, so the browser caches HTML
 * as that script. A missing asset gets a real 404 instead. Anything else
 * (curl, link previews, Stripe's site review) still gets the app shell.
 */

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

export default {
  fetch(request: Request, env: Env): Promise<Response> | Response {
    if (new URL(request.url).pathname.startsWith('/assets/')) {
      return new Response('Not found', { status: 404 });
    }
    return env.ASSETS.fetch(request);
  },
};
