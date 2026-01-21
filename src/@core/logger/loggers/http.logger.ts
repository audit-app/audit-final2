import { Injectable } from '@nestjs/common'
import { Request, Response } from 'express'
import { BaseLogger } from './base.logger'
import { HttpLogContext, UserContext, LogLevel } from '../types'
import { UserAgentParser, DataSanitizer, IpExtractor } from '../utils'
import { WinstonProvider } from '../providers'

@Injectable()
export class HttpLogger extends BaseLogger {
  constructor(winstonProvider: WinstonProvider) {
    super(winstonProvider.getLogger(), 'http')
  }

  /**
   * Registra un REQUEST entrante con TODOS sus detalles
   */
  logRequest(req: Request, user?: UserContext): void {
    const userAgent = req.headers['user-agent'] || 'Unknown'
    const device = UserAgentParser.parse(userAgent)
    const contentType = req.headers['content-type'] || 'Not specified'

    // Capturar headers importantes (sin datos sensibles)
    const safeHeaders = this.getSafeHeaders(req.headers)

    const context: HttpLogContext = {
      user,
      device,
      request: {
        method: req.method,
        url: req.url,
        ip: IpExtractor.extract(req),
        contentType,
        headers: safeHeaders,
        query: req.query as Record<string, unknown>,
        params: req.params as Record<string, unknown>,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        body: req.body ? DataSanitizer.sanitize(req.body) : undefined,
      },
    }

    this.writeLog(
      LogLevel.HTTP,
      `📥 Incoming Request: ${req.method} ${req.url}`,
      context,
    )
  }

  /**
   * Registra un RESPONSE saliente con el body completo
   */
  logResponse(
    req: Request,
    res: Response,
    responseTime: number,
    user?: UserContext,
    responseBody?: unknown,
  ): void {
    const userAgent = req.headers['user-agent'] || 'Unknown'
    const device = UserAgentParser.parse(userAgent)

    const context: HttpLogContext = {
      user,
      device,
      request: {
        method: req.method,
        url: req.url,
        ip: IpExtractor.extract(req),
      },
      response: {
        statusCode: res.statusCode,
        responseTime,
        // Sanitizar el body de la respuesta también
        body: responseBody
          ? DataSanitizer.sanitize(responseBody as Record<string, unknown>)
          : undefined,
      },
    }

    const level =
      res.statusCode >= 500
        ? LogLevel.ERROR
        : res.statusCode >= 400
          ? LogLevel.WARN
          : LogLevel.HTTP

    const statusEmoji = this.getStatusEmoji(res.statusCode)

    this.writeLog(
      level,
      `${statusEmoji} Outgoing Response: ${req.method} ${req.url} ${res.statusCode} ${responseTime}ms`,
      context,
    )
  }

  /**
   * Obtiene headers seguros (sin tokens, passwords, etc.)
   */
  private getSafeHeaders(
    headers: Record<string, unknown>,
  ): Record<string, unknown> {
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'x-api-key',
      'x-auth-token',
    ]

    const safe: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(headers)) {
      if (sensitiveHeaders.includes(key.toLowerCase())) {
        safe[key] = '[REDACTED]'
      } else {
        safe[key] = value
      }
    }

    return safe
  }

  /**
   * Obtiene emoji según el status code
   */
  private getStatusEmoji(statusCode: number): string {
    if (statusCode >= 200 && statusCode < 300) return '✅'
    if (statusCode >= 300 && statusCode < 400) return '🔄'
    if (statusCode >= 400 && statusCode < 500) return '⚠️'
    if (statusCode >= 500) return '❌'
    return '📤'
  }
}
