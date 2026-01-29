import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import type { Request } from 'express'

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
