import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveInactiveStatusFromUsers1768484473637 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Convertir todos los usuarios con status='inactive' a status='active'
    await queryRunner.query(`
      UPDATE users
      SET status = 'active'
      WHERE status = 'inactive'
    `)

    // 2. Eliminar el default temporalmente (necesario para cambiar el tipo de enum)
    await queryRunner.query(`
      ALTER TABLE users
      ALTER COLUMN status DROP DEFAULT
    `)

    // 3. Crear nuevo enum sin 'inactive'
    await queryRunner.query(`
      CREATE TYPE "users_status_enum_new" AS ENUM('active', 'suspended')
    `)

    // 4. Actualizar la columna al nuevo tipo (safe porque no hay más 'inactive')
    await queryRunner.query(`
      ALTER TABLE users
      ALTER COLUMN status TYPE "users_status_enum_new"
      USING status::text::"users_status_enum_new"
    `)

    // 5. Eliminar el enum viejo y renombrar el nuevo
    await queryRunner.query(`DROP TYPE "users_status_enum"`)
    await queryRunner.query(`
      ALTER TYPE "users_status_enum_new" RENAME TO "users_status_enum"
    `)

    // 6. Restaurar el default a 'active'
    await queryRunner.query(`
      ALTER TABLE users
      ALTER COLUMN status SET DEFAULT 'active'::"users_status_enum"
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Eliminar el default temporalmente
    await queryRunner.query(`
      ALTER TABLE users
      ALTER COLUMN status DROP DEFAULT
    `)

    // 2. Crear enum con 'inactive' de vuelta
    await queryRunner.query(`
      CREATE TYPE "users_status_enum_new" AS ENUM('active', 'inactive', 'suspended')
    `)

    // 3. Actualizar la columna al enum anterior
    await queryRunner.query(`
      ALTER TABLE users
      ALTER COLUMN status TYPE "users_status_enum_new"
      USING status::text::"users_status_enum_new"
    `)

    // 4. Eliminar el enum actual y renombrar el nuevo
    await queryRunner.query(`DROP TYPE "users_status_enum"`)
    await queryRunner.query(`
      ALTER TYPE "users_status_enum_new" RENAME TO "users_status_enum"
    `)

    // 5. Restaurar el default a 'inactive'
    await queryRunner.query(`
      ALTER TABLE users
      ALTER COLUMN status SET DEFAULT 'inactive'::"users_status_enum"
    `)

    // Nota: No se pueden revertir los usuarios que estaban en 'inactive'
    // porque esa información se perdió. Se mantienen en 'active'.
  }
}
