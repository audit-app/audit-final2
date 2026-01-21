import { Global, Module } from '@nestjs/common'
import { MailerModule } from '@nestjs-modules/mailer'
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter'
import { join } from 'path'
import { AppConfigService } from '@core/config'
import { EmailService } from './email.service'
import { EmailEventService } from './email-event.service'
import { EmailListener } from './listeners/email.listener'

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => {
        return {
          transport: {
            host: config.email.host,
            port: config.email.port,
            secure: config.email.secure,
            auth: {
              user: config.email.user,
              pass: config.email.password,
            },
          },
          defaults: {
            from: `"${config.email.fromName}" <${config.email.from}>`,
          },
          template: {
            dir: join(__dirname, 'templates'),
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
          // Preview de emails en desarrollo (opcional)
          preview: config.app.isDevelopment,
        }
      },
    }),
  ],
  providers: [EmailService, EmailEventService, EmailListener],
  exports: [EmailService, EmailEventService],
})
export class EmailModule {}
