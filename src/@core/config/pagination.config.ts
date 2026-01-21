import { registerAs } from '@nestjs/config'

export interface PaginationConfig {
  defaultPageSize: number
  maxPageSize: number
}

export const paginationConfig = registerAs(
  'pagination',
  (): PaginationConfig => ({
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || '10', 10),
    maxPageSize: parseInt(process.env.MAX_PAGE_SIZE || '100', 10),
  }),
)
