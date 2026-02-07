import { Global, Module } from '@nestjs/common'
import { CookieService } from './services/cookie.service'
import { ConnectionMetadataService } from './services/connection-metadata.service'

@Global()
@Module({
  providers: [CookieService, ConnectionMetadataService],
  exports: [CookieService, ConnectionMetadataService],
})
export class HttpModule {}
