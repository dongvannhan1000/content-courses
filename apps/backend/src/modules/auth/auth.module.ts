import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from '../../infra/prisma/prisma.module';
import { FirebaseModule } from '../../infra/firebase/firebase.module';

@Module({
  imports: [PrismaModule, FirebaseModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule { }
