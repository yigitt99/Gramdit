import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCommunitiesTable1781265366124 implements MigrationInterface {
    name = 'CreateCommunitiesTable1781265366124'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "communities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "slug" character varying(100) NOT NULL, "description" text, "avatar_url" character varying(500), "banner_url" character varying(500), "is_private" boolean NOT NULL DEFAULT false, "member_count" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid NOT NULL, CONSTRAINT "UQ_501bb6c8f7c8e8a7d614d9435f6" UNIQUE ("name"), CONSTRAINT "UQ_42d5225a80ac87aa1254dfe282c" UNIQUE ("slug"), CONSTRAINT "PK_fea1fe83c86ccde9d0a089e7ea2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_communities_slug" ON "communities" ("slug") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_communities_name" ON "communities" ("name") `);
        await queryRunner.query(`ALTER TABLE "communities" ADD CONSTRAINT "FK_39793f5d3c7464578d8b03f4360" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "communities" DROP CONSTRAINT "FK_39793f5d3c7464578d8b03f4360"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_communities_name"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_communities_slug"`);
        await queryRunner.query(`DROP TABLE "communities"`);
    }

}
