import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRepostsTableAndAddRepostCountToPost1781345837356 implements MigrationInterface {
    name = 'CreateRepostsTableAndAddRepostCountToPost1781345837356'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "reposts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "post_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_52695faa15b7c703f8660581f81" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_reposts_user_post" ON "reposts" ("user_id", "post_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_reposts_post" ON "reposts" ("post_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_reposts_user" ON "reposts" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "posts" ADD "repost_count" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "reposts" ADD CONSTRAINT "FK_3d0900495dc74309d70b02464e2" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reposts" ADD CONSTRAINT "FK_70d9186444e242f48c3fce21770" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reposts" DROP CONSTRAINT "FK_70d9186444e242f48c3fce21770"`);
        await queryRunner.query(`ALTER TABLE "reposts" DROP CONSTRAINT "FK_3d0900495dc74309d70b02464e2"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "repost_count"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_reposts_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_reposts_post"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_reposts_user_post"`);
        await queryRunner.query(`DROP TABLE "reposts"`);
    }

}
