import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CourseQueryDto {
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    category?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    level?: string;

    @ApiPropertyOptional()
    @IsInt()
    @IsOptional()
    @Type(() => Number)
    @Min(0)
    minPrice?: number;

    @ApiPropertyOptional()
    @IsInt()
    @IsOptional()
    @Type(() => Number)
    maxPrice?: number;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    search?: string;

    @ApiPropertyOptional({ default: 1 })
    @IsInt()
    @IsOptional()
    @Type(() => Number)
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ default: 10 })
    @IsInt()
    @IsOptional()
    @Type(() => Number)
    @Min(1)
    @Max(100)
    limit?: number = 10;
}
