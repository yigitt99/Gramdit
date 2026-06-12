import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateReactionsTableAndAddReactionCountToComment1781269412191 implements MigrationInterface {
    name = 'CreateReactionsTableAndAddReactionCountToComment1781269412191'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."reactions_reaction_type_enum" AS ENUM('LIKE', 'UPVOTE', 'DOWNVOTE')`);
        await queryRunner.query(`CREATE TABLE "reactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "post_id" uuid, "comment_id" uuid, "reaction_type" "public"."reactions_reaction_type_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_reactions_user_comment" UNIQUE ("user_id", "comment_id"), CONSTRAINT "UQ_reactions_user_post" UNIQUE ("user_id", "post_id"), CONSTRAINT "PK_0b213d460d0c473bc2fb6ee27f3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_reactions_comment" ON "reactions" ("comment_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_reactions_post" ON "reactions" ("post_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_reactions_user" ON "reactions" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "comments" ADD "reaction_count" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "reactions" ADD CONSTRAINT "FK_dde6062145a93649adc5af3946e" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reactions" ADD CONSTRAINT "FK_a1ac38351a456da43cd26d38be8" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reactions" ADD CONSTRAINT "FK_bbea5deba8e9118ad08429c9104" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reactions" DROP CONSTRAINT "FK_bbea5deba8e9118ad08429c9104"`);
        await queryRunner.query(`ALTER TABLE "reactions" DROP CONSTRAINT "FK_a1ac38351a456da43cd26d38be8"`);
        await queryRunner.query(`ALTER TABLE "reactions" DROP CONSTRAINT "FK_dde6062145a93649adc5af3946e"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN "reaction_count"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_reactions_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_reactions_post"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_reactions_comment"`);
        await queryRunner.query(`DROP TABLE "reactions"`);
        await queryRunner.query(`DROP TYPE "public"."reactions_reaction_type_enum"`);
    }

}
