import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
    private readonly logger = new Logger(FirebaseService.name);
    private app!: admin.app.App;

    onModuleInit() {
        this.initializeFirebase();
    }

    private initializeFirebase() {
        try {
            // Check if Firebase app is already initialized
            if (admin.apps.length > 0) {
                this.app = admin.apps[0]!; // Non-null assertion: we checked length > 0
                this.logger.log('Firebase Admin SDK already initialized');
                return;
            }

            // Option 1: Use service account file (if provided)
            const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

            if (serviceAccountPath) {
                const serviceAccount = require(`../../${serviceAccountPath}`);
                this.app = admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                });
                this.logger.log(
                    'Firebase Admin SDK initialized from service account file',
                );
                return;
            }

            // Option 2a: Use Base64-encoded JSON (BEST for deployment)
            // Avoids issues with \n characters in private_key
            const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

            if (serviceAccountBase64) {
                try {
                    const serviceAccountBuffer = Buffer.from(serviceAccountBase64, 'base64');
                    const serviceAccount = JSON.parse(serviceAccountBuffer.toString('utf8'));
                    this.app = admin.initializeApp({
                        credential: admin.credential.cert(serviceAccount),
                    });
                    this.logger.log(
                        'Firebase Admin SDK initialized from FIREBASE_SERVICE_ACCOUNT_BASE64',
                    );
                    return;
                } catch (parseError) {
                    this.logger.error('Failed to decode/parse FIREBASE_SERVICE_ACCOUNT_BASE64', parseError);
                    throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_BASE64 format');
                }
            }

            // Option 2b: Use full JSON service account as string
            const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

            if (serviceAccountJson) {
                try {
                    const serviceAccount = JSON.parse(serviceAccountJson);
                    this.app = admin.initializeApp({
                        credential: admin.credential.cert(serviceAccount),
                    });
                    this.logger.log(
                        'Firebase Admin SDK initialized from FIREBASE_SERVICE_ACCOUNT JSON',
                    );
                    return;
                } catch (parseError) {
                    this.logger.error('Failed to parse FIREBASE_SERVICE_ACCOUNT JSON', parseError);
                    throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT JSON format');
                }
            }

            // Option 3: Use individual environment variables
            const projectId = process.env.FIREBASE_PROJECT_ID;
            const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(
                /\\n/g,
                '\n',
            );
            const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

            if (!projectId || !privateKey || !clientEmail) {
                throw new Error(
                    'Firebase credentials not found. Please set one of:\n' +
                    '  1. FIREBASE_SERVICE_ACCOUNT_BASE64 (Base64-encoded JSON - RECOMMENDED)\n' +
                    '  2. FIREBASE_SERVICE_ACCOUNT (full JSON string)\n' +
                    '  3. FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL\n' +
                    '  4. FIREBASE_SERVICE_ACCOUNT_PATH (path to JSON file)',
                );
            }

            this.app = admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    privateKey,
                    clientEmail,
                }),
            });

            this.logger.log('Firebase Admin SDK initialized from individual environment variables');
        } catch (error) {
            this.logger.error('Failed to initialize Firebase Admin SDK', error);
            throw error;
        }
    }

    /**
     * Verify a Firebase ID token
     */
    async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
        try {
            return await admin.auth().verifyIdToken(idToken);
        } catch (error) {
            this.logger.error('Failed to verify ID token', error);
            throw error;
        }
    }

    /**
     * Get Firebase Auth instance
     */
    getAuth(): admin.auth.Auth {
        return admin.auth();
    }

    /**
     * Create a new Firebase user
     */
    async createUser(params: {
        email: string;
        password: string;
        displayName?: string;
    }): Promise<admin.auth.UserRecord> {
        try {
            return await admin.auth().createUser({
                email: params.email,
                password: params.password,
                displayName: params.displayName,
                emailVerified: false,
            });
        } catch (error) {
            this.logger.error('Failed to create Firebase user', error);
            throw error;
        }
    }

    /**
     * Get user by UID
     */
    async getUserByUid(uid: string): Promise<admin.auth.UserRecord> {
        try {
            return await admin.auth().getUser(uid);
        } catch (error) {
            this.logger.error(`Failed to get user by UID: ${uid}`, error);
            throw error;
        }
    }

    /**
     * Delete a Firebase user
     */
    async deleteUser(uid: string): Promise<void> {
        try {
            await admin.auth().deleteUser(uid);
            this.logger.log(`Deleted Firebase user: ${uid}`);
        } catch (error) {
            this.logger.error(`Failed to delete user: ${uid}`, error);
            throw error;
        }
    }

    /**
     * Send password reset email
     */
    async generatePasswordResetLink(email: string): Promise<string> {
        try {
            const link = await admin.auth().generatePasswordResetLink(email);
            this.logger.log(`Generated password reset link for: ${email}`);
            return link;
        } catch (error) {
            this.logger.error(`Failed to generate reset link for: ${email}`, error);
            throw error;
        }
    }

    /**
     * Update user password
     */
    async updateUserPassword(uid: string, newPassword: string): Promise<void> {
        try {
            await admin.auth().updateUser(uid, {
                password: newPassword,
            });
            this.logger.log(`Updated password for user: ${uid}`);
        } catch (error) {
            this.logger.error(`Failed to update password for: ${uid}`, error);
            throw error;
        }
    }
}
