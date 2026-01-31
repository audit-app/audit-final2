import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, IsNull } from 'typeorm'
import { BaseRepository } from '@core/repositories'
import { TransactionService } from '@core/database'
import { AuditService } from '@core/context'
import { StandardEntity } from '../entities/standard.entity'
import type { IStandardsRepository } from './interfaces/standards-repository.interface'

@Injectable()
export class StandardsRepository
  extends BaseRepository<StandardEntity>
  implements IStandardsRepository
{
  constructor(
    @InjectRepository(StandardEntity)
    repository: Repository<StandardEntity>,
    transactionService: TransactionService,
    auditService: AuditService,
  ) {
    super(repository, transactionService, auditService)
  }

  // ===========================================================================
  //  ÁRBOLES Y ESTRUCTURA
  // ===========================================================================

  async getTree(
    templateId: string,
    search?: string,
  ): Promise<StandardEntity[]> {
    // 1. Traer todo plano, ordenado jerárquicamente
    const items = await this.getRepo().find({
      where: { templateId },
      order: { level: 'ASC', order: 'ASC' },
    })

    const roots: StandardEntity[] = []
    const map = new Map<string, StandardEntity>()

    // Inicializar mapa y limpiar hijos residuales
    items.forEach((item) => {
      item.children = []
      map.set(item.id, item)
    })

    // Conectar cables (Referencias)
    items.forEach((item) => {
      if (item.parentId && map.has(item.parentId)) {
        map.get(item.parentId)!.children.push(item)
      } else {
        roots.push(item) // Es raíz (o huérfano seguro)
      }
    })
    // 3. Aplicar Filtro si existe
    if (search && search.trim().length > 0) {
      return filterTreeNodes(roots, search.trim())
    }
    return roots
  }

  /**
   * Obtiene todos los standards de forma plana.
   * Útil para exportaciones, búsquedas internas o validaciones masivas.
   */
  async findByTemplate(templateId: string): Promise<StandardEntity[]> {
    return await this.getRepo().find({
      where: { templateId },
      order: { order: 'ASC' }, // Orden visual por defecto
    })
  }

  /**
   * Busca hijos directos de un padre específico (o raíces si parentId es null).
   */
  async findByParent(
    templateId: string,
    parentId: string | null,
  ): Promise<StandardEntity[]> {
    return await this.getRepo().find({
      where: {
        templateId,
        parentId: parentId || IsNull(),
      },
      order: { order: 'ASC' },
    })
  }

  // ===========================================================================
  //  BÚSQUEDAS ESPECÍFICAS Y VALIDACIONES
  // ===========================================================================

  /**
   * Obtiene solo los checklist items (auditables).
   * CRÍTICO: Se usa para instanciar una Auditoría real.
   */
  async findAuditableByTemplate(templateId: string): Promise<StandardEntity[]> {
    return await this.getRepo().find({
      where: { templateId, isAuditable: true },
      order: { order: 'ASC' },
    })
  }

  /**
   * Busca por código (Validaciones de unicidad o búsqueda rápida).
   */
  async findByCode(
    templateId: string,
    code: string,
  ): Promise<StandardEntity | null> {
    return await this.getRepo().findOne({
      where: { templateId, code },
    })
  }

  /**
   * Validación compleja de unicidad (ideal para Updates).
   * Permite excluir un ID para no chocar consigo mismo al editar.
   */
  async existsByCodeInTemplate(
    templateId: string,
    code: string,
    excludeId?: string,
  ): Promise<boolean> {
    const query = this.getRepo()
      .createQueryBuilder('standard')
      .where('standard.templateId = :templateId', { templateId })
      .andWhere('standard.code = :code', { code })

    if (excludeId) {
      query.andWhere('standard.id != :excludeId', { excludeId })
    }

    return (await query.getCount()) > 0
  }

  // ===========================================================================
  // CÁLCULOS Y UTILITARIOS
  // ===========================================================================

  /**
   * Cuenta hijos.
   * Se usa para validar "isAuditable".
   */
  async countChildren(parentId: string): Promise<number> {
    return await this.getRepo().count({
      where: { parentId },
    })
  }

  /**
   * Obtiene el siguiente número de orden disponible.
   */
  async getMaxOrderByParent(
    templateId: string,
    parentId: string | null,
  ): Promise<number> {
    const lastStandard = await this.getRepo().findOne({
      where: {
        templateId,
        parentId: parentId || IsNull(),
      },
      order: { order: 'DESC' }, // El más alto primero
    })

    return lastStandard ? lastStandard.order : 0
  }

  /**
   * Calcula la suma total de pesos de todos los standards auditables
   * de un template (excluyendo opcionalmente uno por su ID).
   *
   * @param templateId - ID del template
   * @param excludeId - ID del standard a excluir (útil para validar updates)
   * @returns Suma total de pesos (0-100)
   */
  async getTotalWeightByTemplate(
    templateId: string,
    excludeId?: string,
  ): Promise<number> {
    const query = this.getRepo()
      .createQueryBuilder('standard')
      .select('SUM(standard.weight)', 'totalWeight')
      .where('standard.templateId = :templateId', { templateId })
      .andWhere('standard.isAuditable = :isAuditable', { isAuditable: true })

    if (excludeId) {
      query.andWhere('standard.id != :excludeId', { excludeId })
    }

    const result = await query.getRawOne()
    return parseFloat(result?.totalWeight || '0')
  }
}

function filterTreeNodes(
  nodes: StandardEntity[],
  search: string,
): StandardEntity[] {
  const lowerSearch = search.toLowerCase()

  return nodes.reduce((acc: StandardEntity[], node) => {
    // 1. Filtrar hijos primero (Bottom-Up)
    const filteredChildren = filterTreeNodes(node.children, lowerSearch)

    // 2. Comprobar coincidencia en el nodo actual
    // Agregamos comprobación segura de description por si es null
    const matchesSelf =
      node.code.toLowerCase().includes(lowerSearch) ||
      node.title.toLowerCase().includes(lowerSearch) ||
      (node.description && node.description.toLowerCase().includes(lowerSearch))

    // 3. Regla de Oro: Me quedo si yo coincido O si tengo hijos que coinciden
    if (matchesSelf || filteredChildren.length > 0) {
      // Importante: Clonar para no mutar referencias si usas caché
      acc.push({
        ...node,
        children: filteredChildren,
      } as StandardEntity)
    }

    return acc
  }, [])
}
