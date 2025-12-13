import { IsString, IsOptional, IsInt, MaxLength, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO for updating media metadata
 * Only title and order can be updated (not the file itself)
 */
export class UpdateMediaDto {
    @ApiPropertyOptional({ example: 'Video bài giảng - Cập nhật' })
    @IsString()
    @IsOptional()
    @MaxLength(255)
    title?: string;

    @ApiPropertyOptional({ example: 0, description: 'Order in media list' })
    @IsInt()
    @IsOptional()
    @Type(() => Number)
    @Min(0)
    order?: number;

    @ApiPropertyOptional({ example: 720, description: 'Duration in seconds (update if needed)' })
    @IsInt()
    @IsOptional()
    @Type(() => Number)
    @Min(0)
    duration?: number;
}
