/**
 * Helpers para generar descripciones de @ApiOperation automáticamente
 */

interface FilterField {
  name: string
  description: string
  type?: string
  example?: any
}

interface PaginatedOperationOptions {
  /** Resumen de la operación */
  summary: string
  /** Descripción adicional (opcional) */
  additionalDescription?: string
  /** Campos en los que busca el parámetro 'search' */
  searchFields?: string[]
  /** Campos por los que se puede ordenar */
  sortableFields?: string[]
  /** Campo de ordenamiento por defecto */
  defaultSortBy?: string
  /** Campos de filtrado personalizados */
  filterFields?: FilterField[]
}

/**
 * Genera la descripción completa para un endpoint de listado paginado
 *
 * @example
 * ```typescript
 * @ApiOperation(buildPaginatedOperation({
 *   summary: 'Listar usuarios',
 *   searchFields: ['names', 'lastNames', 'email', 'username', 'ci'],
 *   sortableFields: ['lastNames', 'email', 'createdAt', 'organizationId'],
 *   defaultSortBy: 'createdAt',
 *   filterFields: [
 *     { name: 'status', description: 'Filtrar por estado', type: 'enum: active, inactive, suspended' },
 *     { name: 'role', description: 'Filtrar por rol', type: 'enum: admin, gerente, auditor, cliente' },
 *     { name: 'organizationId', description: 'Filtrar por ID de organización', type: 'UUID' },
 *   ],
 * }))
 * ```
 */
export function buildPaginatedOperation(options: PaginatedOperationOptions): {
  summary: string
  description: string
} {
  const {
    summary,
    additionalDescription,
    searchFields,
    sortableFields,
    defaultSortBy = 'createdAt',
    filterFields = [],
  } = options

  const sections: string[] = []

  // Descripción adicional si existe
  if (additionalDescription) {
    sections.push(additionalDescription)
    sections.push('') // Línea en blanco
  } else {
    sections.push(
      'Obtiene una lista paginada con capacidades de búsqueda y filtrado.',
    )
    sections.push('') // Línea en blanco
  }

  // Sección de paginación
  sections.push('**Parámetros de paginación:**')
  sections.push('- `page`: Número de página (default: 1)')
  sections.push(
    '- `limit`: Cantidad de resultados por página (default: 10, max: 100)',
  )
  sections.push('- `all`: Devolver todos sin paginación (default: false)')
  sections.push(
    `- \`sortBy\`: Campo por el cual ordenar (default: ${defaultSortBy})`,
  )
  sections.push('- `sortOrder`: Orden ASC o DESC (default: DESC)')

  // Sección de filtrado
  if (searchFields && searchFields.length > 0) {
    sections.push('') // Línea en blanco
    sections.push('**Parámetros de filtrado:**')
    sections.push(
      `- \`search\`: Búsqueda de texto libre en ${searchFields.join(', ')}`,
    )

    // Agregar filtros personalizados
    for (const filter of filterFields) {
      const typeInfo = filter.type ? ` (${filter.type})` : ''
      const exampleInfo = filter.example ? ` - Ejemplo: ${filter.example}` : ''
      sections.push(
        `- \`${filter.name}\`: ${filter.description}${typeInfo}${exampleInfo}`,
      )
    }
  } else if (filterFields.length > 0) {
    sections.push('') // Línea en blanco
    sections.push('**Parámetros de filtrado:**')

    // Solo filtros personalizados
    for (const filter of filterFields) {
      const typeInfo = filter.type ? ` (${filter.type})` : ''
      const exampleInfo = filter.example ? ` - Ejemplo: ${filter.example}` : ''
      sections.push(
        `- \`${filter.name}\`: ${filter.description}${typeInfo}${exampleInfo}`,
      )
    }
  }

  // Sección de campos ordenables
  if (sortableFields && sortableFields.length > 0) {
    sections.push('') // Línea en blanco
    sections.push(`**Campos ordenables:** ${sortableFields.join(', ')}`)
  }

  return {
    summary,
    description: sections.join('\n').trim(),
  }
}

/**
 * Versión simplificada para endpoints de listado básico
 *
 * @example
 * ```typescript
 * @ApiOperation(buildListOperation('Listar usuarios'))
 * ```
 */
export function buildListOperation(summary: string): {
  summary: string
  description: string
} {
  return buildPaginatedOperation({ summary })
}
