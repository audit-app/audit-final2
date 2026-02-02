import { Injectable } from '@nestjs/common'
import * as generator from 'generate-password'

export interface PasswordOptions {
  length: number
  numbers: boolean
  symbols: boolean
  uppercase: boolean
  lowercase: boolean
  strict: boolean
  exclude: string
}

@Injectable()
export class PasswordGeneratorService {
  private readonly defaultOptions: PasswordOptions = {
    length: 12,
    numbers: true,
    symbols: true,
    uppercase: true,
    lowercase: true,
    strict: true,
    exclude: ' <>"\'`',
  }

  generate(length: number = 12, strict: boolean = true): string {
    return this.generateCustom({ length, strict })
  }

  generateAlphanumeric(length: number = 12): string {
    return this.generateCustom({ length, symbols: false })
  }

  generateCustom(options: Partial<PasswordOptions>): string {
    const finalOptions = { ...this.defaultOptions, ...options }

    if (finalOptions.length < 4 && finalOptions.strict) {
      finalOptions.length = 4
    }

    return generator.generate(finalOptions)
  }
}
