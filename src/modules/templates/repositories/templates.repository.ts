import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Like } from 'typeorm'
import { BaseRepository } from '@core/repositories'
import { TransactionService, AuditService } from '@core/database'
import { TemplateEntity } from '../entities/template.entity'
import { TemplateStatus } from '../constants/template-status.enum'
import type {
  ITemplatesRepository,
  TemplateFilters,
} from './interfaces/templates-repository.interface'

/**
 * Templates Repository
 *
 * Repositorio para gestionar templates de auditoría
 * Usa BaseRepository para integración con CLS y transacciones
 */
@Injectable()
export class TemplatesRepository
  extends BaseRepository<TemplateEntity>
  implements ITemplatesRepository
{
  constructor(
    @InjectRepository(TemplateEntity)
    repository: Repository<TemplateEntity>,
    transactionService: TransactionService,
    auditService: AuditService,
  ) {
    super(repository, transactionService, auditService)
  }

  /**
   * Busca un template por nombre y versión
   *
   * @param name - Nombre del template
   * @param version - Versión del template
   * @returns Template encontrado o null
   */
  async findByNameAndVersion(
    name: string,
    version: string,
  ): Promise<TemplateEntity | null> {
    return await this.getRepo().findOne({
      where: { name, version },
    })
  }

  /**
   * Obtiene todos los templates con un status específico
   *
   * @param status - Status del template
   * @returns Lista de templates
   */
  async findByStatus(status: TemplateStatus): Promise<TemplateEntity[]> {
    return await this.getRepo().find({
      where: { status },
      order: { name: 'ASC', version: 'DESC' },
    })
  }

  /**
   * Obtiene todos los templates publicados (usables)
   *
   * @returns Lista de templates publicados
   */
  async findPublished(): Promise<TemplateEntity[]> {
    return await this.findByStatus(TemplateStatus.PUBLISHED)
  }

  /**
   * Obtiene un template con sus standards
   *
   * @param id - ID del template
   * @returns Template con standards o null
   */
  async findOneWithStandards(id: string): Promise<TemplateEntity | null> {
    return await this.getRepo().findOne({
      where: { id },
      relations: ['standards'],
      order: {
        standards: {
          order: 'ASC',
        },
      },
    })
  }

  /**
   * Cambia el status de un template
   *
   * @param id - ID del template
   * @param status - Nuevo status
   * @returns Template actualizado o null si no existe
   */
  async updateStatus(
    id: string,
    status: TemplateStatus,
  ): Promise<TemplateEntity | null> {
    const template = await this.findById(id)
    if (!template) {
      return null
    }
    template.status = status
    return await this.getRepo().save(template)
  }

  /**
   * Obtiene todas las versiones de un template
   *
   * @param name - Nombre del template
   * @returns Lista de versiones ordenadas (más reciente primero)
   */
  async findVersionsByName(name: string): Promise<TemplateEntity[]> {
    return await this.getRepo().find({
      where: { name },
      order: { version: 'DESC' },
    })
  }

  /**
   * Obtiene la última versión de un template
   *
   * @param name - Nombre del template
   * @returns Template de la última versión o null
   */
  async findLatestVersion(name: string): Promise<TemplateEntity | null> {
    const versions = await this.findVersionsByName(name)
    return versions[0] || null
  }

  /**
   * Busca templates con filtros y paginación
   *
   * @param filters - Filtros de búsqueda
   * @param page - Número de página (opcional)
   * @param limit - Cantidad de resultados por página (opcional)
   * @param sortBy - Campo por el cual ordenar (opcional, default: 'createdAt')
   * @param sortOrder - Orden ASC o DESC (opcional, default: 'DESC')
   * @returns Tupla [templates, total]
   */
  async findWithFilters(
    filters: TemplateFilters,
    page?: number,
    limit?: number,
    sortBy: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
  ): Promise<[TemplateEntity[], number]> {
    const qb = this.getRepo().createQueryBuilder('template')

    // Filtro de búsqueda de texto
    if (filters.search) {
      qb.where(
        '(template.name ILIKE :search OR template.description ILIKE :search OR template.version ILIKE :search)',
        { search: `%${filters.search}%` },
      )
    }

    // Filtro por status
    if (filters.status) {
      qb.andWhere('template.status = :status', { status: filters.status })
    }

    // Ordenamiento
    qb.orderBy(`template.${sortBy}`, sortOrder)

    // Paginación
    if (page !== undefined && limit !== undefined) {
      const skip = (page - 1) * limit
      qb.skip(skip).take(limit)
    }

    return await qb.getManyAndCount()
  }
}
