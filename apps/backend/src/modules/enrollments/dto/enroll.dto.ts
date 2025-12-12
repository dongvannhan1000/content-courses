import { IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EnrollDto {
    @ApiProperty()
    @IsInt()
    courseId: number;
}
