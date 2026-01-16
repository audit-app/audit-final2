import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

export class AddEmailVerificationFields1768521389597
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Agregar campo emailVerified (default: false)
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'emailVerified',
        type: 'boolean',
        default: false,
        comment: 'Indica si el email fue verificado',
      }),
    )

    // 2. Agregar campo emailVerifiedAt (nullable)
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'emailVerifiedAt',
        type: 'timestamp',
        isNullable: true,
        comment: 'Fecha y hora de verificación del email',
      }),
    )

    // 3. Crear índice para consultas rápidas
    await queryRunner.query(
      `CREATE INDEX "IDX_users_email_verified" ON "users" ("emailVerified")`,
    )

    // 4. Migración de datos: marcar usuarios activos como verificados
    // Los usuarios existentes con status=ACTIVE se asumen como verificados
    await queryRunner.query(`
      UPDATE users
      SET "emailVerified" = true, "emailVerifiedAt" = NOW()
      WHERE status = 'active'
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir en orden inverso
    await queryRunner.query(`DROP INDEX "IDX_users_email_verified"`)
    await queryRunner.dropColumn('users', 'emailVerifiedAt')
    await queryRunner.dropColumn('users', 'emailVerified')
  }
}
