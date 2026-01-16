import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

export class AddTwoFactorFieldsToUsers1768509983133
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar campo isTwoFactorEnabled (default: false)
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'isTwoFactorEnabled',
        type: 'boolean',
        default: false,
        comment: '2FA habilitado para este usuario (opcional)',
      }),
    )

    // Agregar índice para consultas rápidas
    await queryRunner.query(
      `CREATE INDEX "IDX_users_two_factor_enabled" ON "users" ("isTwoFactorEnabled")`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índice
    await queryRunner.query(`DROP INDEX "IDX_users_two_factor_enabled"`)

    // Eliminar columna
    await queryRunner.dropColumn('users', 'isTwoFactorEnabled')
  }
}
