// Cloudflare Workers provides this runtime module; allow projects without its ambient types.
// @ts-ignore
import { env } from "cloudflare:workers";
// @ts-ignore -- Drizzle D1 adapter types may be unavailable in this project setup.
import { drizzle } from "drizzle-orm/d1";

export function getDb() {
  if (!env.DB)
    throw new Error(
      "Database binding DB is unavailable. Check wrangler.jsonc.",
    );
  return drizzle(env.DB);
}
