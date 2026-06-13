import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCommunityKickAndBanNotificationTypes1781289000000 implements MigrationInterface {
  name = 'AddCommunityKickAndBanNotificationTypes1781289000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ALTER TYPE ADD VALUE cannot run inside a transaction in Postgres in some contexts, 
    // but in modern PG versions we can run them or handle them safely.
    try {
      await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum" ADD VALUE 'COMMUNITY_KICK'`);
    } catch (err) {
      console.warn('COMMUNITY_KICK enum value might already exist:', err.message);
    }

    try {
      await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum" ADD VALUE 'COMMUNITY_BAN'`);
    } catch (err) {
      console.warn('COMMUNITY_BAN enum value might already exist:', err.message);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSql does not support removing values from an enum type easily
  }
}
