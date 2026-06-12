import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFollowsTableAndAddFollowCountToUser1781270232197 implements MigrationInterface {
    name = 'CreateFollowsTableAndAddFollowCountToUser1781270232197'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "follows" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "follower_id" uuid NOT NULL, "following_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_follows_follower_following" UNIQUE ("follower_id", "following_id"), CONSTRAINT "PK_8988f607744e16ff79da3b8a627" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_follows_following" ON "follows" ("following_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_follows_follower" ON "follows" ("follower_id") `);
        await queryRunner.query(`ALTER TABLE "users" ADD "follower_count" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "following_count" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "follows" ADD CONSTRAINT "FK_54b5dc2739f2dea57900933db66" FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "follows" ADD CONSTRAINT "FK_c518e3988b9c057920afaf2d8c0" FOREIGN KEY ("following_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "follows" DROP CONSTRAINT "FK_c518e3988b9c057920afaf2d8c0"`);
        await queryRunner.query(`ALTER TABLE "follows" DROP CONSTRAINT "FK_54b5dc2739f2dea57900933db66"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "following_count"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "follower_count"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_follows_follower"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_follows_following"`);
        await queryRunner.query(`DROP TABLE "follows"`);
    }

}
