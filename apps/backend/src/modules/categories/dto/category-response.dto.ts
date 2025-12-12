import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for category item in tree structure (GET /categories)
 * Used in navigation, sidebar
 */
export class CategoryTreeItemDto {
    @ApiProperty({ example: 1 })
    id!: number;

    @ApiProperty({ example: 'Lập trình' })
    name!: string;

    @ApiProperty({ example: 'lap-trinh' })
    slug!: string;

    @ApiPropertyOptional({ example: 'code' })
    icon?: string;

    @ApiProperty({ example: 15, description: 'Number of published courses' })
    courseCount!: number;

    @ApiPropertyOptional({ type: () => [CategoryTreeItemDto] })
    children?: CategoryTreeItemDto[];
}

/**
 * Minimal category info for parent/children references
 */
export class CategoryRefDto {
    @ApiPropertyOptional({ example: 1 })
    id!: number | null;

    @ApiPropertyOptional({ example: 'Lập trình' })
    name!: string | null;

    @ApiPropertyOptional({ example: 'lap-trinh' })
    slug!: string | null;
}

/**
 * DTO for category detail page (GET /categories/:slug)
 * Includes parent for breadcrumb, children for subcategories
 */
export class CategoryDetailDto {
    @ApiProperty({ example: 1 })
    id!: number;

    @ApiProperty({ example: 'JavaScript' })
    name!: string;

    @ApiProperty({ example: 'javascript' })
    slug!: string;

    @ApiPropertyOptional({ example: 'Các khóa học về JavaScript' })
    description?: string;

    @ApiPropertyOptional({ example: 'js' })
    icon?: string;

    @ApiPropertyOptional({ type: CategoryRefDto })
    parent?: CategoryRefDto;

    @ApiPropertyOptional({ type: [CategoryRefDto] })
    children?: CategoryRefDto[];

    @ApiProperty({ example: 15 })
    courseCount!: number;
}

/**
 * DTO for category creation/update response (POST/PUT)
 * Used in admin dashboard
 */
export class CategoryDto {
    @ApiProperty({ example: 1 })
    id!: number;

    @ApiProperty({ example: 'Machine Learning' })
    name!: string;

    @ApiProperty({ example: 'machine-learning' })
    slug!: string;

    @ApiPropertyOptional({ example: 'Khóa học về ML' })
    description?: string;

    @ApiPropertyOptional({ example: 'brain' })
    icon?: string;

    @ApiPropertyOptional({ example: 1 })
    parentId?: number;

    @ApiProperty({ example: 5 })
    order!: number;

    @ApiProperty({ example: true })
    isActive!: boolean;
}
