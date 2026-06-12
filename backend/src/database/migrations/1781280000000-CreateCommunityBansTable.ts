import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCommunityBansTable1781280000000 implements MigrationInterface {
  name = 'CreateCommunityBansTable1781280000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "community_bans" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "community_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "banned_by_id" uuid NOT NULL,
        "reason" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_community_bans_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_community_bans_community" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_community_bans_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_community_bans_banned_by" FOREIGN KEY ("banned_by_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_community_bans_unique" ON "community_bans" ("community_id", "user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_community_bans_unique"`);
    await queryRunner.query(`DROP TABLE "community_bans"`);
  }
}
