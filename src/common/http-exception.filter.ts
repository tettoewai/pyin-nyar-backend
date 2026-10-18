import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from "@nestjs/common";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.getStatus();

    const exResponse = exception.getResponse();
    const message =
      typeof exResponse === "string"
        ? exResponse
        : Array.isArray((exResponse as { message?: string[] }).message)
          ? (exResponse as { message: string[] }).message.join(", ")
          : ((exResponse as { message?: string }).message ??
            exception.message ??
            "An error occurred.");

    response.status(status).json({
      success: false,
      message,
      data: {},
    });
  }
}
