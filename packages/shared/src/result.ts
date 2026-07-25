export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}

export function err(error: string): ApiResult<never> {
  return { ok: false, error };
}

export function isOk<T>(result: ApiResult<T>): result is { ok: true; data: T } {
  return result.ok;
}

export function isErr<T>(result: ApiResult<T>): result is { ok: false; error: string } {
  return !result.ok;
}

export function unwrap<T>(result: ApiResult<T>): T {
  if (result.ok) return result.data;
  throw new Error(result.error);
}
