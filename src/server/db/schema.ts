import { sql } from "@vercel/postgres";
import {
  boolean,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/vercel-postgres";

export const db = drizzle(sql);

export const RoutesTable = pgTable(
  "routes",
  {
    id: serial("id").primaryKey(),
    path: text("path").notNull(),
    name: text("name").notNull(),
    isVisible: boolean("is_visible").notNull().default(true),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (db) => {
    return {
      uniqueIdx: uniqueIndex("unique_idx").on(db.path),
    };
  }
);

export const getRoutesTable = async () => {
  const selectResult = await db.select().from(RoutesTable);
  console.log("results", selectResult);
};
