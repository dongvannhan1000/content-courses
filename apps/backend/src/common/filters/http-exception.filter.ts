import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ENV } from '../../config/environment.config';

/**
 * Global HTTP Exception Filter
 * 
 * Handles all exceptions and formats response based on environment:
 * - Development: Full error details, stack trace
 * - Production: Minimal error message, no stack trace
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        // Determine status code
        const status = exception instanceof HttpException
            ? exception.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;

        // Get error message
        let message: string;
        let errorResponse: any = null;

        if (exception instanceof HttpException) {
            const res = exception.getResponse();
            if (typeof res === 'string') {
                message = res;
            } else if (typeof res === 'object') {
                errorResponse = res;
                message = (res as any).message || exception.message;
            } else {
                message = exception.message;
            }
        } else if (exception instanceof Error) {
            message = exception.message;
        } else {
            message = 'Internal server error';
        }

        // Log the error
        const errorLog = {
            statusCode: status,
            path: request.url,
            method: request.method,
            message,
            timestamp: new Date().toISOString(),
            ...(exception instanceof Error && { stack: exception.stack }),
        };

        if (status >= 500) {
            this.logger.error(`[${request.method}] ${request.url}`, JSON.stringify(errorLog));
        } else {
            this.logger.warn(`[${request.method}] ${request.url} - ${status}: ${message}`);
        }

        // Build response based on environment
        if (ENV.features.exposeErrorDetails) {
            // Development: Full error details
            response.status(status).json({
                statusCode: status,
                message: Array.isArray(message) ? message : [message],
                error: HttpStatus[status] || 'Error',
                path: request.url,
                method: request.method,
                timestamp: new Date().toISOString(),
                ...(exception instanceof Error && { stack: exception.stack }),
                ...(errorResponse && typeof errorResponse === 'object' && { details: errorResponse }),
            });
        } else {
            // Production: Minimal response
            const productionMessages: Record<number, string> = {
                400: 'Yêu cầu không hợp lệ',
                401: 'Vui lòng đăng nhập',
                403: 'Bạn không có quyền truy cập',
                404: 'Không tìm thấy tài nguyên',
                409: 'Dữ liệu bị xung đột',
                429: 'Quá nhiều yêu cầu, vui lòng thử lại sau',
                500: 'Đã có lỗi xảy ra, vui lòng thử lại sau',
            };

            response.status(status).json({
                statusCode: status,
                message: status < 500 ? message : (productionMessages[status] || productionMessages[500]),
                timestamp: new Date().toISOString(),
            });
        }
    }
}
