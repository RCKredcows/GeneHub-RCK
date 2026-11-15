/**
 * The platform's public address, from PUBLIC_SITE_URL: https in production,
 * http://dev.localhost:5173 on a local stack.
 *
 * Required, with no fallback. A default domain baked in here once meant a
 * missing secret sent customers to a different app's address, silently.
 */
export function siteUrl(): URL {
  const value = Deno.env.get('PUBLIC_SITE_URL')
  if (!value) throw new Error('PUBLIC_SITE_URL is not set')
  return new URL(value)
}

/**
 * A workspace's own origin, `<slug>.<site host>`, keeping the site's scheme.
 * Sessions live on that origin, so every link meant for a member goes there
 * rather than to the apex, which has no login.
 */
export function workspaceUrl(slug: string): string {
  const { protocol, host } = siteUrl()
  return `${protocol}//${slug}.${host}`
}
