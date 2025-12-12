import { IsInt, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentDto {
    @ApiProperty()
    @IsInt()
    courseId!: number;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    returnUrl?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    cancelUrl?: string;
}
