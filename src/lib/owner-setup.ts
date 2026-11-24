import { createHash } from "node:crypto";

export const OWNER_SETUP_ID = "owner";

export function hashAuthToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
