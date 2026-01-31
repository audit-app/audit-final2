import { BadRequestException } from '@nestjs/common'

export class StandardWeightSumExceededException extends BadRequestException {
  constructor(templateId: string, currentSum: number, attemptedWeight: number) {
    const totalSum = currentSum + attemptedWeight
    super(
      `La suma de pesos de los standards auditables excede 100. ` +
        `Suma actual: ${currentSum.toFixed(2)}%, ` +
        `peso intentado: ${attemptedWeight.toFixed(2)}%, ` +
        `total: ${totalSum.toFixed(2)}%. ` +
        `La suma total debe ser exactamente 100.`,
    )
  }
}
