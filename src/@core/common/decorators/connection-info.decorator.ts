import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { Request } from 'express'
import type { ConnectionMetadata } from '../interfaces/connection-metadata.interface'

export const ConnectionInfo = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ConnectionMetadata => {
    const req = ctx.switchToHttp().getRequest<Request>()

    // Extraer IP considerando proxies (x-forwarded-for)
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
