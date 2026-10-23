import { Controller, Get, NotFoundException, Param, Redirect } from '@nestjs/common'
import { StorageService } from '../../common/storage/storage.service'
import { Tenant } from '../auth/tenant.decorator'

@Controller('media')
export class MediaController {
  constructor(private readonly storage: StorageService) {}

  @Get(':owner/:file')
  @Redirect()
  async open(@Tenant() tenant: string, @Param('owner') owner: string, @Param('file') file: string) {
    if (owner !== tenant) throw new NotFoundException('找不到素材')
    return { url: await this.storage.sign(`${owner}/${file}`) }
  }
}
