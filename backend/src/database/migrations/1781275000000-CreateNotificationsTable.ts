import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationsTable1781275000000 implements MigrationInterface {
  name = 'CreateNotificationsTable1781275000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // NotificationType enum oluştur
    await queryRunner.query(`
      CREATE TYPE "public"."notifications_type_enum" AS ENUM(
        'FOLLOW',
        'POST_REACTION',
        'COMMENT',
        'COMMENT_REPLY'
      )
    `);

    // notifications tablosunu oluştur
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id"           uuid NOT NULL DEFAULT uuid_generate_v4(),
        "recipient_id" uuid NOT NULL,
        "sender_id"    uuid,
        "type"         "public"."notifications_type_enum" NOT NULL,
        "reference_id" uuid,
        "is_read"      boolean NOT NULL DEFAULT false,
        "created_at"   TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id")
      )
    `);

    // İndeksler
    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_recipient" ON "notifications" ("recipient_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_created_at" ON "notifications" ("created_at")
    `);

    // Foreign key'ler
    await queryRunner.query(`
      ALTER TABLE "notifications"
        ADD CONSTRAINT "FK_notifications_recipient"
        FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "notifications"
        ADD CONSTRAINT "FK_notifications_sender"
        FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_sender"`);
    await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_recipient"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_notifications_created_at"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_notifications_recipient"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
  }
}
