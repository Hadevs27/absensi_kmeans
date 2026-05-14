import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { mkdirSync } from "node:fs";
import path from "node:path";

import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL ?? "file:./data/absensi.db";

if (databaseUrl.startsWith("file:")) {
  const filePath = databaseUrl.replace(/^file:/, "");
  if (filePath && filePath !== ":memory:") {
    mkdirSync(path.dirname(path.resolve(filePath)), { recursive: true });
  }
}

export const client = createClient({
  url: databaseUrl
});

export const db = drizzle(client, { schema });
