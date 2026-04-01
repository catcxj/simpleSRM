import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    constructor() { }

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();

        const httpStatus =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const message = exception instanceof HttpException
            ? exception.getResponse()
            : '服务器内部错误';

        const responseBody = {
            code: httpStatus,
            message: typeof message === 'string' ? message : (message as any).message || message,
            msg: typeof message === 'string' ? message : (message as any).message || message,
            timestamp: new Date().toISOString(),
            path: request.url,
        };

        response.status(httpStatus).json(responseBody);
    }
}
