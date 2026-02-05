import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Inject,
} from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { UuidParamDto } from '@core/dtos'
import { ResponseMessage } from '@core/http'
import {
  ApiCreate,
  ApiList,
  ApiFindOne,
  ApiUpdate,
  ApiCustom,
} from '@core/swagger/decorators/api-crud.decorator'
import {
  CreateAuditDto,
  UpdateAuditDto,
  CreateRevisionDto,
  FindAuditsDto,
  AuditResponseDto,
} from '../dtos'
import {
  CreateAuditUseCase,
  StartAuditUseCase,
  CloseAuditUseCase,
  CreateRevisionUseCase,
  FindAuditsUseCase,
  GetAuditStatsUseCase,
} from '../use-cases'
import type { IAuditsRepository } from '../repositories'
import { AUDITS_REPOSITORY } from '../tokens'
import { AUDIT_SEARCH_FIELDS, AUDIT_SORTABLE_FIELDS } from '../constants'

@ApiTags('Audits - Auditorías')
@Controller('audits')
export class AuditsController {
  constructor(
    private readonly createAuditUseCase: CreateAuditUseCase,
    private readonly startAuditUseCase: StartAuditUseCase,
    private readonly closeAuditUseCase: CloseAuditUseCase,
    private readonly createRevisionUseCase: CreateRevisionUseCase,
    private readonly findAuditsUseCase: FindAuditsUseCase,
    private readonly getAuditStatsUseCase: GetAuditStatsUseCase,
    @Inject(AUDITS_REPOSITORY)
    private readonly auditsRepository: IAuditsRepository,
  ) {}

  @Post()
  @ApiCreate(AuditResponseDto, {
    summary: 'Crear auditoría',
    description:
      'Crea una nueva auditoría seleccionando template, organización y framework',
  })
  @ResponseMessage('Auditoría creada exitosamente')
  async create(@Body() dto: CreateAuditDto) {
    return await this.createAuditUseCase.execute(dto)
  }

  @Get()
  @ApiList(AuditResponseDto, {
    summary: 'Listar auditorías',
    searchFields: AUDIT_SEARCH_FIELDS,
    sortableFields: AUDIT_SORTABLE_FIELDS,
    filterFields: [
      {
        name: 'status',
        description: 'Filtrar por estado',
        type: 'enum: DRAFT, IN_PROGRESS, CLOSED, ARCHIVED',
      },
      {
        name: 'organizationId',
        description: 'Filtrar por organización',
        type: 'uuid',
      },
      {
        name: 'templateId',
        description: 'Filtrar por template',
        type: 'uuid',
      },
      {
        name: 'revisionType',
        description: 'Filtrar por tipo: initial | revision',
        type: 'string',
      },
    ],
  })
  async findAll(@Query() dto: FindAuditsDto) {
    return await this.findAuditsUseCase.execute(dto)
  }

  @Get(':id')
  @ApiFindOne(AuditResponseDto, {
    summary: 'Obtener auditoría por ID',
  })
  async findOne(@Param() { id }: UuidParamDto) {
    return await this.auditsRepository.findByIdWithRelations(id)
  }

  @Patch(':id')
  @ApiUpdate(AuditResponseDto, {
    summary: 'Actualizar auditoría',
    description: 'Solo se pueden actualizar auditorías en estado DRAFT',
  })
  @ResponseMessage('Auditoría actualizada exitosamente')
  async update(@Param() { id }: UuidParamDto, @Body() dto: UpdateAuditDto) {
    const audit = await this.auditsRepository.findById(id)
    if (!audit) {
      throw new Error('Auditoría no encontrada')
    }

    if (dto.name) audit.name = dto.name
    if (dto.description !== undefined) audit.description = dto.description
    if (dto.frameworkId !== undefined) audit.frameworkId = dto.frameworkId
    if (dto.startDate) audit.startDate = new Date(dto.startDate)
    if (dto.endDate) audit.endDate = new Date(dto.endDate)

    return await this.auditsRepository.save(audit)
  }

  @Delete(':id')
  @ApiCustom(AuditResponseDto, {
    summary: 'Eliminar auditoría (soft delete)',
    description: 'Solo se pueden eliminar auditorías en estado DRAFT',
  })
  @ResponseMessage('Auditoría eliminada exitosamente')
  async remove(@Param() { id }: UuidParamDto) {
    return await this.auditsRepository.softDelete(id)
  }

  @Post(':id/start')
  @ApiCustom(AuditResponseDto, {
    summary: 'Iniciar auditoría',
    description:
      'Cambia el estado de DRAFT a IN_PROGRESS. Requiere al menos un miembro asignado.',
  })
  @ResponseMessage('Auditoría iniciada exitosamente')
  async start(@Param() { id }: UuidParamDto) {
    return await this.startAuditUseCase.execute(id)
  }

  @Post(':id/close')
  @ApiCustom(AuditResponseDto, {
    summary: 'Cerrar auditoría',
    description:
      'Cambia el estado de IN_PROGRESS a CLOSED. Permite crear auditorías de revisión.',
  })
  @ResponseMessage('Auditoría cerrada exitosamente')
  async close(@Param() { id }: UuidParamDto) {
    return await this.closeAuditUseCase.execute(id)
  }

  @Get(':id/stats')
  @ApiOperation({
    summary: 'Obtener estadísticas y scores de auditoría',
    description:
      'Calcula y retorna score ponderado total, nivel de madurez promedio y estadísticas de progreso de evaluaciones',
  })
  @ResponseMessage('Estadísticas obtenidas exitosamente')
  async getStats(@Param() { id }: UuidParamDto) {
    return await this.getAuditStatsUseCase.execute(id)
  }

  @Post(':id/revisions')
  @ApiCreate(AuditResponseDto, {
    summary: 'Crear auditoría de revisión',
    description:
      'Crea una auditoría de seguimiento basada en una auditoría CLOSED anterior. Hereda template, organización y framework.',
  })
  @ResponseMessage('Auditoría de revisión creada exitosamente')
  async createRevision(
    @Param() { id }: UuidParamDto,
    @Body() dto: CreateRevisionDto,
  ) {
    return await this.createRevisionUseCase.execute(id, dto)
  }

  @Get(':id/revisions')
  @ApiOperation({ summary: 'Listar revisiones de una auditoría' })
  @ResponseMessage('Revisiones obtenidas exitosamente')
  async getRevisions(@Param() { id }: UuidParamDto) {
    return await this.auditsRepository.findRevisions(id)
  }
}
