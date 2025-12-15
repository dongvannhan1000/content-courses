import { AuthUser } from '../common/interfaces';

/**
 * Express Request type extension
 * This adds the 'user' property to Express Request
 * The user property is set by FirebaseAuthGuard
 */
declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}

export { };
