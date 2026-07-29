ALTER TABLE "point_transactions" ADD COLUMN "student_id" uuid;--> statement-breakpoint
ALTER TABLE "point_transactions" ADD COLUMN "message" text;--> statement-breakpoint
ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;