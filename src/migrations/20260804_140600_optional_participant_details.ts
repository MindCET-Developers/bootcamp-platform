import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "participants" ALTER COLUMN "role" DROP NOT NULL;
  ALTER TABLE "participants" ALTER COLUMN "organization" DROP NOT NULL;
  ALTER TABLE "participants" ALTER COLUMN "about" DROP NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "participants" ALTER COLUMN "role" SET NOT NULL;
  ALTER TABLE "participants" ALTER COLUMN "organization" SET NOT NULL;
  ALTER TABLE "participants" ALTER COLUMN "about" SET NOT NULL;`)
}
