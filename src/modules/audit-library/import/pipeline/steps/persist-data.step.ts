import { Injectable, Logger, Inject } from '@nestjs/common'
import { TEMPLATES_REPOSITORY } from '@core'
import type { ITemplatesRepository } from '../../../templates/repositories'
import { TransactionService } from '@core/database'
import { HierarchyProcessorUtil, TreeBuilderUtil } from '../../utils'
import {
  ValidatedImportData,
  StandardTreeNode,
  ImportResult,
} from '../../interfaces/import-data.interface'

/**
 * Persist Data Step
 *
 * Responsabilidad: SOLO guardar datos en base de datos
 * - Construye árbol jerárquico en memoria (usando TreeBuilderUtil)
 * - Usa cascade para guardar todo de una vez
 * - Maneja transacciones
 *
 * ✨ VENTAJAS DEL CASCADE:
 * - ⚡ 1 query vs N queries (mucho más rápido)
 * - 🧹 Código simple (TreeBuilderUtil hace el trabajo pesado)
 * - 🔒 Transacción automática (todo o nada)
 * - 🎯 TypeORM resuelve referencias automáticamente
 *
 * Proceso:
 * 1. Ordenar standards por nivel (padres primero)
 * 2. Construir árbol con TreeBuilderUtil
 * 3. Guardar template con cascade (standards anidados)
 */
@Injectable()
export class PersistDataStep {
  private readonly logger = new Logger(PersistDataStep.name)

  constructor(
    @Inject(TEMPLATES_REPOSITORY)
    private readonly templatesRepository: ITemplatesRepository,
    private readonly transactionService: TransactionService,
  ) {}

  /**
   * Ejecuta persistencia con cascade
   */
  async execute(validatedData: ValidatedImportData): Promise<ImportResult> {
    if (!validatedData.success) {
      return {
        success: false,
        errors: [
          ...validatedData.errors,
          ...validatedData.crossValidationErrors,
        ],
        message: 'No se puede guardar. El resultado contiene errores de validación.',
      }
    }

    try {
      return await this.transactionService.runInTransaction(async () => {
        this.logger.log('💾 Construyendo árbol de standards...')

        // 1. Ordenar standards por jerarquía (padres antes que hijos)
        const sortedStandards = HierarchyProcessorUtil.sortByHierarchy(
          validatedData.standards,
        )

        // 2. Construir árbol jerárquico usando utility reutilizable
        const standardsTree = TreeBuilderUtil.buildTree(sortedStandards)

        // Verificar que el árbol se construyó correctamente
        const totalNodes = TreeBuilderUtil.countNodes(standardsTree)
        if (totalNodes !== validatedData.summary.totalValidRows) {
          this.logger.warn(
            `⚠️  Árbol construido con ${totalNodes} nodos, esperados ${validatedData.summary.totalValidRows}`,
          )
        }

        this.logger.log(
          `🌳 Árbol construido: ${standardsTree.length} nodos raíz, ` +
            `${validatedData.summary.hierarchyDepth} niveles, ` +
            `${totalNodes} nodos totales`,
        )

        // 3. Crear template con standards anidados
        const templateData = {
          name: validatedData.metadata.name,
          code: validatedData.metadata.code,
          description: validatedData.metadata.description,
          version: validatedData.metadata.version,
          standards: standardsTree, // ✨ Cascade guardará todo el árbol!
        }

        this.logger.log('💾 Guardando con cascade...')

        // 4. Un solo save - cascade hace toda la magia
        const savedTemplate = await this.templatesRepository.save(templateData)

        this.logger.log(
          `✅ Template "${savedTemplate.name}" creado con ${totalNodes} standards`,
        )

        return {
          success: true,
          templateId: savedTemplate.id,
          standardsCount: totalNodes,
          message: `Template "${savedTemplate.name}" importado exitosamente con ${totalNodes} standards`,
        }
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.logger.error(`❌ Error guardando datos: ${errorMessage}`)

      return {
        success: false,
        message: `Error guardando en base de datos: ${errorMessage}`,
      }
    }
  }
}
