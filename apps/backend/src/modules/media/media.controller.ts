import { Controller, Get, Post, Delete, Param, ParseIntPipe, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { MediaService } from './media.service';

@ApiTags('Media')
@ApiBearerAuth()
@Controller('media')
export class MediaController {
    constructor(private readonly mediaService: MediaService) { }

    @Post('upload/video')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Upload video to Bunny Stream' })
    async uploadVideo(@UploadedFile() file: Express.Multer.File) {
        // TODO: Implement - upload to Bunny Stream
        return { message: 'Upload video - TODO' };
    }

    @Post('upload/document')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Upload document to Cloudflare R2' })
    async uploadDocument(@UploadedFile() file: Express.Multer.File) {
        // TODO: Implement - upload to R2
        return { message: 'Upload document - TODO' };
    }

    @Get(':id/signed-url')
    @ApiOperation({ summary: 'Get signed URL for private content' })
    async getSignedUrl(@Param('id', ParseIntPipe) id: number) {
        // TODO: Implement
        return { message: `Get signed URL for media ${id} - TODO` };
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete media' })
    async remove(@Param('id', ParseIntPipe) id: number) {
        // TODO: Implement
        return { message: `Delete media ${id} - TODO` };
    }
}
