import { IsInt, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for updating lesson progress (placeholder - for future expansion)
 */
export class UpdateProgressDto {
    @ApiPropertyOptional({ description: 'Total seconds watched', example: 300, minimum: 0 })
    @IsOptional()
    @IsInt()
    @Min(0)
    watchedSeconds?: number;

    @ApiPropertyOptional({ description: 'Last watched position in seconds', example: 150, minimum: 0 })
    @IsOptional()
    @IsInt()
    @Min(0)
    lastPosition?: number;
}
