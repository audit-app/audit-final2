import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  Length,
  Min,
  Max,
} from 'class-validator'
import { Type } from 'class-transformer'
// TODO: Mover IsNotEmptyString cuando se migre import/clone
// import { IsNotEmptyString } from '../../templates/shared/validators'

/**
 * DTO para importar Standard desde Excel
 *
 * Representa un control/cláusula dentro de una plantilla
 * Soporta estructura jerárquica mediante parentCode
 */
export class ImportStandardDto {
  @IsString({ message: 'El código debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El código es requerido' })
  @Length(1, 50, { message: 'El código debe tener entre 1 y 50 caracteres' })
  code: string

  @IsString({ message: 'El título debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El título es requerido' })
  @Length(1, 200, { message: 'El título debe tener entre 1 y 200 caracteres' })
  title: string

  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @IsOptional()
  description?: string

  /**
   * Código del standard padre (para jerarquía)
   * Si es null, undefined o vacío, se considera nivel raíz
   * No se permiten cadenas vacías o solo espacios
   */
  @IsOptional()
  @IsString({ message: 'El código padre debe ser una cadena de texto' })
  // TODO: Descomentar cuando se migre IsNotEmptyString
  // @IsNotEmptyString({
  //   message: 'El código padre no puede ser una cadena vacía',
  // })
  @Length(1, 50, {
    message: 'El código padre debe tener entre 1 y 50 caracteres',
  })
  parentCode?: string

  @IsNumber()
  @Type(() => Number)
  @Min(0, { message: 'El orden debe ser mayor o igual a 0' })
  order: number

  @IsNumber()
  @Type(() => Number)
  @Min(1, { message: 'El nivel debe ser mayor o igual a 1' })
  level: number

  @IsBoolean()
  @Type(() => Boolean)
  isAuditable: boolean

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0, { message: 'El peso debe ser mayor o igual a 0' })
  @Max(100, { message: 'El peso debe ser menor o igual a 100' })
  weight?: number

  @IsOptional()
  @IsString({ message: 'La guía del auditor debe ser una cadena de texto' })
  auditorGuidance?: string
}
