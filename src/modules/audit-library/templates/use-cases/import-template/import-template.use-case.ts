import { Inject, Injectable } from '@nestjs/common'
import { Transactional } from '@core/database/transactional.decorator'
import type { TemplateEntity } from '../../entities'
import type { ITemplatesRepository } from '../../repositories'
import { TEMPLATES_REPOSITORY } from '@core'
import { CreateTemplateDto } from '../../dtos'
import { TemplateValidator } from '../../validators'
import { TemplateFactory } from '../../factories'
import { TemplateImportService } from '../../services'

@Injectable()
export class ImportTemplateUseCase {
  constructor(
    @Inject(TEMPLATES_REPOSITORY)
    private readonly templateRespository: ITemplatesRepository,
    private readonly templateValidator: TemplateValidator,
    private readonly templateFactory: TemplateFactory,
    private readonly templateImportService: TemplateImportService,
  ) {}

  /**
   * Ejecuta la importación del template
   *
   * @param fileBuffer - Buffer del archivo Excel
   * @param metadata - Metadatos del template (name, version, description)
   * @returns Template creado con todos sus standards
   * @throws {BadRequestException} Si hay errores de validación
   */
  @Transactional()
  async execute(
    fileBuffer: Buffer,
    dto: CreateTemplateDto,
  ): Promise<TemplateEntity> {
    await this.templateValidator.validateUniqueConstraint(dto.code, dto.version)

    // 1. Crear template sin guardarlo aún
    const template = this.templateFactory.createFromDto(dto)

    // 2. Importar standards desde Excel
    const rootStandards =
      await this.templateImportService.importTemplate(fileBuffer)

    // 3. Guardar template primero para obtener el ID
    const savedTemplate = await this.templateRespository.save(template)

    // B. Vincular el Template ID al árbol de Standards
    // Usamos el helper público de tu servicio
    this.templateImportService.assignTemplateToTree(
      rootStandards,
      savedTemplate,
    )
    savedTemplate.standards = rootStandards
    return await this.templateRespository.save(savedTemplate)
  }
}
