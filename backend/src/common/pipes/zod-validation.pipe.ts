import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import type { ZodSchema, ZodError } from 'zod';
import { ZodError as ZodErrorClass } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema<any>) {}

  transform(value: any) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      if (error instanceof ZodErrorClass) {
        const zodError = error as any;
        throw new BadRequestException({
          success: false,
          statusCode: 400,
          message: 'Validation failed',
          errors: zodError.issues ?? zodError.errors ?? [],
        });
      }
      throw new BadRequestException('Validation failed');
    }
  }
}
