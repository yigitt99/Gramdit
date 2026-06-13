import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWebsiteToUser1781345422507 implements MigrationInterface {
    name = 'AddWebsiteToUser1781345422507'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "website" character varying(500)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "website"`);
    }

}
