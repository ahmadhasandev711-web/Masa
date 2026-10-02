import { DomainError } from '../../domain/shared/errors/domain-error';
import { ZodError } from 'zod';

export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };

interface CodedError {
  code: string;
  message: string;
}

function isCodedError(err: unknown): err is CodedError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    'message' in err &&
    typeof (err as Record<string, unknown>).code === 'string' &&
    typeof (err as Record<string, unknown>).message === 'string'
  );
}

export function toActionFailure(error: unknown): ActionResult<never> {
  console.error('[Action Failure Detail]:', error);

  if (error instanceof ZodError) {
    return { success: false, error: error.issues[0]?.message ?? 'تحقق من البيانات المدخلة', code: 'VALIDATION_ERROR' };
  }

  if (error instanceof DomainError || isCodedError(error)) {
    return { success: false, error: error.message, code: error.code };
  }

  if (error instanceof Error) {
    return { success: false, error: error.message, code: 'INTERNAL_ERROR' };
  }

  return {
    success: false,
    error: 'تعذر إتمام العملية. حاول مرة أخرى.',
    code: 'INTERNAL_ERROR',
  };
}
