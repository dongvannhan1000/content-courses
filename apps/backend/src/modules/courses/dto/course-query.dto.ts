import { IsString, IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum SortBy {
    NEWEST = 'newest',
    PRICE = 'price',
    RATING = 'rating',
    POPULAR = 'popular',
}

export enum SortOrder {
    ASC = 'asc',
    DESC = 'desc',
}

export class CourseQueryDto {
    @ApiPropertyOptional({ description: 'Filter by category slug' })
    @IsString()
    @IsOptional()
    category?: string;

    @ApiPropertyOptional({ enum: ['beginner', 'intermediate', 'advanced'] })
    @IsString()
    @IsOptional()
    @IsEnum(['beginner', 'intermediate', 'advanced'])
    level?: string;

    @ApiPropertyOptional({ example: 0 })
    @IsInt()
    @IsOptional()
    @Type(() => Number)
    @Min(0)
    minPrice?: number;

    @ApiPropertyOptional({ example: 1000000 })
    @IsInt()
    @IsOptional()
    @Type(() => Number)
    maxPrice?: number;

    @ApiPropertyOptional({ description: 'Search by title or description' })
    @IsString()
    @IsOptional()
    search?: string;

    @ApiPropertyOptional({ description: 'Filter by instructor ID' })
    @IsInt()
    @IsOptional()
    @Type(() => Number)
    instructorId?: number;

    @ApiPropertyOptional({ enum: SortBy, default: SortBy.NEWEST })
    @IsEnum(SortBy)
    @IsOptional()
    sortBy?: SortBy = SortBy.NEWEST;

    @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.DESC })
    @IsEnum(SortOrder)
    @IsOptional()
    sortOrder?: SortOrder = SortOrder.DESC;

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

