import { OmitType, PartialType } from '@nestjs/swagger'
import { CreateStandardDto } from './create-standard.dto'

/**
 * DTO para actualizar un standard
 *
 * Solo permite actualizar campos de texto:
 * - code (validando unicidad)
 * - title
 * - description
 *
 * Campos NO editables (se omiten):
 * - templateId: fijo al crear
 * - parentId: fijo al crear (no se puede mover en jerarquía)
 * - order: se cambia con endpoint específico /reorder
 * - isAuditable: se cambia con endpoint específico /toggle-auditable
 * - level: calculado automáticamente según parentId
 *
 * Todos los campos son opcionales (partial)
 */
export class UpdateStandardDto extends PartialType(
  OmitType(CreateStandardDto, ['templateId', 'parentId'] as const),
) {}
