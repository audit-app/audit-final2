import { PartialType } from '@nestjs/swagger'
import { CreateTemplateDto } from '../../../dtos/create-template.dto'

/**
 * DTO para actualizar un template
 * Solo se pueden actualizar templates en estado draft
 */
export class UpdateTemplateDto extends PartialType(CreateTemplateDto) {}
