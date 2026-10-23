import { Module } from '@nestjs/common'
import { VendorsModule } from '../vendors/vendors.module'
import { ProvidersController } from './providers.controller'
import { ProvidersService } from './providers.service'

@Module({
  imports: [VendorsModule],
  controllers: [ProvidersController],
  providers: [ProvidersService],
  exports: [ProvidersService],
})
export class ProvidersModule {}
