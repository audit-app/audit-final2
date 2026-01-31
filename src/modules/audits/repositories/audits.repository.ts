import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, IsNull, SelectQueryBuilder } from 'typeorm'
import { BaseRepository } from '@core/repositories'
import { TransactionService } from '@core/database'
import { AuditService } from '@core/context'
import { AuditEntity } from '../entities/audit.entity'
import { AuditStatus } from '../enums/audit-status.enum'
import type { IAuditsRepository } from './interfaces'

/**
 * Repositorio de Auditorías
 *
 * Extiende BaseRepository para aprovechar:
 * - Transacciones automáticas vía CLS
 * - Auditoría automática (createdBy/updatedBy)
 * - Métodos CRUD genéricos
 */
@Injectable()
export class AuditsRepository
  extends BaseRepository<AuditEntity>
  implements IAuditsRepository
{
  constructor(
    @InjectRepository(AuditEntity)
    repository: Repository<AuditEntity>,
    transactionService: TransactionService,
    auditService: AuditService,
  ) {
    super(repository, transactionService, auditService)
  }

  /**
   * Busca una auditoría por código
   */
  async findByCode(code: string): Promise<AuditEntity | null> {
    return await this.getRepo().findOne({ where: { code } })
  }

  /**
   * Busca auditorías por organización
   */
  async findByOrganization(organizationId: string): Promise<AuditEntity[]> {
    return await this.getRepo().find({
      where: { organizationId },
      relations: ['template', 'organization', 'framework'],
      order: { createdAt: 'DESC' },
    })
  }

  /**
   * Busca auditorías por template
   */
  async findByTemplate(templateId: string): Promise<AuditEntity[]> {
    return await this.getRepo().find({
      where: { templateId },
      relations: ['organization', 'framework'],
      order: { createdAt: 'DESC' },
    })
  }

  /**
   * Busca auditorías por estado
   */
  async findByStatus(status: AuditStatus): Promise<AuditEntity[]> {
    return await this.getRepo().find({
      where: { status },
      relations: ['template', 'organization', 'framework'],
      order: { createdAt: 'DESC' },
    })
  }

  /**
   * Busca revisiones de una auditoría específica
   */
  async findRevisions(parentAuditId: string): Promise<AuditEntity[]> {
    return await this.getRepo().find({
      where: { parentAuditId },
      relations: ['assignments'],
      order: { revisionNumber: 'ASC' },
    })
  }

  /**
   * Busca auditorías iniciales (sin padre)
   */
  async findInitialAudits(): Promise<AuditEntity[]> {
    return await this.getRepo().find({
      where: { parentAuditId: IsNull() },
      relations: ['template', 'organization', 'framework'],
      order: { createdAt: 'DESC' },
    })
  }

  /**
   * Busca todas las revisiones (auditorías con padre)
   */
  async findAllRevisions(): Promise<AuditEntity[]> {
    return await this.getRepo()
      .createQueryBuilder('audit')
      .where('audit.parentAuditId IS NOT NULL')
      .leftJoinAndSelect('audit.parentAudit', 'parent')
      .leftJoinAndSelect('audit.template', 'template')
      .leftJoinAndSelect('audit.organization', 'organization')
      .leftJoinAndSelect('audit.framework', 'framework')
      .orderBy('audit.createdAt', 'DESC')
      .getMany()
  }

  /**
   * Obtiene el siguiente número de revisión para una auditoría padre
   */
  async getNextRevisionNumber(parentAuditId: string): Promise<number> {
    const latestRevision = await this.getRepo().findOne({
      where: { parentAuditId },
      order: { revisionNumber: 'DESC' },
    })

    if (!latestRevision) {
      // Si no hay revisiones previas, la próxima es la revisión 1
      return 1
    }

    return latestRevision.revisionNumber + 1
  }

  /**
   * Genera el siguiente código único de auditoría
   * Formato: AUD-YYYY-NNN
   */
  async generateNextCode(): Promise<string> {
    const year = new Date().getFullYear()
    const prefix = `AUD-${year}-`

    // Buscar el último código del año actual
    const lastAudit = await this.getRepo()
      .createQueryBuilder('audit')
      .where('audit.code LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('audit.code', 'DESC')
      .getOne()

    if (!lastAudit) {
      return `${prefix}001`
    }

    // Extraer el número secuencial y sumar 1
    const lastNumber = parseInt(lastAudit.code.split('-')[2], 10)
    const nextNumber = lastNumber + 1

    return `${prefix}${nextNumber.toString().padStart(3, '0')}`
  }

  /**
   * Busca auditoría con todas sus relaciones cargadas
   */
  async findByIdWithRelations(id: string): Promise<AuditEntity | null> {
    return await this.getRepo().findOne({
      where: { id },
      relations: [
        'template',
        'organization',
        'framework',
        'parentAudit',
        'childAudits',
        'assignments',
        'assignments.user',
      ],
    })
  }

  /**
   * Crea un query builder para auditorías con relaciones básicas
   * Útil para use cases que necesitan construir queries complejas
   */
  createQueryBuilder(): SelectQueryBuilder<AuditEntity> {
    return this.getRepo()
      .createQueryBuilder('audit')
      .leftJoinAndSelect('audit.template', 'template')
      .leftJoinAndSelect('audit.organization', 'organization')
      .leftJoinAndSelect('audit.framework', 'framework')
      .leftJoinAndSelect('audit.parentAudit', 'parentAudit')
  }
}
