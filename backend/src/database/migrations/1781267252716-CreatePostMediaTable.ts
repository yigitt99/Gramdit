import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePostMediaTable1781267252716 implements MigrationInterface {
    name = 'CreatePostMediaTable1781267252716'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."post_media_media_type_enum" AS ENUM('IMAGE', 'VIDEO')`);
        await queryRunner.query(`CREATE TABLE "post_media" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "post_id" uuid NOT NULL, "media_url" character varying(1000) NOT NULL, "media_type" "public"."post_media_media_type_enum" NOT NULL DEFAULT 'IMAGE', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_049edb1ce7ab3d2a98009b171d0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_post_media_post" ON "post_media" ("post_id") `);
        await queryRunner.query(`ALTER TABLE "post_media" ADD CONSTRAINT "FK_1eeb54a4fdfbe9db17899243cbe" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "post_media" DROP CONSTRAINT "FK_1eeb54a4fdfbe9db17899243cbe"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_post_media_post"`);
        await queryRunner.query(`DROP TABLE "post_media"`);
        await queryRunner.query(`DROP TYPE "public"."post_media_media_type_enum"`);
    }

}
