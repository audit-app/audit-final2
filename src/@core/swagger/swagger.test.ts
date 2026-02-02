/**
 * Swagger Module - Test & Development Tool
 *
 * Herramienta para verificar y probar la documentación de Swagger/OpenAPI:
 * - validate: Valida la configuración de Swagger
 * - tags: Muestra todos los tags configurados
 * - endpoints: Lista todos los endpoints documentados
 * - generate: Genera el documento JSON de OpenAPI
 * - coverage: Verifica la cobertura de documentación
 *
 * Uso:
 *   npm run swagger:test                  # Validar todo
 *   npm run swagger:test tags             # Mostrar tags
 *   npm run swagger:test endpoints        # Listar endpoints
 *   npm run swagger:test generate         # Generar JSON
 *   npm run swagger:test coverage         # Verificar cobertura
 */

/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-nocheck - Suppress type errors in test file
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from '../../app.module'
import chalk from 'chalk'
import * as fs from 'fs'
import * as path from 'path'

// ============================================================================
// TYPES
// ============================================================================

interface EndpointInfo {
  path: string
  method: string
  tag: string
  summary?: string
  description?: string
  operationId?: string
  deprecated?: boolean
}

interface TagInfo {
  name: string
  description?: string
  endpointCount: number
}

interface SwaggerValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  info: string[]
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Crea y configura la aplicación Nest
 */
async function createApp() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  })

  // Aplicar el prefijo global como en main.ts
  app.setGlobalPrefix('api')

  return app
}

/**
 * Genera el documento de Swagger
 */
function generateSwaggerDocument(app: any) {
  const config = new DocumentBuilder()
    .setTitle('ATR API')
    .setDescription(
      'API de auditorías, plantillas, frameworks de madurez y gestión de usuarios',
    )
    .addBearerAuth()
    .setVersion('1.0')
    .addTag('Auth', 'Autenticación JWT con refresh tokens')
    .addTag('Two-Factor Authentication', 'Verificación 2FA')
    .addTag('Sessions', 'Control de Sesiones')
    .addTag('Trusted Devices', 'Trusted Devices')
    .addTag('Password Reset', 'Restablecimiento de Contraseña')
    .addTag('users', 'Gestión de usuarios')
    .addTag('organizations', 'Gestión de organizaciones')
    .addTag('templates', 'Gestión de plantillas (ISO 27001, ISO 9001, etc.)')
    .addTag('standards', 'Gestión de normas con estructura jerárquica')
    .addTag('maturity-levels', 'Niveles de madurez con textos predefinidos')
    .build()

  return SwaggerModule.createDocument(app, config)
}

/**
 * Extrae información de endpoints del documento de Swagger
 */
function extractEndpoints(document: any): EndpointInfo[] {
  const endpoints: EndpointInfo[] = []

  if (!document.paths) {
    return endpoints
  }

  for (const [path, pathItem] of Object.entries<any>(document.paths)) {
    for (const [method, operation] of Object.entries<any>(pathItem)) {
      // Ignorar campos que no son métodos HTTP
      if (
        !['get', 'post', 'put', 'patch', 'delete', 'options', 'head'].includes(
          method,
        )
      ) {
        continue
      }

      endpoints.push({
        path,
        method: method.toUpperCase(),
        tag: operation.tags?.[0] || 'untagged',
        summary: operation.summary,
        description: operation.description,
        operationId: operation.operationId,
        deprecated: operation.deprecated || false,
      })
    }
  }

  return endpoints
}

/**
 * Extrae información de tags del documento de Swagger
 */
