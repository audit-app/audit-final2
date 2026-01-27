import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import type { Request } from 'express'

/**
 * Decorator para extraer el access token del header Authorization
 *
 * Este decorator extrae el token JWT del header Authorization
 * después de que JwtAuthGuard lo haya validado.
 *
 * @returns Access token (sin el prefijo "Bearer")
 * @throws UnauthorizedException si no hay token (manejado por el guard)
 *
 * @example
 * ```typescript
 * @Post('logout')
 * @UseGuards(JwtAuthGuard)
 * async logout(@GetToken() token: string) {
 *   // token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *   await this.logoutService.revokeToken(token)
 * }
 * ```
 */
export const GetToken = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>()
    const authHeader = request.headers.authorization

    if (!authHeader) {
      return undefined
    }

    const [type, token] = authHeader.split(' ')
    return type === 'Bearer' ? token : undefined
  },
)
