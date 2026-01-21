import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, IsNull } from 'typeorm'
import { BaseRepository } from '@core/repositories'
import { TransactionService, AuditService } from '@core/database'
import { StandardEntity } from '../entities/standard.entity'
import type { IStandardsRepository } from './interfaces/standards-repository.interface'

/**
 * Standards Repository
 *
 * Repositorio para gestionar standards/controles de templates
 * Usa BaseRepository para integración con CLS y transacciones
 */
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

  /**
   * Obtiene todos los standards de un template
   *
   * @param templateId - ID del template
   * @returns Lista de standards ordenados por order
   */
  async findByTemplate(templateId: string): Promise<StandardEntity[]> {
    return await this.getRepo().find({
      where: { templateId },
      relations: ['parent', 'children'],
      order: { order: 'ASC' },
    })
  }

  /**
   * Obtiene los standards raíz (sin padre) de un template
   *
   * @param templateId - ID del template
   * @returns Lista de standards raíz ordenados por order
   */
  async findRootByTemplate(templateId: string): Promise<StandardEntity[]> {
    return await this.getRepo().find({
      where: { templateId, parentId: IsNull() },
      relations: ['children'],
      order: { order: 'ASC' },
    })
  }

  /**
   * Obtiene los hijos directos de un standard
   *
   * @param parentId - ID del standard padre
   * @returns Lista de standards hijos ordenados por order
   */
  async findChildren(parentId: string): Promise<StandardEntity[]> {
    return await this.getRepo().find({
      where: { parentId },
      relations: ['children'],
      order: { order: 'ASC' },
    })
  }

  /**
   * Obtiene solo los standards auditables de un template
   *
   * @param templateId - ID del template
   * @returns Lista de standards auditables
   */
  async findAuditableByTemplate(templateId: string): Promise<StandardEntity[]> {
    return await this.getRepo().find({
      where: {
        templateId,
        isAuditable: true,
      },
      order: { order: 'ASC' },
    })
  }

  /**
   * Busca un standard por código dentro de un template
   *
   * @param templateId - ID del template
   * @param code - Código del standard
   * @returns Standard encontrado o null
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
   * Obtiene un standard con sus relaciones completas
   *
   * @param id - ID del standard
   * @returns Standard con relaciones o null
   */
  async findOneWithRelations(id: string): Promise<StandardEntity | null> {
    return await this.getRepo().findOne({
      where: { id },
      relations: ['template', 'parent', 'children'],
    })
  }

  /**
   * Cuenta los hijos de un standard
   *
   * @param parentId - ID del standard padre
   * @returns Número de hijos
   */
  async countChildren(parentId: string): Promise<number> {
    return await this.getRepo().count({
      where: { parentId },
    })
  }

  /**
   * Busca todos los standards con opciones de filtrado
   *
   * @param options - Opciones de búsqueda de TypeORM
   * @returns Lista de standards
   */
  async findAllStandards(
    options?: Parameters<typeof this.findAll>[0],
  ): Promise<StandardEntity[]> {
    return await this.findAll(options)
  }

  /**
   * Verifica si un standard tiene hijos
   *
   * @param standardId - ID del standard
   * @returns true si tiene hijos, false en caso contrario
   */
  async hasChildren(standardId: string): Promise<boolean> {
    const count = await this.countChildren(standardId)
    return count > 0
  }

  /**
   * Verifica si existe un standard con el mismo código en el template
   *
   * @param templateId - ID del template
   * @param code - Código del standard
   * @param excludeId - ID del standard a excluir (para updates)
   * @returns true si existe, false en caso contrario
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

    const count = await query.getCount()
    return count > 0
  }

  /**
   * Obtiene el orden máximo de los hermanos (mismo parentId)
   * Útil para agregar un nuevo standard al final de la lista
   *
   * @param templateId - ID del template
   * @param parentId - ID del padre (null para nivel raíz)
   * @returns Orden máximo (0 si no hay hermanos)
   */
  async getMaxOrderByParent(
    templateId: string,
    parentId: string | null,
  ): Promise<number> {
    const result = await this.getRepo()
      .createQueryBuilder('standard')
      .select('MAX(standard.order)', 'maxOrder')
      .where('standard.templateId = :templateId', { templateId })
      .andWhere(
        parentId ? 'standard.parentId = :parentId' : 'standard.parentId IS NULL',
        parentId ? { parentId } : {},
      )
      .getRawOne()

    return result?.maxOrder ?? 0
  }
}
