import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    // TODO: Implement user service methods
    async findById(id: number) {
        return this.prisma.user.findUnique({ where: { id } });
    }

    async findByFirebaseUid(firebaseUid: string) {
        return this.prisma.user.findUnique({ where: { firebaseUid } });
    }

    async updateProfile(userId: number, data: { name?: string; bio?: string; photoURL?: string }) {
        return this.prisma.user.update({
            where: { id: userId },
            data,
        });
    }
}
