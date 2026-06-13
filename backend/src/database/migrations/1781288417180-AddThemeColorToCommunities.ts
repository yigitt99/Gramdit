import { MigrationInterface, QueryRunner } from "typeorm";

export class AddThemeColorToCommunities1781288417180 implements MigrationInterface {
    name = 'AddThemeColorToCommunities1781288417180'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "community_bans" DROP CONSTRAINT "FK_community_bans_community"`);
        await queryRunner.query(`ALTER TABLE "community_bans" DROP CONSTRAINT "FK_community_bans_user"`);
        await queryRunner.query(`ALTER TABLE "community_bans" DROP CONSTRAINT "FK_community_bans_banned_by"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_recipient"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_sender"`);
        await queryRunner.query(`ALTER TABLE "communities" ADD "theme_color" character varying(7) DEFAULT '#3F51B5'`);
        await queryRunner.query(`ALTER TABLE "community_bans" ADD CONSTRAINT "FK_b4e9127fa69a53ad0c5c207cde8" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "community_bans" ADD CONSTRAINT "FK_59e6f1a2667c3d5a7a51a9142c7" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "community_bans" ADD CONSTRAINT "FK_b4609c511f47b0758c4ada15b7a" FOREIGN KEY ("banned_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_5332a4daa46fd3f4e6625dd275d" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_4140c8b09ff58165daffbefbd7e" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_4140c8b09ff58165daffbefbd7e"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_5332a4daa46fd3f4e6625dd275d"`);
        await queryRunner.query(`ALTER TABLE "community_bans" DROP CONSTRAINT "FK_b4609c511f47b0758c4ada15b7a"`);
        await queryRunner.query(`ALTER TABLE "community_bans" DROP CONSTRAINT "FK_59e6f1a2667c3d5a7a51a9142c7"`);
        await queryRunner.query(`ALTER TABLE "community_bans" DROP CONSTRAINT "FK_b4e9127fa69a53ad0c5c207cde8"`);
        await queryRunner.query(`ALTER TABLE "communities" DROP COLUMN "theme_color"`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_sender" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_recipient" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "community_bans" ADD CONSTRAINT "FK_community_bans_banned_by" FOREIGN KEY ("banned_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "community_bans" ADD CONSTRAINT "FK_community_bans_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "community_bans" ADD CONSTRAINT "FK_community_bans_community" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
