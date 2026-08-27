CREATE TYPE "public"."tier" AS ENUM('swe-1', 'swe-2', 'senior', 'staff');--> statement-breakpoint
CREATE TABLE "track_tier" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"technology" text NOT NULL,
	"tier" "tier" NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "track_tier_user_technology" UNIQUE("user_id","technology")
);
--> statement-breakpoint
ALTER TABLE "track_tier" ADD CONSTRAINT "track_tier_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;