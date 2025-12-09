import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateRoleDto {
    @ApiProperty({
        description: 'New role for the user',
        enum: Role,
        example: 'INSTRUCTOR',
    })
    @IsNotEmpty()
    @IsEnum(Role)
    role: Role = Role.USER;
}
