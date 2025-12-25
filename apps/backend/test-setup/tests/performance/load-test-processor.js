/**
 * Artillery Load Test Processor
 * 
 * This processor handles dynamic data generation and authentication
 * for load testing scenarios.
 */

const crypto = require('crypto');

/**
 * Generate a unique test user for each virtual user
 */
function generateVirtualUser(userContext, events, done) {
    const uniqueId = crypto.randomBytes(8).toString('hex');

    userContext.vars.testEmail = `loadtest-${uniqueId}@test.com`;
    userContext.vars.testPassword = 'LoadTest123!';
    userContext.vars.testName = `Load Test User ${uniqueId.substring(0, 8)}`;
    userContext.vars.uniqueId = uniqueId;

    return done();
}

/**
 * Generate mock Firebase ID token for testing
 * In real load testing, you would use actual Firebase Admin SDK
 * to generate test tokens, or use a mock authentication endpoint
 */
function generateMockToken(requestParams, context, ee, next) {
    // For load testing purposes, we use a mock token
    // The backend should be configured to accept mock tokens in test mode
    const mockToken = `mock-load-test-token-${context.vars.uniqueId || Date.now()}`;

    if (requestParams.json) {
        requestParams.json.idToken = mockToken;
    }

    return next();
}

/**
 * Extract and store auth token from login response
 */
function extractAuthToken(requestParams, response, context, ee, next) {
    try {
        if (response.body && typeof response.body === 'string') {
            const body = JSON.parse(response.body);
            if (body.access_token) {
                context.vars.authToken = body.access_token;
            } else if (body.token) {
                context.vars.authToken = body.token;
            }
        } else if (response.body && response.body.access_token) {
            context.vars.authToken = response.body.access_token;
        }
    } catch (e) {
        // Token extraction failed, continue anyway
        console.log('Token extraction failed:', e.message);
    }
    return next();
}

/**
 * Log request performance metrics
 */
function logMetrics(requestParams, response, context, ee, next) {
    const status = response.statusCode;
    const url = requestParams.url;

    if (status >= 400) {
        console.log(`[WARN] ${status} on ${url}`);
    }

    return next();
}

/**
 * Generate random course ID for testing
 */
function generateRandomCourseId(userContext, events, done) {
    // Assume we have courses with IDs 1-100 for testing
    userContext.vars.randomCourseId = Math.floor(Math.random() * 100) + 1;
    return done();
}

/**
 * Generate random category slug for testing
 */
function generateRandomCategory(userContext, events, done) {
    const categories = [
        'programming',
        'web-development',
        'mobile-development',
        'data-science',
        'devops',
        'design',
        'business',
        'marketing',
    ];
    userContext.vars.randomCategory = categories[Math.floor(Math.random() * categories.length)];
    return done();
}

/**
 * Simulate think time (user reading/processing time)
 */
function simulateThinkTime(userContext, events, done) {
    const thinkTime = Math.floor(Math.random() * 3000) + 1000; // 1-4 seconds
    setTimeout(() => done(), thinkTime);
}

module.exports = {
    generateVirtualUser,
    generateMockToken,
    extractAuthToken,
    logMetrics,
    generateRandomCourseId,
    generateRandomCategory,
    simulateThinkTime,
};
