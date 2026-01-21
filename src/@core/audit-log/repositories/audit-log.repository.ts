import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AuditLogEntity } from '../entities/audit-log.entity'

/**
 * Audit Log Repository
 *
 * Repositorio para consultar el historial de auditoría granular
 * NO extiende BaseRepository porque es read-only (no se crean/actualizan/eliminan logs manualmente)
 */
@Injectable()
export class AuditLogRepository {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly repository: Repository<AuditLogEntity>,
  ) {}

  /**
   * Obtiene el historial completo de una plantilla (template + sus standards)
   *
   * @param rootId - ID del template
   * @param limit - Límite de registros (default: 100)
   * @returns Lista de logs ordenados por fecha descendente (más reciente primero)
   */
  async findByRootId(rootId: string, limit: number = 100): Promise<AuditLogEntity[]> {
    return await this.repository.find({
      where: { rootId },
      order: { createdAt: 'DESC' },
      take: limit,
    })
  }

  /**
   * Obtiene el historial de una entidad específica (un template o standard)
   *
   * @param entityId - ID de la entidad
   * @param limit - Límite de registros (default: 50)
   * @returns Lista de logs ordenados por fecha descendente
   */
  async findByEntityId(
    entityId: string,
    limit: number = 50,
  ): Promise<AuditLogEntity[]> {
    return await this.repository.find({
      where: { entityId },
      order: { createdAt: 'DESC' },
      take: limit,
    })
  }

  /**
   * Obtiene el historial de acciones de un usuario
   *
   * @param userId - ID del usuario
   * @param limit - Límite de registros (default: 100)
   * @returns Lista de logs ordenados por fecha descendente
   */
  async findByUserId(
    userId: string,
    limit: number = 100,
  ): Promise<AuditLogEntity[]> {
    return await this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    })
  }

  /**
   * Obtiene el historial filtrado por template y rango de fechas
   *
   * @param rootId - ID del template
   * @param startDate - Fecha inicial
   * @param endDate - Fecha final
   * @returns Lista de logs en el rango de fechas
   */
  async findByRootIdAndDateRange(
    rootId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AuditLogEntity[]> {
    return await this.repository
      .createQueryBuilder('log')
      .where('log.rootId = :rootId', { rootId })
      .andWhere('log.createdAt >= :startDate', { startDate })
      .andWhere('log.createdAt <= :endDate', { endDate })
      .orderBy('log.createdAt', 'DESC')
      .getMany()
  }

  /**
   * Cuenta cuántos cambios ha tenido una plantilla
   *
   * @param rootId - ID del template
   * @returns Número total de cambios registrados
   */
  async countByRootId(rootId: string): Promise<number> {
    return await this.repository.count({
      where: { rootId },
    })
  }
}
