import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Inject,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { UuidParamDto } from '@core/dtos'
import { ResponseMessage } from '@core/http'
import {
  ApiCreate,
  ApiCustom,
} from '@core/swagger/decorators/api-crud.decorator'
import { AssignMemberDto, AuditAssignmentResponseDto } from '../dtos'
import { AssignMemberUseCase } from '../use-cases'
import type { IAuditAssignmentsRepository } from '../../repositories'
import { AUDIT_ASSIGNMENTS_REPOSITORY } from '../../tokens'

@ApiTags('Audits - Asignaciones de Miembros')
@Controller('audits/:auditId/assignments')
export class AuditAssignmentsController {
  constructor(
    private readonly assignMemberUseCase: AssignMemberUseCase,
    @Inject(AUDIT_ASSIGNMENTS_REPOSITORY)
    private readonly assignmentsRepository: IAuditAssignmentsRepository,
  ) {}

  @Post()
  @ApiCreate(AuditAssignmentResponseDto, {
    summary: 'Asignar miembro a auditoría',
    description:
      'Asigna un usuario al equipo de auditoría con un rol específico (LEAD_AUDITOR, AUDITOR, AUDITEE, OBSERVER)',
  })
  @ResponseMessage('Miembro asignado exitosamente')
  async assign(
    @Param('auditId') auditId: string,
    @Body() dto: AssignMemberDto,
  ) {
    return await this.assignMemberUseCase.execute(auditId, dto)
  }

  @Get()
  @ApiCustom(AuditAssignmentResponseDto, {
    summary: 'Listar miembros de auditoría',
    description: 'Obtiene todos los miembros activos asignados a la auditoría',
    notFound: false,
  })
  @ResponseMessage('Miembros obtenidos exitosamente')
  async findAll(@Param('auditId') auditId: string) {
    return await this.assignmentsRepository.findByAudit(auditId)
  }

  @Delete(':assignmentId')
  @ApiCustom(AuditAssignmentResponseDto, {
    summary: 'Remover miembro de auditoría',
    description: 'Desactiva la asignación de un miembro (soft delete)',
  })
  @ResponseMessage('Miembro removido exitosamente')
  async remove(
    @Param('auditId') auditId: string,
    @Param() { id: assignmentId }: UuidParamDto,
  ) {
    await this.assignmentsRepository.deactivate(assignmentId)
    return { message: 'Miembro removido exitosamente' }
  }
}
