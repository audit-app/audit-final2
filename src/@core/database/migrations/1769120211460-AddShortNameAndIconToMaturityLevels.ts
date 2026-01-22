import { MigrationInterface, QueryRunner } from "typeorm";

export class AddShortNameAndIconToMaturityLevels1769120211460 implements MigrationInterface {
    name = 'AddShortNameAndIconToMaturityLevels1769120211460'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "maturity_levels" DROP COLUMN "shortName"`);
        await queryRunner.query(`ALTER TABLE "maturity_levels" ADD "shortName" character varying(50)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "maturity_levels" DROP COLUMN "shortName"`);
        await queryRunner.query(`ALTER TABLE "maturity_levels" ADD "shortName" character varying(20)`);
    }

}
