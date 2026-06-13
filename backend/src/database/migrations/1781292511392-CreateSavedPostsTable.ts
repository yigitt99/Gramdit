import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSavedPostsTable1781292511392 implements MigrationInterface {
    name = 'CreateSavedPostsTable1781292511392'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "saved_posts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "post_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_837a562f71fec3009c9af77ee53" UNIQUE ("user_id", "post_id"), CONSTRAINT "PK_868375ca4f041a2337a1c1a6634" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_saved_posts_post" ON "saved_posts" ("post_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_saved_posts_user" ON "saved_posts" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "saved_posts" ADD CONSTRAINT "FK_78c961371a509e86d789714dd4f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "saved_posts" ADD CONSTRAINT "FK_116e9df57f5221cc1a77c3d1cfe" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "saved_posts" DROP CONSTRAINT "FK_116e9df57f5221cc1a77c3d1cfe"`);
        await queryRunner.query(`ALTER TABLE "saved_posts" DROP CONSTRAINT "FK_78c961371a509e86d789714dd4f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_saved_posts_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_saved_posts_post"`);
        await queryRunner.query(`DROP TABLE "saved_posts"`);
    }

}
