import { Inject, Injectable } from '@nestjs/common'
import type { ITemplatesRepository } from '../../audit-library/templates/repositories'
import { NavigationItemDto } from '../dtos'
import { TemplateStatus } from '../../audit-library/templates/constants'
import { SortOrder } from '@core/dtos'
import { TEMPLATES_REPOSITORY } from 'src/modules/audit-library/templates/tokens'

/**
 * Get Dynamic Templates Use Case
 *
 * Retorna las plantillas disponibles como items de navegación dinámica
 * Solo muestra plantillas PUBLISHED (usables)
 */
@Injectable()
export class GetDynamicTemplatesUseCase {
  constructor(
    @Inject(TEMPLATES_REPOSITORY)
    private readonly templatesRepository: ITemplatesRepository,
  ) {}

  /**
   * Ejecuta la obtención de plantillas dinámicas
   *
   * @returns Items de navegación con plantillas reales
   */
  async execute(): Promise<NavigationItemDto[]> {
    // Obtener plantillas publicadas usando paginación
    const { data: templates } =
      await this.templatesRepository.paginateTemplates({
        status: TemplateStatus.PUBLISHED,
        sortBy: 'createdAt',
        sortOrder: SortOrder.ASC,
        page: 1,
        limit: 50,
      })

    // Convertir plantillas a items de navegación
    return templates.map((template) => ({
      id: template.id,
      title: template.name,
      description: `${template.description || ''} (v${template.version})`,
      url: `/admin/controls/?templateId=${template.id}`,
      icon: 'file-text',
      type: 'dynamic' as const,
      badge: template.version,
    }))
  }
}
