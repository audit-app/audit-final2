import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator'

/**
 * Custom validator that checks if a string field is not an empty string
 *
 * Difference from @IsNotEmpty():
 * - @IsNotEmpty() checks if value is not null/undefined/empty
 * - @IsNotEmptyString() ALSO rejects strings that are only whitespace
 *
 * Usage:
 * @IsOptional()
 * @IsString()
 * @IsNotEmptyString({ message: 'Field cannot be an empty string' })
 * field?: string
 */
export function IsNotEmptyString(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isNotEmptyString',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          // If value is undefined or null, it's OK (handled by @IsOptional)
          if (value === undefined || value === null) {
            return true
          }

          // If value is a string, check it's not empty or whitespace-only
          if (typeof value === 'string') {
            return value.trim().length > 0
          }

          // If value is not a string, fail validation
          return false
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} no puede ser una cadena vacía`
        },
      },
    })
  }
}
