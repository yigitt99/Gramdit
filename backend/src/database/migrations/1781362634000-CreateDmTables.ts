import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDmTables1781362634000 implements MigrationInterface {
    name = 'CreateDmTables1781362634000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create dm_conversations table
        await queryRunner.query(`CREATE TABLE "dm_conversations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_dm_conversations" PRIMARY KEY ("id"))`);

        // 2. Create dm_conversation_members table
        await queryRunner.query(`CREATE TABLE "dm_conversation_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "conversation_id" uuid NOT NULL, "user_id" uuid NOT NULL, "joined_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_dm_conversation_members_conversation_user" UNIQUE ("conversation_id", "user_id"), CONSTRAINT "PK_dm_conversation_members" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_dm_conversation_members_conversation" ON "dm_conversation_members" ("conversation_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_dm_conversation_members_user" ON "dm_conversation_members" ("user_id")`);

        // 3. Create dm_messages table
        await queryRunner.query(`CREATE TABLE "dm_messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "conversation_id" uuid NOT NULL, "sender_id" uuid NOT NULL, "content" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_dm_messages" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_dm_messages_conversation" ON "dm_messages" ("conversation_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_dm_messages_sender" ON "dm_messages" ("sender_id")`);

        // 4. Add foreign keys
        await queryRunner.query(`ALTER TABLE "dm_conversation_members" ADD CONSTRAINT "FK_dm_conversation_members_conversation" FOREIGN KEY ("conversation_id") REFERENCES "dm_conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "dm_conversation_members" ADD CONSTRAINT "FK_dm_conversation_members_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "dm_messages" ADD CONSTRAINT "FK_dm_messages_conversation" FOREIGN KEY ("conversation_id") REFERENCES "dm_conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "dm_messages" ADD CONSTRAINT "FK_dm_messages_sender" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "dm_messages" DROP CONSTRAINT "FK_dm_messages_sender"`);
        await queryRunner.query(`ALTER TABLE "dm_messages" DROP CONSTRAINT "FK_dm_messages_conversation"`);
        await queryRunner.query(`ALTER TABLE "dm_conversation_members" DROP CONSTRAINT "FK_dm_conversation_members_user"`);
        await queryRunner.query(`ALTER TABLE "dm_conversation_members" DROP CONSTRAINT "FK_dm_conversation_members_conversation"`);

        await queryRunner.query(`DROP INDEX "public"."IDX_dm_messages_sender"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dm_messages_conversation"`);
        await queryRunner.query(`DROP TABLE "dm_messages"`);

        await queryRunner.query(`DROP INDEX "public"."IDX_dm_conversation_members_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dm_conversation_members_conversation"`);
        await queryRunner.query(`DROP TABLE "dm_conversation_members"`);

        await queryRunner.query(`DROP TABLE "dm_conversations"`);
    }
}
