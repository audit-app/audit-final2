import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { Request, Response } from 'express'
import { LoggerService } from '../logger/logger.service'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp()
    const request = ctx.getRequest<Request>()
    const response = ctx.getResponse<Response>()
    const startTime = Date.now()

    // Obtener información del usuario si está autenticado
    const userContext = request.user
      ? {
          userId: request.user.sub,
          userEmail: request.user.email,
          userName: request.user.username,
        }
      : undefined

    // Log del request (ENTRADA)
    this.logger.logHttpRequest(request, userContext)

    return next.handle().pipe(
      tap({
        next: (responseBody: unknown) => {
          const responseTime = Date.now() - startTime

          // Log del response exitoso (SALIDA con body)
          this.logger.logHttpResponse(
            request,
            response,
            responseTime,
            userContext,
            responseBody, // ✅ Ahora capturamos el body de la respuesta
          )
        },
        error: (error: Error) => {
          const responseTime = Date.now() - startTime

          // Log del response con error
          this.logger.logHttpResponse(
            request,
            response,
            responseTime,
            userContext,
            {
              error: error.message,
              name: error.name,
            },
          )

          // Log de la excepción
          this.logger.logException(error, {
            req: request,
            user: userContext,
          })
        },
      }),
    )
  }
}
