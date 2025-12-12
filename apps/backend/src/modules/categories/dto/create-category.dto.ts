import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
    @ApiProperty({ description: 'Category name', example: 'JavaScript' })
    @IsString()
    name!: string;

    @ApiProperty({ description: 'URL-friendly slug', example: 'javascript' })
    @IsString()
    slug!: string;

    @ApiPropertyOptional({ description: 'Category description', example: 'JavaScript programming courses' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ description: 'Icon identifier', example: 'js' })
    @IsString()
    @IsOptional()
    icon?: string;

    @ApiPropertyOptional({ description: 'Parent category ID for subcategories', example: 1 })
    @IsInt()
    @IsOptional()
    parentId?: number;

    @ApiPropertyOptional({ description: 'Display order', example: 1, default: 0 })
    @IsInt()
    @Min(0)
    @IsOptional()
    order?: number;
}


