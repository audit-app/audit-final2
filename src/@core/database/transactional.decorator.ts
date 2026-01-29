import 'reflect-metadata'

export const TRANSACTIONAL_METADATA_KEY = Symbol('transactional')

export function Transactional(): MethodDecorator {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    Reflect.defineMetadata(
      TRANSACTIONAL_METADATA_KEY,
      true,
      target,
      propertyKey,
    )

    return descriptor
  }
}
