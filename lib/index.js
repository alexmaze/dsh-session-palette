/**
 * Host half of the session palette. It has no host-side behavior: the Loader
 * row exists so @deepseek-ai/dsh-client-modules can discover and serve the
 * package's browser half (lib/client.js) through the package's `dsh.client`
 * declaration.
 */
export function apply() {}
