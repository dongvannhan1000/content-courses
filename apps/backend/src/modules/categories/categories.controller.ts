import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    ParseIntPipe,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiBearerAuth,
    ApiResponse,
    ApiParam,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryTreeItemDto, CategoryDetailDto, CategoryDto } from './dto/category-response.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    /**
     * GET /api/categories
     * Get all categories in tree structure with course counts
     * 
     * Frontend Usage: Navigation dropdown, sidebar, category listing
     */
    @Get()
    @Public()
    @ApiOperation({ summary: 'Get all categories (tree structure)' })
    @ApiResponse({
        status: 200,
        description: 'List of categories with children and course counts',
        type: [CategoryTreeItemDto],
    })
    async findAll(): Promise<CategoryTreeItemDto[]> {
        return this.categoriesService.findAll();
    }

    /**
     * GET /api/categories/:slug
     * Get category detail with parent (breadcrumb) and children (subcategories)
     * 
     * Frontend Usage: Category detail page
     */
    @Get(':slug')
    @Public()
    @ApiOperation({ summary: 'Get category by slug' })
    @ApiParam({ name: 'slug', description: 'Category URL slug', example: 'javascript' })
    @ApiResponse({
        status: 200,
        description: 'Category detail with parent and children',
        type: CategoryDetailDto,
    })
    @ApiResponse({ status: 404, description: 'Category not found' })
    async findBySlug(@Param('slug') slug: string): Promise<CategoryDetailDto> {
        return this.categoriesService.findBySlug(slug);
    }

    /**
     * POST /api/categories
     * Create a new category (Admin only)
     * 
     * Frontend Usage: Admin dashboard - category management
     */
    @Post()
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create category (Admin only)' })
    @ApiResponse({
        status: 201,
        description: 'Category created successfully',
        type: CategoryDto,
    })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
    @ApiResponse({ status: 409, description: 'Conflict - Slug already exists' })
    async create(@Body() createCategoryDto: CreateCategoryDto): Promise<CategoryDto> {
        return this.categoriesService.create(createCategoryDto);
    }

    /**
     * PUT /api/categories/:id
     * Update an existing category (Admin only)
     * 
     * Frontend Usage: Admin dashboard - category management
     */
    @Put(':id')
    @Roles(Role.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update category (Admin only)' })
    @ApiParam({ name: 'id', description: 'Category ID', example: 1 })
    @ApiResponse({
        status: 200,
        description: 'Category updated successfully',
        type: CategoryDto,
    })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
    @ApiResponse({ status: 404, description: 'Category not found' })
    @ApiResponse({ status: 409, description: 'Conflict - Slug already exists' })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateCategoryDto: UpdateCategoryDto,
    ): Promise<CategoryDto> {
        return this.categoriesService.update(id, updateCategoryDto);
    }

    /**
     * DELETE /api/categories/:id
     * Delete a category (Admin only)
     * 
     * Frontend Usage: Admin dashboard - category management
     * Note: Cannot delete categories with courses or children attached
     */
    @Delete(':id')
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete category (Admin only)' })
    @ApiParam({ name: 'id', description: 'Category ID', example: 1 })
    @ApiResponse({ status: 204, description: 'Category deleted successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
    @ApiResponse({ status: 404, description: 'Category not found' })
    @ApiResponse({ status: 409, description: 'Conflict - Cannot delete category with courses or children' })
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.categoriesService.delete(id);
    }
}
