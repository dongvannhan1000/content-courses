import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { MediaType } from '@prisma/client';

@Injectable()
export class MediaService {
    constructor(private prisma: PrismaService) { }

    async findByLesson(lessonId: number) {
        return this.prisma.media.findMany({
            where: { lessonId },
            orderBy: { order: 'asc' },
        });
    }

    async findById(id: number) {
        return this.prisma.media.findUnique({ where: { id } });
    }

    async create(data: {
        type: MediaType;
        url: string;
        lessonId: number;
        title?: string;
        filename?: string;
        mimeType?: string;
        size?: number;
        duration?: number;
    }) {
        return this.prisma.media.create({ data });
    }

    async delete(id: number) {
        // TODO: Also delete from Bunny/R2
        return this.prisma.media.delete({ where: { id } });
    }

    // TODO: Implement Bunny Stream upload
    async uploadToBunnyStream(file: Buffer, filename: string) {
        // Placeholder for Bunny Stream API
        return { videoId: 'bunny-video-id', url: `https://example.bunny.net/${filename}` };
    }

    // TODO: Implement Cloudflare R2 upload
    async uploadToR2(file: Buffer, filename: string) {
        // Placeholder for R2 S3 API
        return { key: filename, url: `https://r2.example.com/${filename}` };
    }
}
