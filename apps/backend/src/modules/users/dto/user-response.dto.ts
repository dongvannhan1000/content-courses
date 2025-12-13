import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

/**
 * Full profile for authenticated user (/users/me)
 */
export class UserProfileDto {
    @ApiProperty({ example: 1 })
    id!: number;

    @ApiProperty({ example: 'user@example.com' })
    email!: string;

    @ApiPropertyOptional({ example: 'Nguyen Van A' })
    name?: string;

    @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
    photoURL?: string;

    @ApiPropertyOptional({ example: 'Giảng viên với 10 năm kinh nghiệm...' })
    bio?: string;

    @ApiProperty({ enum: Role, example: 'USER' })
    role!: Role;

    @ApiProperty({ example: true })
    emailVerified!: boolean;

    @ApiProperty()
    createdAt!: Date;

    @ApiProperty()
    updatedAt!: Date;
}

/**
 * Public profile for viewing other users (/users/:id)
 * Excludes sensitive info like email, emailVerified
 */
export class PublicUserDto {
    @ApiProperty({ example: 1 })
    id!: number;

    @ApiPropertyOptional({ example: 'Nguyen Van A' })
    name?: string;

    @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
    photoURL?: string;

    @ApiPropertyOptional({ example: 'Giảng viên với 10 năm kinh nghiệm...' })
    bio?: string;

    @ApiProperty({ enum: Role, example: 'INSTRUCTOR' })
    role!: Role;
}

/**
 * User item in admin list (/users)
 */
export class UserListItemDto {
    @ApiProperty({ example: 1 })
    id!: number;

    @ApiProperty({ example: 'user@example.com' })
    email!: string;

    @ApiPropertyOptional({ example: 'Nguyen Van A' })
    name?: string;

    @ApiProperty({ enum: Role, example: 'USER' })
    role!: Role;

    @ApiProperty({ example: true })
    emailVerified!: boolean;

    @ApiProperty()
    createdAt!: Date;
}

/**
 * Paginated users list response
 */
export class PaginatedUsersDto {
    @ApiProperty({ type: [UserListItemDto] })
    users!: UserListItemDto[];

    @ApiProperty({ example: 100 })
    total!: number;

    @ApiProperty({ example: 1 })
    page!: number;

    @ApiProperty({ example: 20 })
    limit!: number;

    @ApiProperty({ example: 5 })
    totalPages!: number;
}
