import { sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex
} from "drizzle-orm/sqlite-core";

export const userRoles = ["admin", "petugas", "pengguna"] as const;
export type UserRole = (typeof userRoles)[number];

export const attendanceStatuses = [
  "present",
  "late",
  "permission",
  "sick",
  "leave",
  "absent"
] as const;
export type AttendanceStatus = (typeof attendanceStatuses)[number];

export const schedules = sqliteTable("schedules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  workdays: text("workdays").notNull().default("1,2,3,4,5"),
  startTime: text("start_time").notNull().default("08:00"),
  endTime: text("end_time").notNull().default("16:00"),
  toleranceMinutes: integer("tolerance_minutes").notNull().default(10),
  mode: text("mode").notNull().default("daily"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    identifier: text("identifier").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role", { enum: userRoles }).notNull().default("pengguna"),
    department: text("department").notNull().default("Umum"),
    position: text("position").notNull().default("Pengguna"),
    scheduleId: integer("schedule_id").references(() => schedules.id, {
      onDelete: "set null"
    }),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`)
  },
  (table) => ({
    identifierIdx: uniqueIndex("users_identifier_idx").on(table.identifier),
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
    roleIdx: index("users_role_idx").on(table.role)
  })
);

export const sessions = sqliteTable(
  "sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)
  },
  (table) => ({
    userIdx: index("sessions_user_idx").on(table.userId),
    expiresIdx: index("sessions_expires_idx").on(table.expiresAt)
  })
);

export const holidays = sqliteTable(
  "holidays",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    date: text("date").notNull(),
    name: text("name").notNull(),
    type: text("type").notNull().default("libur"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)
  },
  (table) => ({
    dateIdx: uniqueIndex("holidays_date_idx").on(table.date)
  })
);

export const attendanceRecords = sqliteTable(
  "attendance_records",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    attendanceDate: text("attendance_date").notNull(),
    checkInAt: text("check_in_at"),
    checkOutAt: text("check_out_at"),
    checkInPhoto: text("check_in_photo"),
    checkOutPhoto: text("check_out_photo"),
    checkInLatitude: real("check_in_latitude"),
    checkInLongitude: real("check_in_longitude"),
    checkInAccuracy: real("check_in_accuracy"),
    checkOutLatitude: real("check_out_latitude"),
    checkOutLongitude: real("check_out_longitude"),
    checkOutAccuracy: real("check_out_accuracy"),
    clientCapturedAt: text("client_captured_at"),
    status: text("status", { enum: attendanceStatuses }).notNull(),
    note: text("note"),
    source: text("source").notNull().default("web"),
    confirmedBy: integer("confirmed_by").references(() => users.id, {
      onDelete: "set null"
    }),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`)
  },
  (table) => ({
    userDateIdx: uniqueIndex("attendance_user_date_idx").on(
      table.userId,
      table.attendanceDate
    ),
    dateIdx: index("attendance_date_idx").on(table.attendanceDate),
    statusIdx: index("attendance_status_idx").on(table.status)
  })
);

export const clusterRuns = sqliteTable(
  "cluster_runs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    periodStart: text("period_start").notNull(),
    periodEnd: text("period_end").notNull(),
    k: integer("k").notNull(),
    silhouette: real("silhouette").notNull().default(0),
    totalMembers: integer("total_members").notNull().default(0),
    summaryJson: text("summary_json").notNull().default("[]"),
    createdBy: integer("created_by").references(() => users.id, {
      onDelete: "set null"
    }),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)
  },
  (table) => ({
    createdAtIdx: index("cluster_runs_created_at_idx").on(table.createdAt)
  })
);

export const clusterMembers = sqliteTable(
  "cluster_members",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    runId: integer("run_id")
      .notNull()
      .references(() => clusterRuns.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clusterIndex: integer("cluster_index").notNull(),
    label: text("label").notNull(),
    featuresJson: text("features_json").notNull(),
    distance: real("distance").notNull().default(0)
  },
  (table) => ({
    runUserIdx: uniqueIndex("cluster_members_run_user_idx").on(
      table.runId,
      table.userId
    ),
    runIdx: index("cluster_members_run_idx").on(table.runId),
    labelIdx: index("cluster_members_label_idx").on(table.label)
  })
);

export const activityLogs = sqliteTable(
  "activity_logs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").references(() => users.id, {
      onDelete: "set null"
    }),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: integer("target_id"),
    metadataJson: text("metadata_json").notNull().default("{}"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)
  },
  (table) => ({
    userIdx: index("activity_logs_user_idx").on(table.userId),
    actionIdx: index("activity_logs_action_idx").on(table.action)
  })
);
