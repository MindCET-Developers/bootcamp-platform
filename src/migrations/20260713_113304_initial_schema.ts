import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_events_event_state" AS ENUM('planning', 'active', 'archived');
  CREATE TYPE "public"."enum_events_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__events_v_version_event_state" AS ENUM('planning', 'active', 'archived');
  CREATE TYPE "public"."enum__events_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_sessions_type" AS ENUM('Talk', 'Workshop', 'Panel', 'Networking', 'Visit');
  CREATE TYPE "public"."enum_sessions_session_state" AS ENUM('scheduled', 'live', 'completed', 'cancelled');
  CREATE TYPE "public"."enum_sessions_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__sessions_v_version_type" AS ENUM('Talk', 'Workshop', 'Panel', 'Networking', 'Visit');
  CREATE TYPE "public"."enum__sessions_v_version_session_state" AS ENUM('scheduled', 'live', 'completed', 'cancelled');
  CREATE TYPE "public"."enum__sessions_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_participants_source" AS ENUM('staff', 'attendee');
  CREATE TYPE "public"."enum_participants_status" AS ENUM('pending', 'approved', 'hidden');
  CREATE TYPE "public"."enum_announcements_priority" AS ENUM('info', 'schedule', 'important');
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor');
  CREATE TABLE "events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"slug" varchar,
  	"starts_at" timestamp(3) with time zone,
  	"ends_at" timestamp(3) with time zone,
  	"city" varchar,
  	"venue" varchar,
  	"timezone" varchar DEFAULT 'Asia/Seoul',
  	"hero_eyebrow" varchar DEFAULT 'Seoul · August 2026',
  	"hero_headline" varchar,
  	"hero_partner_line" varchar,
  	"event_state" "enum_events_event_state" DEFAULT 'active',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_events_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_events_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar,
  	"version_slug" varchar,
  	"version_starts_at" timestamp(3) with time zone,
  	"version_ends_at" timestamp(3) with time zone,
  	"version_city" varchar,
  	"version_venue" varchar,
  	"version_timezone" varchar DEFAULT 'Asia/Seoul',
  	"version_hero_eyebrow" varchar DEFAULT 'Seoul · August 2026',
  	"version_hero_headline" varchar,
  	"version_hero_partner_line" varchar,
  	"version_event_state" "enum__events_v_version_event_state" DEFAULT 'active',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__events_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "event_days" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_order" varchar,
  	"event_id" integer NOT NULL,
  	"label" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"summary" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "sessions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_order" varchar,
  	"event_id" integer,
  	"day_id" integer,
  	"title" varchar,
  	"slug" varchar,
  	"starts_at" timestamp(3) with time zone,
  	"ends_at" timestamp(3) with time zone,
  	"type" "enum_sessions_type",
  	"location" varchar,
  	"description" varchar,
  	"session_state" "enum_sessions_session_state" DEFAULT 'scheduled',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_sessions_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "sessions_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"speakers_id" integer
  );
  
  CREATE TABLE "_sessions_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version__order" varchar,
  	"version_event_id" integer,
  	"version_day_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_starts_at" timestamp(3) with time zone,
  	"version_ends_at" timestamp(3) with time zone,
  	"version_type" "enum__sessions_v_version_type",
  	"version_location" varchar,
  	"version_description" varchar,
  	"version_session_state" "enum__sessions_v_version_session_state" DEFAULT 'scheduled',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__sessions_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_sessions_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"speakers_id" integer
  );
  
  CREATE TABLE "speakers_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL
  );
  
  CREATE TABLE "speakers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" varchar NOT NULL,
  	"organization" varchar,
  	"bio" varchar NOT NULL,
  	"photo_id" integer,
  	"contact_u_r_l" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "participants_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL
  );
  
  CREATE TABLE "participants" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"event_id" integer NOT NULL,
  	"name" varchar NOT NULL,
  	"role" varchar NOT NULL,
  	"organization" varchar NOT NULL,
  	"about" varchar NOT NULL,
  	"contact_u_r_l" varchar,
  	"edit_token_hash" varchar,
  	"source" "enum_participants_source" DEFAULT 'staff' NOT NULL,
  	"status" "enum_participants_status" DEFAULT 'pending' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "announcements" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_order" varchar,
  	"event_id" integer NOT NULL,
  	"title" varchar NOT NULL,
  	"message" varchar NOT NULL,
  	"priority" "enum_announcements_priority" DEFAULT 'info' NOT NULL,
  	"starts_at" timestamp(3) with time zone,
  	"ends_at" timestamp(3) with time zone,
  	"published" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "feedback" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"session_id" integer NOT NULL,
  	"rating" numeric NOT NULL,
  	"comment" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "access_attempts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"failures" numeric DEFAULT 0 NOT NULL,
  	"window_started_at" timestamp(3) with time zone NOT NULL,
  	"blocked_until" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" "enum_users_role" DEFAULT 'editor' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"events_id" integer,
  	"event_days_id" integer,
  	"sessions_id" integer,
  	"speakers_id" integer,
  	"participants_id" integer,
  	"announcements_id" integer,
  	"feedback_id" integer,
  	"access_attempts_id" integer,
  	"media_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "app_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"active_event_id" integer,
  	"design_name" varchar DEFAULT 'Seoul Signal',
  	"design_accent" varchar DEFAULT '#65D5DF',
  	"design_secondary_accent" varchar DEFAULT '#EF4CA6',
  	"directory_enabled" boolean DEFAULT true,
  	"feedback_enabled" boolean DEFAULT true,
  	"new_access_code" varchar,
  	"access_code_hash" varchar,
  	"access_code_updated_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_parent_id_events_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "event_days" ADD CONSTRAINT "event_days_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sessions" ADD CONSTRAINT "sessions_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sessions" ADD CONSTRAINT "sessions_day_id_event_days_id_fk" FOREIGN KEY ("day_id") REFERENCES "public"."event_days"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sessions_rels" ADD CONSTRAINT "sessions_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sessions_rels" ADD CONSTRAINT "sessions_rels_speakers_fk" FOREIGN KEY ("speakers_id") REFERENCES "public"."speakers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sessions_v" ADD CONSTRAINT "_sessions_v_parent_id_sessions_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sessions_v" ADD CONSTRAINT "_sessions_v_version_event_id_events_id_fk" FOREIGN KEY ("version_event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sessions_v" ADD CONSTRAINT "_sessions_v_version_day_id_event_days_id_fk" FOREIGN KEY ("version_day_id") REFERENCES "public"."event_days"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sessions_v_rels" ADD CONSTRAINT "_sessions_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_sessions_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sessions_v_rels" ADD CONSTRAINT "_sessions_v_rels_speakers_fk" FOREIGN KEY ("speakers_id") REFERENCES "public"."speakers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "speakers_tags" ADD CONSTRAINT "speakers_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."speakers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "speakers" ADD CONSTRAINT "speakers_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "participants_tags" ADD CONSTRAINT "participants_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "participants" ADD CONSTRAINT "participants_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "announcements" ADD CONSTRAINT "announcements_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "feedback" ADD CONSTRAINT "feedback_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_event_days_fk" FOREIGN KEY ("event_days_id") REFERENCES "public"."event_days"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_sessions_fk" FOREIGN KEY ("sessions_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_speakers_fk" FOREIGN KEY ("speakers_id") REFERENCES "public"."speakers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_participants_fk" FOREIGN KEY ("participants_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_announcements_fk" FOREIGN KEY ("announcements_id") REFERENCES "public"."announcements"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_feedback_fk" FOREIGN KEY ("feedback_id") REFERENCES "public"."feedback"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_access_attempts_fk" FOREIGN KEY ("access_attempts_id") REFERENCES "public"."access_attempts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_active_event_id_events_id_fk" FOREIGN KEY ("active_event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "events_slug_idx" ON "events" USING btree ("slug");
  CREATE INDEX "events_updated_at_idx" ON "events" USING btree ("updated_at");
  CREATE INDEX "events_created_at_idx" ON "events" USING btree ("created_at");
  CREATE INDEX "events__status_idx" ON "events" USING btree ("_status");
  CREATE INDEX "_events_v_parent_idx" ON "_events_v" USING btree ("parent_id");
  CREATE INDEX "_events_v_version_version_slug_idx" ON "_events_v" USING btree ("version_slug");
  CREATE INDEX "_events_v_version_version_updated_at_idx" ON "_events_v" USING btree ("version_updated_at");
  CREATE INDEX "_events_v_version_version_created_at_idx" ON "_events_v" USING btree ("version_created_at");
  CREATE INDEX "_events_v_version_version__status_idx" ON "_events_v" USING btree ("version__status");
  CREATE INDEX "_events_v_created_at_idx" ON "_events_v" USING btree ("created_at");
  CREATE INDEX "_events_v_updated_at_idx" ON "_events_v" USING btree ("updated_at");
  CREATE INDEX "_events_v_latest_idx" ON "_events_v" USING btree ("latest");
  CREATE INDEX "event_days__order_idx" ON "event_days" USING btree ("_order");
  CREATE INDEX "event_days_event_idx" ON "event_days" USING btree ("event_id");
  CREATE INDEX "event_days_updated_at_idx" ON "event_days" USING btree ("updated_at");
  CREATE INDEX "event_days_created_at_idx" ON "event_days" USING btree ("created_at");
  CREATE INDEX "sessions__order_idx" ON "sessions" USING btree ("_order");
  CREATE INDEX "sessions_event_idx" ON "sessions" USING btree ("event_id");
  CREATE INDEX "sessions_day_idx" ON "sessions" USING btree ("day_id");
  CREATE UNIQUE INDEX "sessions_slug_idx" ON "sessions" USING btree ("slug");
  CREATE INDEX "sessions_updated_at_idx" ON "sessions" USING btree ("updated_at");
  CREATE INDEX "sessions_created_at_idx" ON "sessions" USING btree ("created_at");
  CREATE INDEX "sessions__status_idx" ON "sessions" USING btree ("_status");
  CREATE INDEX "sessions_rels_order_idx" ON "sessions_rels" USING btree ("order");
  CREATE INDEX "sessions_rels_parent_idx" ON "sessions_rels" USING btree ("parent_id");
  CREATE INDEX "sessions_rels_path_idx" ON "sessions_rels" USING btree ("path");
  CREATE INDEX "sessions_rels_speakers_id_idx" ON "sessions_rels" USING btree ("speakers_id");
  CREATE INDEX "_sessions_v_parent_idx" ON "_sessions_v" USING btree ("parent_id");
  CREATE INDEX "_sessions_v_version_version__order_idx" ON "_sessions_v" USING btree ("version__order");
  CREATE INDEX "_sessions_v_version_version_event_idx" ON "_sessions_v" USING btree ("version_event_id");
  CREATE INDEX "_sessions_v_version_version_day_idx" ON "_sessions_v" USING btree ("version_day_id");
  CREATE INDEX "_sessions_v_version_version_slug_idx" ON "_sessions_v" USING btree ("version_slug");
  CREATE INDEX "_sessions_v_version_version_updated_at_idx" ON "_sessions_v" USING btree ("version_updated_at");
  CREATE INDEX "_sessions_v_version_version_created_at_idx" ON "_sessions_v" USING btree ("version_created_at");
  CREATE INDEX "_sessions_v_version_version__status_idx" ON "_sessions_v" USING btree ("version__status");
  CREATE INDEX "_sessions_v_created_at_idx" ON "_sessions_v" USING btree ("created_at");
  CREATE INDEX "_sessions_v_updated_at_idx" ON "_sessions_v" USING btree ("updated_at");
  CREATE INDEX "_sessions_v_latest_idx" ON "_sessions_v" USING btree ("latest");
  CREATE INDEX "_sessions_v_rels_order_idx" ON "_sessions_v_rels" USING btree ("order");
  CREATE INDEX "_sessions_v_rels_parent_idx" ON "_sessions_v_rels" USING btree ("parent_id");
  CREATE INDEX "_sessions_v_rels_path_idx" ON "_sessions_v_rels" USING btree ("path");
  CREATE INDEX "_sessions_v_rels_speakers_id_idx" ON "_sessions_v_rels" USING btree ("speakers_id");
  CREATE INDEX "speakers_tags_order_idx" ON "speakers_tags" USING btree ("_order");
  CREATE INDEX "speakers_tags_parent_id_idx" ON "speakers_tags" USING btree ("_parent_id");
  CREATE INDEX "speakers_photo_idx" ON "speakers" USING btree ("photo_id");
  CREATE INDEX "speakers_updated_at_idx" ON "speakers" USING btree ("updated_at");
  CREATE INDEX "speakers_created_at_idx" ON "speakers" USING btree ("created_at");
  CREATE INDEX "participants_tags_order_idx" ON "participants_tags" USING btree ("_order");
  CREATE INDEX "participants_tags_parent_id_idx" ON "participants_tags" USING btree ("_parent_id");
  CREATE INDEX "participants_event_idx" ON "participants" USING btree ("event_id");
  CREATE INDEX "participants_updated_at_idx" ON "participants" USING btree ("updated_at");
  CREATE INDEX "participants_created_at_idx" ON "participants" USING btree ("created_at");
  CREATE INDEX "announcements__order_idx" ON "announcements" USING btree ("_order");
  CREATE INDEX "announcements_event_idx" ON "announcements" USING btree ("event_id");
  CREATE INDEX "announcements_updated_at_idx" ON "announcements" USING btree ("updated_at");
  CREATE INDEX "announcements_created_at_idx" ON "announcements" USING btree ("created_at");
  CREATE INDEX "feedback_session_idx" ON "feedback" USING btree ("session_id");
  CREATE INDEX "feedback_updated_at_idx" ON "feedback" USING btree ("updated_at");
  CREATE INDEX "feedback_created_at_idx" ON "feedback" USING btree ("created_at");
  CREATE UNIQUE INDEX "access_attempts_key_idx" ON "access_attempts" USING btree ("key");
  CREATE INDEX "access_attempts_updated_at_idx" ON "access_attempts" USING btree ("updated_at");
  CREATE INDEX "access_attempts_created_at_idx" ON "access_attempts" USING btree ("created_at");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_events_id_idx" ON "payload_locked_documents_rels" USING btree ("events_id");
  CREATE INDEX "payload_locked_documents_rels_event_days_id_idx" ON "payload_locked_documents_rels" USING btree ("event_days_id");
  CREATE INDEX "payload_locked_documents_rels_sessions_id_idx" ON "payload_locked_documents_rels" USING btree ("sessions_id");
  CREATE INDEX "payload_locked_documents_rels_speakers_id_idx" ON "payload_locked_documents_rels" USING btree ("speakers_id");
  CREATE INDEX "payload_locked_documents_rels_participants_id_idx" ON "payload_locked_documents_rels" USING btree ("participants_id");
  CREATE INDEX "payload_locked_documents_rels_announcements_id_idx" ON "payload_locked_documents_rels" USING btree ("announcements_id");
  CREATE INDEX "payload_locked_documents_rels_feedback_id_idx" ON "payload_locked_documents_rels" USING btree ("feedback_id");
  CREATE INDEX "payload_locked_documents_rels_access_attempts_id_idx" ON "payload_locked_documents_rels" USING btree ("access_attempts_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "app_settings_active_event_idx" ON "app_settings" USING btree ("active_event_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "events" CASCADE;
  DROP TABLE "_events_v" CASCADE;
  DROP TABLE "event_days" CASCADE;
  DROP TABLE "sessions" CASCADE;
  DROP TABLE "sessions_rels" CASCADE;
  DROP TABLE "_sessions_v" CASCADE;
  DROP TABLE "_sessions_v_rels" CASCADE;
  DROP TABLE "speakers_tags" CASCADE;
  DROP TABLE "speakers" CASCADE;
  DROP TABLE "participants_tags" CASCADE;
  DROP TABLE "participants" CASCADE;
  DROP TABLE "announcements" CASCADE;
  DROP TABLE "feedback" CASCADE;
  DROP TABLE "access_attempts" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "app_settings" CASCADE;
  DROP TYPE "public"."enum_events_event_state";
  DROP TYPE "public"."enum_events_status";
  DROP TYPE "public"."enum__events_v_version_event_state";
  DROP TYPE "public"."enum__events_v_version_status";
  DROP TYPE "public"."enum_sessions_type";
  DROP TYPE "public"."enum_sessions_session_state";
  DROP TYPE "public"."enum_sessions_status";
  DROP TYPE "public"."enum__sessions_v_version_type";
  DROP TYPE "public"."enum__sessions_v_version_session_state";
  DROP TYPE "public"."enum__sessions_v_version_status";
  DROP TYPE "public"."enum_participants_source";
  DROP TYPE "public"."enum_participants_status";
  DROP TYPE "public"."enum_announcements_priority";
  DROP TYPE "public"."enum_users_role";`)
}
