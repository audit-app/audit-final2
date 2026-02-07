import { DataSource, DataSourceOptions } from 'typeorm'
import { SeederOptions } from 'typeorm-extension'
import { TypeOrmDatabaseLogger } from '@core/logger'
import { envs } from '@core/config'

function getTypeORMConfigForCLI(): DataSourceOptions & SeederOptions {
  const projectRoot = process.cwd()

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

  return {
    ...baseConfig,
    url: envs.database.url,
  }
}

export const dataSourceOptions = getTypeORMConfigForCLI()
const dataSource = new DataSource(dataSourceOptions)

export default dataSource
