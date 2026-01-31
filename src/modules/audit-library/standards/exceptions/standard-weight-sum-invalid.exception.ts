import { BadRequestException } from '@nestjs/common'

export class StandardWeightSumInvalidException extends BadRequestException {
  constructor(templateId: string, actualSum: number) {
    super(
      `La suma de pesos de los standards auditables debe ser exactamente 100. ` +
        `Suma actual: ${actualSum.toFixed(2)}%. ` +
        `Por favor, ajusta los pesos para que sumen exactamente 100.`,
    )
  }
}
