// @ts-ignore -- vinext/server may not publish TypeScript declarations.
import handler from "vinext/server";

declare namespace Cloudflare {
  interface Env {
    [key: string]: unknown;
  }
}

export default {
  fetch(request: Request, env: Cloudflare.Env, ctx: Parameters<typeof handler.fetch>[2]) {
    return handler.fetch(request, env, ctx);
  },
};
