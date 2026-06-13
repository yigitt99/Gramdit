import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFollowRequestsAndPrivateAccounts1781347548000 implements MigrationInterface {
    name = 'AddFollowRequestsAndPrivateAccounts1781347548000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Add is_private column to users table
        await queryRunner.query(`ALTER TABLE "users" ADD "is_private" boolean NOT NULL DEFAULT false`);

        // 2. Add FOLLOW_REQUEST enum value to notifications type
        try {
            await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum" ADD VALUE 'FOLLOW_REQUEST'`);
        } catch (err) {
            console.warn('FOLLOW_REQUEST enum value might already exist:', err.message);
        }

        // 3. Create follow_requests table
        await queryRunner.query(`CREATE TABLE "follow_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sender_id" uuid NOT NULL, "recipient_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_follow_requests_sender_recipient" UNIQUE ("sender_id", "recipient_id"), CONSTRAINT "PK_follow_requests" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_follow_requests_sender" ON "follow_requests" ("sender_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_follow_requests_recipient" ON "follow_requests" ("recipient_id")`);
        await queryRunner.query(`ALTER TABLE "follow_requests" ADD CONSTRAINT "FK_follow_requests_sender" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "follow_requests" ADD CONSTRAINT "FK_follow_requests_recipient" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "follow_requests" DROP CONSTRAINT "FK_follow_requests_recipient"`);
        await queryRunner.query(`ALTER TABLE "follow_requests" DROP CONSTRAINT "FK_follow_requests_sender"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_follow_requests_recipient"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_follow_requests_sender"`);
        await queryRunner.query(`DROP TABLE "follow_requests"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_private"`);
    }
}
