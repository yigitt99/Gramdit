import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMediaToComments1781269126570 implements MigrationInterface {
    name = 'AddMediaToComments1781269126570'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comments" ADD "media_url" character varying(1000)`);
        await queryRunner.query(`CREATE TYPE "public"."comments_media_type_enum" AS ENUM('IMAGE', 'VIDEO')`);
        await queryRunner.query(`ALTER TABLE "comments" ADD "media_type" "public"."comments_media_type_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN "media_type"`);
        await queryRunner.query(`DROP TYPE "public"."comments_media_type_enum"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN "media_url"`);
    }

}