function extractTags(document: any, endpoints: EndpointInfo[]): TagInfo[] {
  const tagMap = new Map<string, TagInfo>()

  // Procesar tags definidos en el documento
  if (document.tags) {
    for (const tag of document.tags) {
      tagMap.set(tag.name, {
        name: tag.name,
        description: tag.description,
        endpointCount: 0,
      })
    }
  }

  // Contar endpoints por tag
  for (const endpoint of endpoints) {
    const tagName = endpoint.tag
    if (!tagMap.has(tagName)) {
      tagMap.set(tagName, {
        name: tagName,
        description: undefined,
        endpointCount: 0,
      })
    }
    const tag = tagMap.get(tagName)!
    tag.endpointCount++
  }

  return Array.from(tagMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  )
}

/**
 * Valida la configuración de Swagger
 */
function validateSwaggerDocument(document: any): SwaggerValidationResult {
  const result: SwaggerValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    info: [],
  }

  // Validar campos básicos
  if (!document.info?.title) {
    result.errors.push('Falta el título de la API')
    result.isValid = false
  }

  if (!document.info?.version) {
    result.errors.push('Falta la versión de la API')
    result.isValid = false
  }

  if (!document.info?.description) {
    result.warnings.push('Falta la descripción de la API')
  }

  // Validar paths
  if (!document.paths || Object.keys(document.paths).length === 0) {
    result.errors.push('No se encontraron endpoints documentados')
    result.isValid = false
  } else {
    result.info.push(
      `Se encontraron ${Object.keys(document.paths).length} paths documentados`,
    )
  }

  // Validar tags
  if (!document.tags || document.tags.length === 0) {
    result.warnings.push('No se encontraron tags definidos')
  } else {
    result.info.push(`Se encontraron ${document.tags.length} tags definidos`)
  }

  // Validar seguridad
  if (!document.components?.securitySchemes) {
    result.warnings.push('No se encontraron esquemas de seguridad definidos')
  } else {
    const schemes = Object.keys(document.components.securitySchemes)
    result.info.push(
      `Esquemas de seguridad: ${schemes.join(', ') || 'ninguno'}`,
    )
  }

  return result
}

/**
 * Verifica la cobertura de documentación
 */
function checkDocumentationCoverage(endpoints: EndpointInfo[]): {
  total: number
  documented: number
  withDescription: number
  withSummary: number
  percentage: number
} {
  const total = endpoints.length
  const documented = endpoints.filter((e) => e.summary || e.description).length
  const withSummary = endpoints.filter((e) => e.summary).length
  const withDescription = endpoints.filter((e) => e.description).length

  return {
    total,
    documented,
    withSummary,
    withDescription,
    percentage: total > 0 ? Math.round((documented / total) * 100) : 0,
  }
}

// ============================================================================
// TEST SCENARIOS
// ============================================================================

interface TestScenario {
  name: string
  icon: string
  description: string
  run: (document: any, endpoints: EndpointInfo[]) => Promise<void> | void
}

