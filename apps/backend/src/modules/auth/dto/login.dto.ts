import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Firebase ID Token from client-side authentication',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjFkYzBmM...',
  })
  @IsString()
  idToken!: string;
}
