import { IsString, IsNumber, IsOptional, IsInt, Min, IsNotEmpty, MaxLength, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export class CreateCourseDto {
    @ApiProperty({ example: 'Khóa học JavaScript từ cơ bản' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    title!: string;

    @ApiProperty({ example: 'khoa-hoc-javascript-tu-co-ban' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    @Transform(({ value }) => value?.toLowerCase().trim())
    slug!: string;

    @ApiProperty({ example: 'Mô tả chi tiết về khóa học...' })
    @IsString()
    @IsNotEmpty()
    description!: string;

    @ApiPropertyOptional({ example: 'Học JS từ A-Z' })
    @IsString()
    @IsOptional()
    @MaxLength(500)
    shortDesc?: string;

    @ApiPropertyOptional({ example: 'https://example.com/thumbnail.jpg' })
    @IsString()
    @IsOptional()
    thumbnail?: string;

    @ApiProperty({ example: 599000 })
    @IsNumber()
    @Type(() => Number)
    @Min(0)
    price!: number;

    @ApiPropertyOptional({ example: 399000 })
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    @Min(0)
    discountPrice?: number;

    @ApiPropertyOptional({ example: 'beginner', enum: ['beginner', 'intermediate', 'advanced'] })
    @IsString()
    @IsOptional()
    @IsEnum(['beginner', 'intermediate', 'advanced'])
    level?: string;

    @ApiPropertyOptional({ example: 1 })
    @IsInt()
    @IsOptional()
    @Type(() => Number)
    categoryId?: number;
}

