import { Injectable } from '@nestjs/common'
import { Transactional } from '@core/database/transactional.decorator'
import { TemplatesRepository } from '../../../repositories/templates.repository'
import { TemplateAlreadyExistsException } from '../../../exceptions'
import { TemplateStatus } from '../../../constants/template-status.enum'
import type { CreateTemplateDto } from '../../../dtos/create-template.dto'
import type { TemplateEntity } from '../../../entities/template.entity'

/**
 * Create Template Use Case
 *
 * Crea una nueva plantilla de auditoría
 *
 * Reglas de negocio:
 * - La versión se calcula automáticamente basándose en versiones existentes
 * - La combinación nombre + versión debe ser única
 * - El template se crea siempre en estado DRAFT
 * - Para publicar, usar PublishTemplateUseCase
 *
 * Flujo de versiones:
 * - Primera versión: v1.0
 * - Siguientes versiones: v1.1, v1.2, etc.
 */
@Injectable()
export class CreateTemplateUseCase {
  constructor(private readonly templatesRepository: TemplatesRepository) {}

  /**
   * Ejecuta la creación del template
   *
   * @param dto - Datos del template a crear (nombre y descripción)
   * @returns Template creado en estado DRAFT con versión auto-calculada
   * @throws {TemplateAlreadyExistsException}
   */
  @Transactional()
  async execute(dto: CreateTemplateDto): Promise<TemplateEntity> {
    // 1. Calcular la siguiente versión automáticamente
    const version = await this.calculateNextVersion(dto.name)

    // 2. Verificar que no exista un template con ese nombre y versión (por seguridad)
    const existingTemplate =
      await this.templatesRepository.findByNameAndVersion(dto.name, version)

    if (existingTemplate) {
      throw new TemplateAlreadyExistsException(dto.name, version)
    }

    // 3. Crear el template (siempre en DRAFT)
    const template = await this.templatesRepository.save({
      name: dto.name,
      description: dto.description ?? null,
      version,
      status: TemplateStatus.DRAFT,
    })

    return template
  }

  /**
   * Calcula la siguiente versión disponible para un template
   *
   * Lógica:
   * - Si no existe ninguna versión: "v1.0"
   * - Si existe "v1.0": "v1.1"
   * - Si existe "v1.9": "v1.10"
   * - Si existe "2023": "2024"
   * - Extrae números y los incrementa
   *
   * @param name - Nombre del template
   * @returns Siguiente versión disponible
   */
  private async calculateNextVersion(name: string): Promise<string> {
    const latestTemplate =
      await this.templatesRepository.findLatestVersion(name)

    // Si no existe ninguna versión, empezar con v1.0
    if (!latestTemplate) {
      return 'v1.0'
    }

    // Extraer números de la versión actual
    const currentVersion = latestTemplate.version
    const numbers = currentVersion.match(/\d+/g)

    if (!numbers || numbers.length === 0) {
      // Si no tiene números, agregar .1
      return `${currentVersion}.1`
    }

    // Incrementar el último número
    const lastNumber = parseInt(numbers[numbers.length - 1], 10)
    const incrementedNumber = lastNumber + 1

    // Reemplazar el último número en la versión
    const newVersion = currentVersion.replace(
      /\d+(?!.*\d)/,
      incrementedNumber.toString(),
    )

    return newVersion
  }
}
