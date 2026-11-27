import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const events = sqliteTable("events", {
  id: text("id").primaryKey(),
  adminToken: text("admin_token").notNull().unique(),
  title: text("title").notNull(),
  organizerName: text("organizer_name"),
  eventDate: text("event_date"),
  budget: text("budget"),
  createdAt: integer("created_at", { mode: "number" }).notNull(),
});

export const participants = sqliteTable(
  "participants",
  {
    id: text("id").primaryKey(),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    token: text("token").notNull().unique(),
    targetId: text("target_id").notNull(),
    isAssisted: integer("is_assisted", { mode: "boolean" }).notNull().default(false),
    remainingViews: integer("remaining_views").notNull().default(1),
    viewedAt: integer("viewed_at", { mode: "number" }),
  },
  (table) => [
    index("participants_event_idx").on(table.eventId),
    uniqueIndex("participants_token_idx").on(table.token),
  ]
);

export const exclusions = sqliteTable(
  "exclusions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    giverId: text("giver_id")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    excludedId: text("excluded_id")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
  },
  (table) => [index("exclusions_event_idx").on(table.eventId)]
);
