import { Global, Module } from '@nestjs/common'
import { MailerModule } from '@nestjs-modules/mailer'
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter'
import { join } from 'path'
import { envs } from '@core/config'
import { EmailService } from './email.service'
import { EmailEventService } from './email-event.service'
import { EmailListener } from './listeners/email.listener'

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: () => {
        return {
          transport: {
            host: envs.email.host,
            port: envs.email.port,
            secure: envs.email.secure,
            auth: {
              user: envs.email.user,
              pass: envs.email.password,
            },
          },
          defaults: {
            from: `"${envs.email.fromName}" <${envs.email.from}>`,
          },
          template: {
            dir: join(__dirname, 'templates'),
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
          // Preview de emails en desarrollo (opcional)
          preview: envs.app.isDevelopment,
        }
      },
    }),
  ],
  providers: [EmailService, EmailEventService, EmailListener],
  exports: [EmailService, EmailEventService],
})
export class EmailModule {}
