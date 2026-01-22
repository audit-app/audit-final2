import { Injectable } from '@nestjs/common'
import { AuditLogRepository } from '../repositories/audit-log.repository'
import type { AuditLogEntity } from '../entities/audit-log.entity'
import type { GetAuditHistoryDto } from '../dtos'

/**
 * Get Audit History Use Case
 *
 * Obtiene el historial de cambios de una plantilla completa
 * (incluyendo todos sus standards hijos)
 *
 * Retorna datos listos para mostrar en el frontend sin necesidad
 * de consultas adicionales gracias a la desnormalización.
 */
@Injectable()
export class GetAuditHistoryUseCase {
  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  /**
   * Ejecuta la consulta del historial
   *
   * @param dto - Parámetros de consulta (rootId y limit)
   * @returns Lista de logs ordenados por fecha descendente
   */
  async execute(dto: GetAuditHistoryDto): Promise<AuditLogEntity[]> {
    const { rootId, limit = 100 } = dto

    return await this.auditLogRepository.findByRootId(rootId, limit)
  }
}
