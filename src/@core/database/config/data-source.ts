import { DataSource, DataSourceOptions } from 'typeorm'
import { SeederOptions } from 'typeorm-extension'
import { TypeOrmDatabaseLogger } from '@core/logger'
import { envs } from '@core/config'

/**
 * Configuración de TypeORM para CLI (migrations y seeds)
 *
 * PROPÓSITO:
 * - Configuración SOLO para comandos CLI
 * - Usada por: migration:generate, migration:run, migration:revert, seed:run, etc.
 *
 * ✅ Migrated to use validated envs object (Joi-validated)
 *
 * @see src/@core/config/database.config.ts - Configuración para la app
 */

/**
 * Genera las opciones de configuración para TypeORM CLI
 */
function getTypeORMConfigForCLI(): DataSourceOptions & SeederOptions {
  const projectRoot = process.cwd()

  // Configuración base
  const baseConfig: DataSourceOptions & SeederOptions = {
    type: 'postgres',
    synchronize: false,
    logging: envs.app.isDevelopment,
    logger: TypeOrmDatabaseLogger.createStandalone(),
    maxQueryExecutionTime: 1000,
    entities: [`${projectRoot}/src/**/*.entity.ts`],
    migrations: [`${projectRoot}/src/@core/database/migrations/*{.ts,.js}`],
    seeds: [`${projectRoot}/src/@core/database/seeds/*{.ts,.js}`],
  }

  // Usar DATABASE_URL desde envs
  return {
    ...baseConfig,
    url: envs.database.url,
  }
}

export const dataSourceOptions = getTypeORMConfigForCLI()
const dataSource = new DataSource(dataSourceOptions)

export default dataSource
