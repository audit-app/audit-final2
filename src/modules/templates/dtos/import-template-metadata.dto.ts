import { OmitType } from '@nestjs/swagger'
import { CreateTemplateDto } from './create-template.dto'

/**
 * DTO para metadatos de importación de template
 * Usa los mismos campos que CreateTemplateDto
 */
export class ImportTemplateMetadataDto extends CreateTemplateDto {}
