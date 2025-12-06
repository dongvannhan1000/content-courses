import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

/**
 * ActiveUserService extracts the user ID from the JWT token in the request.
 * Falls back to demo user ID for backwards compatibility.
 */
@Injectable({ scope: Scope.REQUEST })
export class ActiveUserService {
  constructor(@Inject(REQUEST) private request: Request) {}

  getUserId(): number {
    // Extract user ID from JWT token (set by JwtStrategy)
    const user = (this.request as Request & { user: { userId: number } }).user;
    if (user?.userId) {
      return user.userId;
    }

    // Fallback to demo user for backwards compatibility
    const raw = process.env.DEMO_USER_ID ?? process.env.DEFAULT_USER_ID ?? '1';
    const parsed = Number.parseInt(raw, 10);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new Error(
        'Invalid DEMO_USER_ID/DEFAULT_USER_ID. Expecting a positive integer.',
      );
    }

    return parsed;
  }
}
