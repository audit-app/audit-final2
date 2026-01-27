import { Injectable, Inject, BadRequestException } from '@nestjs/common'
import { Transactional } from '@core/database'
import { v4 as uuidv4 } from 'uuid'
import { CacheService } from '@core/cache'
import { LoggerService } from '@core/logger'
import { USERS_REPOSITORY } from '../../tokens'
import type { IUsersRepository } from '../../repositories'
import { EmailVerificationService } from '../../services'
import { UserVerifyEmailDto } from './verify-email.dto'

/**
 * Caso de uso: Verificar email de usuario
 *
 * Responsabilidades:
 * - Validar token de verificación
 * - Marcar email como verificado
 * - Generar token temporal de setup (15 minutos) para configurar credenciales
 *
 * Flujo:
 * 1. Usuario recibe email de invitación con link: /verify-email?token=<tokenId>
 * 2. Frontend hace POST /users/verify-email con {token}
 * 3. Validamos token, marcamos email como verificado
 * 4. Generamos setupToken temporal (15 minutos)
 * 5. Retornamos setupToken para que el usuario elija su método de login:
 *    - Establecer contraseña: POST /auth/setup/password
 *    - Continuar con Google: GET /auth/google
 *
 * IMPORTANTE:
 * - El token de verificación se revoca automáticamente al consumirlo (one-time use)
 * - El setupToken expira en 15 minutos
 * - El usuario NO establece contraseña aquí (lo hace después con el setupToken)
 */
@Injectable()
export class VerifyEmailUseCase {
  private readonly SETUP_TOKEN_PREFIX = 'auth:setup-credentials:'
  private readonly SETUP_TOKEN_TTL = 15 * 60 // 15 minutos

  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly cacheService: CacheService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Verifica el email de un usuario y genera token temporal para setup
   *
   * @param dto - Token de verificación
   * @returns setupToken temporal y datos del usuario
   * @throws {BadRequestException} Si el token es inválido, expiró o el email ya fue verificado
   */
  @Transactional()
  async execute(dto: UserVerifyEmailDto): Promise<{
    message: string
    setupToken: string
    userId: string
    email: string
    fullName: string
  }> {
    // 1. Consumir token (busca, valida y revoca automáticamente)
    const tokenData = await this.emailVerificationService.consumeToken(
      dto.token,
    )

    if (!tokenData) {
      throw new BadRequestException(
        'Token de verificación inválido o expirado. Por favor, contacte al administrador para que le reenvíe la invitación.',
      )
    }

    const { userId } = tokenData

    // 2. Buscar usuario
    const user = await this.usersRepository.findById(userId)
    if (!user) {
      throw new BadRequestException('Usuario no encontrado')
    }

    // 3. Verificar si ya está verificado
    if (user.emailVerified) {
      throw new BadRequestException(
        'El email ya fue verificado anteriormente. Puedes iniciar sesión directamente.',
      )
    }

    // 4. Marcar como verificado (SIN establecer password todavía)
    user.emailVerified = true
    user.emailVerifiedAt = new Date()
    await this.usersRepository.save(user)

    // 5. Generar token temporal para "setup de credenciales"
    const setupToken = uuidv4()
    const setupKey = `${this.SETUP_TOKEN_PREFIX}${setupToken}`
    await this.cacheService.setJSON(
      setupKey,
      { userId: user.id, email: user.email },
      this.SETUP_TOKEN_TTL,
    )

    this.logger.log(
      `Email verificado para ${user.email} (userId: ${user.id}). setupToken generado: ${setupToken}`,
      'VerifyEmailUseCase',
    )

    // 6. Retornar token temporal
    return {
      message:
        'Email verificado exitosamente. Ahora puedes configurar tu método de inicio de sesión.',
      setupToken,
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
    }
  }
}
