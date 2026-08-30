CREATE TABLE "device_sync" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"device_id" text NOT NULL,
	"name" text NOT NULL,
	"last_synced_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "device_sync_user_device" UNIQUE("user_id","device_id")
);
--> statement-breakpoint
ALTER TABLE "attempts" ADD COLUMN "recorded_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
-- Every attempt that predates this column was answered on this server, so the
-- moment it was answered is also the moment the server learned of it.
UPDATE "attempts" SET "recorded_at" = "attempted_at";--> statement-breakpoint
ALTER TABLE "device_sync" ADD CONSTRAINT "device_sync_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attempts_user_recorded_at" ON "attempts" USING btree ("user_id","recorded_at");