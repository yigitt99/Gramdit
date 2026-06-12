import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBannerUrlToUser1781270710903 implements MigrationInterface {
    name = 'AddBannerUrlToUser1781270710903'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "banner_url" character varying(500)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "banner_url"`);
    }

}
