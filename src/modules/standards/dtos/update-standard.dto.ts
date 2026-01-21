import { OmitType, PartialType } from '@nestjs/swagger'
import { CreateStandardDto } from './create-standard.dto'

/**
 * DTO para actualizar un standard
 * - Omite templateId (no se puede cambiar el template de un standard)
 * - Todos los campos son opcionales (partial)
 */
export class UpdateStandardDto extends PartialType(
  OmitType(CreateStandardDto, ['templateId'] as const),
) {}
