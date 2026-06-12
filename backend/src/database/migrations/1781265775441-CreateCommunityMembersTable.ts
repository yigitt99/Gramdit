import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCommunityMembersTable1781265775441 implements MigrationInterface {
    name = 'CreateCommunityMembersTable1781265775441'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."community_members_role_enum" AS ENUM('founder', 'moderator', 'vip', 'member')`);
        await queryRunner.query(`CREATE TABLE "community_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "community_id" uuid NOT NULL, "user_id" uuid NOT NULL, "role" "public"."community_members_role_enum" NOT NULL DEFAULT 'member', "joined_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_03dff82f9cfcb02498e9f5fc640" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_community_members_unique" ON "community_members" ("community_id", "user_id") `);
        await queryRunner.query(`ALTER TABLE "community_members" ADD CONSTRAINT "FK_46eb2c3e2d8b84acbd9a78974ab" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "community_members" ADD CONSTRAINT "FK_59ac0a0f039c16f8429ec9bda5d" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "community_members" DROP CONSTRAINT "FK_59ac0a0f039c16f8429ec9bda5d"`);
        await queryRunner.query(`ALTER TABLE "community_members" DROP CONSTRAINT "FK_46eb2c3e2d8b84acbd9a78974ab"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_community_members_unique"`);
        await queryRunner.query(`DROP TABLE "community_members"`);
        await queryRunner.query(`DROP TYPE "public"."community_members_role_enum"`);
    }

}
