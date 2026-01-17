import { SetMetadata } from '@nestjs/common'

/**
 * Clave para almacenar el mensaje de respuesta en metadata
 */
export const RESPONSE_MESSAGE_KEY = 'response_message'

/**
 * Decorador para personalizar el mensaje de respuesta exitosa
 *
 * Uso:
 * ```typescript
 * @ResponseMessage('Usuario creado exitosamente')
 * @Post()
 * async create() {
 *   return { id: '123' }
 * }
 * ```
 *
 * La respuesta será:
 * ```json
 * {
 *   "success": true,
 *   "statusCode": 201,
 *   "message": "Usuario creado exitosamente",
 *   "data": { "id": "123" },
 *   "timestamp": "2024-01-01T00:00:00.000Z"
 * }
 * ```
 *
 * Si NO usas el decorador, el mensaje será automático según el método HTTP:
 * - POST → "Registro creado correctamente"
 * - PATCH/PUT → "Actualización exitosa"
 * - DELETE → "Eliminación exitosa"
 * - GET → "Operación exitosa"
 */
export const ResponseMessage = (message: string) =>
  SetMetadata(RESPONSE_MESSAGE_KEY, message)
