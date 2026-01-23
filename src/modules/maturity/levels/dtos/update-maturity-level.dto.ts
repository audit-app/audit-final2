import { PartialType, OmitType } from '@nestjs/swagger'
import { CreateNestedMaturityLevelDto } from './create-nested-maturity-level.dto'

/**
 * DTO para actualizar un nivel de madurez existente
 *
 * Omite 'level' porque no se permite cambiar el número de nivel (es inmutable)
 * Todos los demás campos son opcionales
 */
export class UpdateMaturityLevelDto extends PartialType(
  OmitType(CreateNestedMaturityLevelDto, ['level'] as const),
) {}
