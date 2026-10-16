export type ServiceErrorCode =
  | 'network'
  | 'timeout'
  | 'server'
  | 'not-found'
  | 'unauthorized'
  | 'forbidden'
  | 'validation'
  | 'conflict'
  | 'aborted';

const RETRYABLE: ServiceErrorCode[] = ['network', 'timeout', 'server'];

/** The only error type services throw. UI copy is chosen from `code`, never from raw messages. */
export class ServiceError extends Error {
  readonly code: ServiceErrorCode;
  readonly fieldErrors?: Record<string, string>;

  constructor(code: ServiceErrorCode, message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
    this.fieldErrors = fieldErrors;
  }

  get retryable(): boolean {
    return RETRYABLE.includes(this.code);
  }
}

export function isServiceError(e: unknown): e is ServiceError {
  return e instanceof ServiceError;
}

/** Human copy for an error, suitable for ErrorState and toasts. */
export function describeError(e: unknown): { title: string; message: string; retryable: boolean } {
  if (!isServiceError(e)) {
    return { title: 'Something went wrong', message: 'Please try again.', retryable: true };
  }
  switch (e.code) {
    case 'network':
      return {
        title: 'You seem to be offline',
        message: 'Check your connection and try again.',
        retryable: true,
      };
    case 'timeout':
      return {
        title: 'This is taking too long',
        message: 'The server didn’t respond in time. Try again.',
        retryable: true,
      };
    case 'server':
      return {
        title: 'Something went wrong on our side',
        message: 'It’s not you. Try again in a moment.',
        retryable: true,
      };
    case 'not-found':
      return {
        title: 'Not found',
        message: 'This may have been removed or is no longer public.',
        retryable: false,
      };
    case 'unauthorized':
      return { title: 'Please sign in', message: e.message, retryable: false };
    case 'forbidden':
      return { title: 'Not allowed', message: e.message, retryable: false };
    default:
      return { title: 'Couldn’t complete that', message: e.message, retryable: false };
  }
}
