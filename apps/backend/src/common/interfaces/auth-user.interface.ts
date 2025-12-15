import { Role } from '@prisma/client';

/**
 * AuthUser interface representing the authenticated user
 * This is attached to the request object by FirebaseAuthGuard
 */
export interface AuthUser {
    /**
     * Firebase UID
     */
    uid: string;

    /**
     * User email
     */
    email: string;

    /**
     * User's database ID
     */
    dbId: number;

    /**
     * User's role in the system
     */
    role: Role;

    /**
     * User's display name (optional)
     */
    name?: string;

    /**
     * Whether email is verified in Firebase
     */
    emailVerified?: boolean;
}
