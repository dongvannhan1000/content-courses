import { IsString, IsOptional, IsUrl, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for updating user profile
 */
export class UpdateProfileDto {
    @ApiPropertyOptional({ example: 'Nguyen Van A', maxLength: 100 })
    @IsString()
    @IsOptional()
    @MaxLength(100)
    name?: string;

    @ApiPropertyOptional({ example: 'Giảng viên với 10 năm kinh nghiệm...', maxLength: 1000 })
    @IsString()
    @IsOptional()
    @MaxLength(1000)
    bio?: string;

    @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
    @IsUrl()
    @IsOptional()
    photoURL?: string;
}
