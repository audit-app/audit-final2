import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { Request } from 'express'
import type { ConnectionMetadata } from '../interfaces/connection-metadata.interface'

/**
 * Decorador para extraer metadata de conexión HTTP de forma estandarizada
 *
 * Extrae información cruda de la Request:
 * - IP (considerando x-forwarded-for para proxies/load balancers)
 * - User-Agent sin procesar
 * - Accept-Language (útil para fingerprinting y localización)
 *
 * Uso:
 * ```typescript
 * @Post('login')
 * async login(
 *   @Body() dto: LoginDto,
 *   @ConnectionInfo() connection: ConnectionMetadata
 * ) {
 *   // connection.ip, connection.rawUserAgent, connection.acceptLanguage
 * }
 * ```
 *
 * Para obtener metadata procesada (con browser, os, device parseados),
 * usa ConnectionMetadataService.parse(connection)
 */
export const ConnectionInfo = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ConnectionMetadata => {
    const req = ctx.switchToHttp().getRequest<Request>()

    // Extraer IP considerando proxies (x-forwarded-for)
    // El primer valor es el cliente original, los siguientes son proxies intermedios
    const forwardedFor = req.headers['x-forwarded-for']
    const ip = forwardedFor
      ? forwardedFor.toString().split(',')[0].trim()
      : req.ip || 'Unknown'

    return {
      ip,
      rawUserAgent: req.headers['user-agent'] || '',
      acceptLanguage: req.headers['accept-language'],
    }
  },
)
