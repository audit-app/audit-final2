import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { AppModule } from './app.module'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { LoggerService } from '@core/logger'
import { envs } from '@core/config'
import cookieParser from 'cookie-parser'
import { join } from 'path'
import { ValidationPipe } from '@nestjs/common'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  const logger = app.get(LoggerService)
  const port = envs.app.port
  app.useLogger(logger)

  // Configurar archivos estáticos para uploads
  const uploadsDir = envs.files.uploadsDir || join(process.cwd(), 'uploads')
  app.useStaticAssets(uploadsDir, {
    prefix: '/uploads/',
    index: false, // Deshabilitar index.html automático
  })
  logger.log(`📁 Archivos estáticos servidos desde: ${uploadsDir}`)
  logger.log(`🌐 URL de acceso: http://localhost:${port}/uploads/`)
  app.setGlobalPrefix('api')

  // Configurar CORS
  // envs.security.corsOrigins ya es un array de strings
  const corsOrigin =
    envs.security.corsOrigins.length === 1 &&
    envs.security.corsOrigins[0] === '*'
      ? '*'
      : envs.security.corsOrigins

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  })
  logger.log(`🔓 CORS habilitado para: ${envs.security.corsOrigins.join(', ')}`)

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  )

  // Middleware para parsear cookies (requerido para refresh tokens)
  app.use(cookieParser())

  // Configurar Swagger
  const config = new DocumentBuilder()
    .setTitle('ATR API')
    .setDescription(
      'API de auditorías, plantillas, frameworks de madurez y gestión de usuarios',
    )
    .addBearerAuth()
    .setVersion('1.0')
    .addTag('Auth', 'Autenticación JWT con refresh tokens')
    .addTag('Two-Factor Authentication', 'Verificación 2Fa')
    .addTag('Sessions', 'Control de Sesiones')
    .addTag('Trusted Devices', 'Trusted Devices')
    .addTag('Password Reset', 'Restablecimiento de Contraseña')
    .addTag('users', 'Gestión de usuarios')
    .addTag('organizations', 'Gestión de organizaciones')
    .addTag('templates', 'Gestión de plantillas (ISO 27001, ISO 9001, etc.)')
    .addTag('standards', 'Gestión de normas con estructura jerárquica')
    .addTag('maturity-levels', 'Niveles de madurez con textos predefinidos')
    .build()
  logger.startup.printStartupBanner(
    {
      appName: 'Audit API',
      version: '1.0.0',
      port,
      nodeEnv: envs.app.nodeEnv,
      apiPrefix: '/api',
    },
    {
      type: 'PostgreSQL',
      host: envs.database.url?.split('@')[1]?.split('/')[0],
      database: envs.database.url?.split('@')[1]?.split('/')[1],
    },
  )
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document)

  await app.listen(port)
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap()
