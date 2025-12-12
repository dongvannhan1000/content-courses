import { IsString, IsNumber, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCourseDto {
    @ApiProperty()
    @IsString()
    title: string;

    @ApiProperty()
    @IsString()
    slug: string;

    @ApiProperty()
    @IsString()
    description: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    shortDesc?: string;

    @ApiProperty()
    @IsNumber()
    @Type(() => Number)
    @Min(0)
    price: number;

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    discountPrice?: number;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    level?: string;

    @ApiPropertyOptional()
    @IsInt()
    @IsOptional()
    categoryId?: number;
}
