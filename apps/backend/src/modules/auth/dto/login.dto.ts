import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Firebase ID Token from client-side authentication',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjFkYzBmM...',
  })
  @IsString()
  @IsNotEmpty({ message: 'ID token is required' })
  idToken!: string;
}