const TEST_SCENARIOS: Record<string, TestScenario> = {
  validate: {
    name: 'Validar Configuración',
    icon: '✅',
    description: 'Valida la configuración de Swagger y detecta errores',
    run(document: any) {
      const validation = validateSwaggerDocument(document)

      console.log('')

      if (validation.errors.length > 0) {
        console.log(chalk.red.bold('  ❌ Errores:\n'))
        validation.errors.forEach((error) => {
          console.log(chalk.red(`    • ${error}`))
        })
        console.log('')
      }

      if (validation.warnings.length > 0) {
        console.log(chalk.yellow.bold('  ⚠️  Advertencias:\n'))
        validation.warnings.forEach((warning) => {
          console.log(chalk.yellow(`    • ${warning}`))
        })
        console.log('')
      }

      if (validation.info.length > 0) {
        console.log(chalk.cyan.bold('  ℹ️  Información:\n'))
        validation.info.forEach((info) => {
          console.log(chalk.cyan(`    • ${info}`))
        })
        console.log('')
      }

      if (validation.isValid) {
        console.log(
          chalk.green.bold('  ✅ La configuración de Swagger es válida\n'),
        )
      } else {
        console.log(
          chalk.red.bold('  ❌ La configuración de Swagger tiene errores\n'),
        )
      }
    },
  },

  tags: {
    name: 'Mostrar Tags',
    icon: '🏷️',
    description: 'Muestra todos los tags configurados con sus endpoints',
    run(document: any, endpoints: EndpointInfo[]) {
      const tags = extractTags(document, endpoints)

      console.log('')
      console.log(chalk.cyan.bold('  📋 Tags Configurados:\n'))

      if (tags.length === 0) {
        console.log(chalk.yellow('    No se encontraron tags\n'))
        return
      }

      tags.forEach((tag) => {
        console.log(chalk.white.bold(`  ${tag.name}`))
        if (tag.description) {
          console.log(chalk.gray(`    ${tag.description}`))
        }
        console.log(chalk.cyan(`    Endpoints: ${tag.endpointCount}`))
        console.log('')
      })

      console.log(
        chalk.green(`  Total de tags: ${chalk.bold(tags.length.toString())}\n`),
      )
    },
  },

  endpoints: {
    name: 'Listar Endpoints',
    icon: '📡',
    description: 'Lista todos los endpoints documentados',
    run(_document: any, endpoints: EndpointInfo[]) {
      console.log('')
      console.log(chalk.cyan.bold('  📡 Endpoints Documentados:\n'))

      if (endpoints.length === 0) {
        console.log(chalk.yellow('    No se encontraron endpoints\n'))
        return
      }

      // Agrupar por tag
      const groupedByTag = endpoints.reduce(
        (acc, endpoint) => {
          const tag = endpoint.tag
          if (!acc[tag]) acc[tag] = []
          acc[tag].push(endpoint)
          return acc
        },
        {} as Record<string, EndpointInfo[]>,
      )

      // Mostrar por tag
      for (const [tag, tagEndpoints] of Object.entries(groupedByTag)) {
        console.log(chalk.yellow.bold(`  ${tag}:`))
        console.log('')

        tagEndpoints.forEach((endpoint) => {
          const methodColor =
            {
              GET: chalk.green,
              POST: chalk.blue,
              PUT: chalk.yellow,
              PATCH: chalk.cyan,
              DELETE: chalk.red,
            }[endpoint.method] || chalk.white

          console.log(
            `    ${methodColor.bold(endpoint.method.padEnd(7))} ${chalk.white(endpoint.path)}`,
          )

          if (endpoint.summary) {
            console.log(chalk.gray(`      ${endpoint.summary}`))
          }

          if (endpoint.deprecated) {
            console.log(chalk.red.bold('      ⚠️  DEPRECATED'))
          }

          console.log('')
        })
      }

      console.log(
        chalk.green(
          `  Total de endpoints: ${chalk.bold(endpoints.length.toString())}\n`,
        ),
      )
    },
  },

  generate: {
    name: 'Generar Documento JSON',
    icon: '📄',
    description: 'Genera el documento OpenAPI JSON',
    run(document: any) {
      const outputPath = path.join(process.cwd(), 'swagger-spec.json')

      fs.writeFileSync(outputPath, JSON.stringify(document, null, 2))

      console.log('')
      console.log(chalk.green.bold('  ✅ Documento generado exitosamente\n'))
      console.log(chalk.cyan('  Archivo:'), chalk.white(outputPath))
      console.log('')
      console.log(chalk.yellow('  💡 Puedes usar este archivo para:'))
      console.log(chalk.white('    • Importar en Postman'))
      console.log(chalk.white('    • Generar clientes con OpenAPI Generator'))
      console.log(chalk.white('    • Validar con herramientas externas'))
      console.log('')
    },
  },

  coverage: {
    name: 'Verificar Cobertura',
    icon: '📊',
    description: 'Verifica la cobertura de documentación',
    run(_document: any, endpoints: EndpointInfo[]) {
      const coverage = checkDocumentationCoverage(endpoints)

      console.log('')
      console.log(chalk.cyan.bold('  📊 Cobertura de Documentación:\n'))

      console.log(
        chalk.white('  Total de endpoints:      '),
        chalk.bold(coverage.total.toString()),
      )
      console.log(
        chalk.white('  Con summary:             '),
        chalk.bold(coverage.withSummary.toString()),
      )
      console.log(
        chalk.white('  Con description:         '),
        chalk.bold(coverage.withDescription.toString()),
      )
      console.log(
        chalk.white('  Endpoints documentados:  '),
        chalk.bold(coverage.documented.toString()),
      )

      console.log('')

      const percentageColor =
        coverage.percentage >= 80
          ? chalk.green
          : coverage.percentage >= 50
            ? chalk.yellow
            : chalk.red

      console.log(
        percentageColor.bold(`  Cobertura: ${coverage.percentage}%\n`),
      )

      if (coverage.percentage < 100) {
        console.log(chalk.yellow('  ⚠️  Endpoints sin documentación:\n'))

        const undocumented = endpoints.filter(
          (e) => !e.summary && !e.description,
        )

        undocumented.slice(0, 10).forEach((endpoint) => {
          const methodColor =
            {
              GET: chalk.green,
              POST: chalk.blue,
              PUT: chalk.yellow,
              PATCH: chalk.cyan,
              DELETE: chalk.red,
            }[endpoint.method] || chalk.white

          console.log(
            `    ${methodColor.bold(endpoint.method.padEnd(7))} ${chalk.white(endpoint.path)}`,
          )
        })

        if (undocumented.length > 10) {
          console.log(
            chalk.gray(`\n    ... y ${undocumented.length - 10} endpoints más`),
          )
        }

        console.log('')
      }
    },
  },
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Ejecuta un solo escenario
 */
async function runSingleScenario(name: string) {
  const scenario = TEST_SCENARIOS[name]

  if (!scenario) {
    console.error(chalk.red('\n❌ Escenario inválido:'), name)
    console.log(chalk.yellow('\n💡 Escenarios disponibles:'))
    Object.entries(TEST_SCENARIOS).forEach(([key, s]) => {
      console.log(chalk.white(`  - ${key.padEnd(15)} ${s.icon} ${s.name}`))
    })
    console.log('')
    process.exit(1)
  }

  console.log(chalk.cyan('\n' + '═'.repeat(70)))
  console.log(chalk.bold.cyan(`  ${scenario.icon} ${scenario.name}`))
  console.log(chalk.gray(`  ${scenario.description}`))
  console.log(chalk.cyan('═'.repeat(70)))

  const app = await createApp()
  const document = generateSwaggerDocument(app)
  const endpoints = extractEndpoints(document)

  await scenario.run(document, endpoints)

  console.log(chalk.cyan('═'.repeat(70) + '\n'))

  await app.close()
}

/**
 * Ejecuta todos los escenarios
 */
async function runAllScenarios() {
  console.log(chalk.cyan('\n' + '═'.repeat(70)))
  console.log(
    chalk.bold.cyan('  📚 Swagger - Verificación Completa de Documentación'),
  )
  console.log(chalk.cyan('═'.repeat(70)))

  const app = await createApp()
  const document = generateSwaggerDocument(app)
  const endpoints = extractEndpoints(document)

  let successCount = 0
  let errorCount = 0

  for (const [name, scenario] of Object.entries(TEST_SCENARIOS)) {
    console.log(chalk.cyan('\n' + '━'.repeat(70)))
    console.log(chalk.bold.white(`${scenario.icon} ${scenario.name}`))
    console.log(chalk.gray(`${scenario.description}`))
    console.log(chalk.cyan('━'.repeat(70)))

    try {
      await scenario.run(document, endpoints)
      successCount++
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      console.error(chalk.red(`\n  ✖ Error: ${errorMessage}\n`))
      errorCount++
    }
  }

  console.log(chalk.cyan('═'.repeat(70)))
  console.log(
    chalk.bold.green(
      `  ✓ Completado: ${successCount} exitosos, ${errorCount} errores`,
    ),
  )
  console.log(chalk.cyan('═'.repeat(70) + '\n'))

  console.log(chalk.yellow('🌐 URLs:\n'))
  console.log(
    chalk.white('  • Swagger UI:   '),
    chalk.cyan('http://localhost:3001/api/docs'),
  )
  console.log(
    chalk.white('  • OpenAPI JSON: '),
    chalk.cyan('http://localhost:3001/api/docs-json'),
  )
  console.log('')

  console.log(chalk.yellow('💡 Tips:\n'))
  console.log(
    chalk.white('  • Usa @ApiOperation() para añadir summary y description'),
  )
  console.log(chalk.white('  • Usa @ApiTags() para agrupar endpoints'))
  console.log(chalk.white('  • Usa @ApiResponse() para documentar respuestas'))
  console.log(chalk.white('  • Usa @ApiBearerAuth() para endpoints protegidos'))
  console.log('')

  await app.close()
}

/**
 * Muestra ayuda
 */
function showHelp() {
  console.log(chalk.cyan('\n' + '═'.repeat(70)))
  console.log(chalk.bold.cyan('  📚 Swagger - Herramienta de Testing'))
  console.log(chalk.cyan('═'.repeat(70) + '\n'))

  console.log(chalk.yellow('🚀 Comandos:\n'))
  console.log(chalk.white('  Verificar todo:'))
  console.log(chalk.green('    npm run swagger:test'))
  console.log('')
  console.log(chalk.white('  Ejecutar escenario específico:'))
  Object.keys(TEST_SCENARIOS).forEach((key) => {
    console.log(chalk.green(`    npm run swagger:test ${key}`))
  })
  console.log('')

  console.log(chalk.yellow('📋 Escenarios disponibles:\n'))
  Object.entries(TEST_SCENARIOS).forEach(([key, scenario]) => {
    console.log(
      chalk.white(
        `  ${scenario.icon} ${key.padEnd(15)} - ${scenario.description}`,
      ),
    )
  })
  console.log('')

  console.log(chalk.yellow('✨ Características verificadas:\n'))
  console.log(chalk.white('  ✅ Validación de configuración'))
  console.log(chalk.white('     Verifica título, versión, descripción'))
  console.log('')
  console.log(chalk.white('  🏷️  Tags y agrupación'))
  console.log(chalk.white('     Muestra tags con conteo de endpoints'))
  console.log('')
  console.log(chalk.white('  📡 Listado de endpoints'))
  console.log(chalk.white('     Agrupa endpoints por tag con métodos HTTP'))
  console.log('')
  console.log(chalk.white('  📄 Generación de JSON'))
  console.log(chalk.white('     Exporta especificación OpenAPI completa'))
  console.log('')
  console.log(chalk.white('  📊 Cobertura de documentación'))
  console.log(chalk.white('     Reporta % de endpoints documentados'))
  console.log('')

  console.log(chalk.cyan('═'.repeat(70) + '\n'))
}

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================

async function main() {
  const mode = process.argv[2] || 'all'

  try {
    switch (mode) {
      case 'all':
        await runAllScenarios()
        break

      case 'help':
      case '--help':
      case '-h':
        showHelp()
        break

      default:
        // Intentar como escenario
        if (TEST_SCENARIOS[mode]) {
          await runSingleScenario(mode)
        } else {
          console.error(chalk.red('\n❌ Comando inválido:'), mode)
          showHelp()
          process.exit(1)
        }
    }

    process.exit(0)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(chalk.red('\n❌ Error:'), errorMessage)
    if (error instanceof Error && error.stack) {
      console.error(chalk.gray(error.stack))
    }
    process.exit(1)
  }
}

// Ejecutar

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main()
