import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
    Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { FirebaseService } from '../../../infra/firebase/firebase.service';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
    private readonly logger = new Logger(FirebaseAuthGuard.name);

    constructor(
        private firebaseService: FirebaseService,
        private prisma: PrismaService,
        private reflector: Reflector,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Check if route is marked as public
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        }

        const request = context.switchToHttp().getRequest<Request>();
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            throw new UnauthorizedException('No token provided');
        }

        try {
            // Verify Firebase ID token
            const decodedToken = await this.firebaseService.verifyIdToken(token);

            // Fetch user from database to get role
            const dbUser = await this.prisma.user.findUnique({
                where: { firebaseUid: decodedToken.uid },
                select: { id: true, role: true },
            });

            // User must exist in database for protected routes
            if (!dbUser) {
                throw new UnauthorizedException('User not found in database. Please register first.');
            }

            // Attach user info to request (including role from database)
            request.user = {
                uid: decodedToken.uid,
                email: decodedToken.email || '',
                emailVerified: decodedToken.email_verified,
                name: decodedToken.name,
                // Include database user info
                dbId: dbUser.id,
                role: dbUser.role,
            };

            return true;
        } catch (error) {
            this.logger.error('Token verification failed', error);
            throw new UnauthorizedException('Invalid or expired token');
        }
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        // Support both Authorization header and cookie
        const authHeader = request.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }

        // Fallback to cookie (if frontend sends token in cookie)
        const cookieToken = request.cookies?.['firebase_token'];
        if (cookieToken) {
            return cookieToken;
        }

        return undefined;
    }
}

