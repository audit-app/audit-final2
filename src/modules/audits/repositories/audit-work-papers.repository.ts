import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BaseRepository } from '@core/repositories'
import { TransactionService } from '@core/database'
import { AuditService } from '@core/context'
import { AuditWorkPaperEntity } from '../entities/audit-work-paper.entity'
import { WorkPaperType } from '../enums/work-paper-type.enum'
import type { IAuditWorkPapersRepository } from './interfaces'

/**
 * Repositorio de Papeles de Trabajo de Auditoría
 */
@Injectable()
export class AuditWorkPapersRepository
  extends BaseRepository<AuditWorkPaperEntity>
  implements IAuditWorkPapersRepository
{
  constructor(
    @InjectRepository(AuditWorkPaperEntity)
    repository: Repository<AuditWorkPaperEntity>,
    transactionService: TransactionService,
    auditService: AuditService,
  ) {
    super(repository, transactionService, auditService)
  }

  /**
   * Busca todos los papeles de trabajo de una respuesta
   */
  async findByResponse(responseId: string): Promise<AuditWorkPaperEntity[]> {
    return await this.getRepo().find({
      where: { responseId },
      order: { uploadedAt: 'DESC' },
    })
  }

  /**
   * Busca papeles de trabajo por tipo
   */
  async findByType(
    responseId: string,
    type: WorkPaperType,
  ): Promise<AuditWorkPaperEntity[]> {
    return await this.getRepo().find({
      where: { responseId, type },
      order: { uploadedAt: 'DESC' },
    })
  }

  /**
   * Busca papeles de trabajo subidos por un usuario
   */
  async findByUploader(userId: string): Promise<AuditWorkPaperEntity[]> {
    return await this.getRepo().find({
      where: { uploadedBy: userId },
      relations: ['response'],
      order: { uploadedAt: 'DESC' },
    })
  }

  /**
   * Cuenta papeles de trabajo de una respuesta
   */
  async countByResponse(responseId: string): Promise<number> {
    return await this.getRepo().count({
      where: { responseId },
    })
  }

  /**
   * Calcula el tamaño total de archivos de una respuesta
   */
  async getTotalFileSize(responseId: string): Promise<number> {
    const workPapers = await this.findByResponse(responseId)
    return workPapers.reduce(
      (total, wp) => total + Number(wp.fileSize),
      0,
    )
  }
}
