import { MigrationInterface, QueryRunner } from 'typeorm'

export class InitialMigration1769485280882 implements MigrationInterface {
  name = 'InitialMigration1769485280882'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "organizations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying, "updated_by" character varying, "deletedAt" TIMESTAMP, "name" character varying(200) NOT NULL, "nit" character varying(50) NOT NULL, "description" text, "address" character varying(500), "phone" character varying(50), "email" character varying(200), "logoUrl" character varying(500), "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_6b031fcd0863e3f6b44230163f9" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_b029e60d94144a8e297c986390" ON "organizations" ("name") WHERE "deletedAt" IS NULL`,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_ca09157b626285881a55fed3a5" ON "organizations" ("nit") WHERE "deletedAt" IS NULL`,
    )
    await queryRunner.query(
      `CREATE TYPE "public"."users_roles_enum" AS ENUM('admin', 'gerente', 'auditor', 'cliente')`,
    )
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying, "updated_by" character varying, "deletedAt" TIMESTAMP, "names" character varying(50) NOT NULL, "lastNames" character varying(50) NOT NULL, "email" character varying(100) NOT NULL, "username" character varying(30) NOT NULL, "ci" character varying(15) NOT NULL, "password" character varying(255), "provider" character varying(50) DEFAULT 'local', "providerId" character varying(255), "emailVerified" boolean NOT NULL DEFAULT false, "emailVerifiedAt" TIMESTAMP, "isTwoFactorEnabled" boolean NOT NULL DEFAULT false, "phone" character varying(20), "address" character varying(200), "image" character varying(500), "isActive" boolean NOT NULL DEFAULT true, "organizationId" uuid NOT NULL, "roles" "public"."users_roles_enum" array NOT NULL DEFAULT '{cliente}', CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_933a628626fb656576d0d4c426" ON "users" ("ci") WHERE "deletedAt" IS NULL`,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_bfcfa74a1bc4575ba39ee66e59" ON "users" ("username") WHERE "deletedAt" IS NULL`,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_262d8d714a42e664d987714a75" ON "users" ("email") WHERE "deletedAt" IS NULL`,
    )
    await queryRunner.query(
      `CREATE TABLE "maturity_frameworks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying, "updated_by" character varying, "deletedAt" TIMESTAMP, "name" character varying(100) NOT NULL, "code" character varying(50) NOT NULL, "description" text, "minLevel" integer NOT NULL DEFAULT '0', "maxLevel" integer NOT NULL DEFAULT '5', "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_74774d6079306c216e3d9a1bba4" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_616304b2113f3fc4a5b67a5710" ON "maturity_frameworks" ("code") `,
    )
    await queryRunner.query(
      `CREATE TABLE "maturity_levels" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying, "updated_by" character varying, "deletedAt" TIMESTAMP, "frameworkId" uuid NOT NULL, "level" integer NOT NULL, "name" character varying(100) NOT NULL, "shortName" character varying(50), "description" text NOT NULL, "color" character varying(7) NOT NULL, "recommendations" text, "observations" text, "order" integer NOT NULL, "isMinimumAcceptable" boolean NOT NULL DEFAULT false, "isTarget" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_81c8def76639c01612a78d88f24" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_3a12b4d06d4b521030f5211d51" ON "maturity_levels" ("frameworkId", "level") `,
    )
    await queryRunner.query(
      `CREATE TABLE "casbin_rule" ("id" SERIAL NOT NULL, "ptype" character varying(100) NOT NULL, "v0" character varying(100), "v1" character varying(100), "v2" character varying(100), "v3" character varying(100), "v4" character varying(100), "v5" character varying(255), "v6" character varying(255), CONSTRAINT "PK_e147354d31e2748a3a5da5e3060" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_a482df99767d5a0e432485a2e0" ON "casbin_rule" ("ptype", "v0", "v1", "v2") `,
    )
    await queryRunner.query(
      `CREATE TABLE "standards" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying, "updated_by" character varying, "deletedAt" TIMESTAMP, "templateId" uuid NOT NULL, "parentId" uuid, "code" character varying(50) NOT NULL, "title" character varying(200) NOT NULL, "description" text, "order" integer NOT NULL, "level" integer NOT NULL DEFAULT '1', "isAuditable" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_cb084ce5e29cc74efe0befbefa8" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_a9df2d5c058d37a47d59b7a9c3" ON "standards" ("parentId") `,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_abd6ea724a5e3329a6bbdbf292" ON "standards" ("templateId", "order") `,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_a126aa57f91e45179783b0d8a1" ON "standards" ("templateId", "code") `,
    )
    await queryRunner.query(
      `CREATE TYPE "public"."templates_status_enum" AS ENUM('draft', 'published', 'archived')`,
    )
    await queryRunner.query(
      `CREATE TABLE "templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" character varying, "updated_by" character varying, "deletedAt" TIMESTAMP, "code" character varying(50) NOT NULL, "name" character varying(150) NOT NULL, "description" text NOT NULL, "version" character varying(20) NOT NULL, "status" "public"."templates_status_enum" NOT NULL DEFAULT 'draft', CONSTRAINT "PK_515948649ce0bbbe391de702ae5" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_8e968e08328483ed431ecab59f" ON "templates" ("name", "version") `,
    )
    await queryRunner.query(
      `CREATE TYPE "public"."audit_logs_action_enum" AS ENUM('CREATE', 'UPDATE', 'DELETE', 'ARCHIVE', 'ACTIVATE', 'DEACTIVATE', 'PUBLISH')`,
    )
    await queryRunner.query(
      `CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "userFullName" character varying(200), "userEmail" character varying(255), "entity" character varying(50) NOT NULL, "entityId" uuid NOT NULL, "rootId" uuid NOT NULL, "action" "public"."audit_logs_action_enum" NOT NULL, "changes" jsonb, "metadata" jsonb, CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_48d2129883c2b415dfdff021e3" ON "audit_logs" ("rootId") `,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_cfa83f61e4d27a87fcae1e025a" ON "audit_logs" ("userId") `,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_f23279fad63453147a8efb46cf" ON "audit_logs" ("entityId") `,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_00f40b2db1b92c0afb3f8e4e00" ON "audit_logs" ("rootId", "createdAt") `,
    )
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_f3d6aea8fcca58182b2e80ce979" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "maturity_levels" ADD CONSTRAINT "FK_2d5ac37a26afd5bfc1d58c1912b" FOREIGN KEY ("frameworkId") REFERENCES "maturity_frameworks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "standards" ADD CONSTRAINT "FK_805dd318d004cfb5156b1a5ce8d" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "standards" ADD CONSTRAINT "FK_a9df2d5c058d37a47d59b7a9c34" FOREIGN KEY ("parentId") REFERENCES "standards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "standards" DROP CONSTRAINT "FK_a9df2d5c058d37a47d59b7a9c34"`,
    )
    await queryRunner.query(
      `ALTER TABLE "standards" DROP CONSTRAINT "FK_805dd318d004cfb5156b1a5ce8d"`,
    )
    await queryRunner.query(
      `ALTER TABLE "maturity_levels" DROP CONSTRAINT "FK_2d5ac37a26afd5bfc1d58c1912b"`,
    )
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_f3d6aea8fcca58182b2e80ce979"`,
    )
    await queryRunner.query(
      `DROP INDEX "public"."IDX_00f40b2db1b92c0afb3f8e4e00"`,
    )
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f23279fad63453147a8efb46cf"`,
    )
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cfa83f61e4d27a87fcae1e025a"`,
    )
    await queryRunner.query(
      `DROP INDEX "public"."IDX_48d2129883c2b415dfdff021e3"`,
    )
    await queryRunner.query(`DROP TABLE "audit_logs"`)
    await queryRunner.query(`DROP TYPE "public"."audit_logs_action_enum"`)
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8e968e08328483ed431ecab59f"`,
    )
    await queryRunner.query(`DROP TABLE "templates"`)
    await queryRunner.query(`DROP TYPE "public"."templates_status_enum"`)
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a126aa57f91e45179783b0d8a1"`,
    )
    await queryRunner.query(
      `DROP INDEX "public"."IDX_abd6ea724a5e3329a6bbdbf292"`,
    )
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a9df2d5c058d37a47d59b7a9c3"`,
    )
    await queryRunner.query(`DROP TABLE "standards"`)
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a482df99767d5a0e432485a2e0"`,
    )
    await queryRunner.query(`DROP TABLE "casbin_rule"`)
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3a12b4d06d4b521030f5211d51"`,
    )
    await queryRunner.query(`DROP TABLE "maturity_levels"`)
    await queryRunner.query(
      `DROP INDEX "public"."IDX_616304b2113f3fc4a5b67a5710"`,
    )
    await queryRunner.query(`DROP TABLE "maturity_frameworks"`)
    await queryRunner.query(
      `DROP INDEX "public"."IDX_262d8d714a42e664d987714a75"`,
    )
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bfcfa74a1bc4575ba39ee66e59"`,
    )
    await queryRunner.query(
      `DROP INDEX "public"."IDX_933a628626fb656576d0d4c426"`,
    )
    await queryRunner.query(`DROP TABLE "users"`)
    await queryRunner.query(`DROP TYPE "public"."users_roles_enum"`)
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ca09157b626285881a55fed3a5"`,
    )
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b029e60d94144a8e297c986390"`,
    )
    await queryRunner.query(`DROP TABLE "organizations"`)
  }
}
