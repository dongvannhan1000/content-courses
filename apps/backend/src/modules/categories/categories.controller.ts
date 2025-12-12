import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Get()
    @Public()
    @ApiOperation({ summary: 'Get all categories (tree structure)' })
    async findAll() {
        // TODO: Implement
        return { message: 'Get all categories - TODO' };
    }

    @Get(':slug')
    @Public()
    @ApiOperation({ summary: 'Get category by slug' })
    async findBySlug(@Param('slug') slug: string) {
        // TODO: Implement
        return { message: `Get category ${slug} - TODO` };
    }

    @Post()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create category (Admin only)' })
    async create(@Body() createCategoryDto: CreateCategoryDto) {
        // TODO: Implement with @Roles(Role.ADMIN) guard
        return { message: 'Create category - TODO' };
    }

    @Put(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update category (Admin only)' })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateCategoryDto: UpdateCategoryDto,
    ) {
        // TODO: Implement
        return { message: `Update category ${id} - TODO` };
    }

    @Delete(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete category (Admin only)' })
    async remove(@Param('id', ParseIntPipe) id: number) {
        // TODO: Implement
        return { message: `Delete category ${id} - TODO` };
    }
}
