import { Global, Module } from '@nestjs/common';
import { ActiveUserService } from './active-user.service';

@Global()
@Module({
  providers: [ActiveUserService],
  exports: [ActiveUserService],
})
export class CommonModule {}
