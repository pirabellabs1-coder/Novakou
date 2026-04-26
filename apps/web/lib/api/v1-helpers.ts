/**
 * Shared helpers for the public Novakou API (`/api/v1/*`).
 *
 * - apiError: standard error envelope `{ error: { code, message, status } }`.
 * - apiSuccess: standard success envelope `{ data, pagination? }`.
 * - parsePagination: extracts page/limit from URL search params with safe bounds.
 * - parseDateRange: extracts ISO 8601 from/to from URL search params.
 */
import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "INVALID_API_KEY"
  | "MISSING_SCOPE"
  | "INVALID_PARAMS"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "SERVER_ERROR";

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number,
  extra?: Record<string, unknown>,
) {
  return NextResponse.json(
    { error: { code, message, status, ...extra } },
    { status },
  );
}

export function apiSuccess<T>(
  data: T,
  pagination?: { page: number; limit: number; total: number },
  status = 200,
) {
  return NextResponse.json(pagination ? { data, pagination } : { data }, {
    status,
  });
}

export interface PaginationOpts {
  page: number;
  limit: number;
  skip: number;
}

export function parsePagination(
  url: URL,
  opts: { defaultLimit?: number; maxLimit?: number } = {},
): PaginationOpts {
  const defaultLimit = opts.defaultLimit ?? 20;
  const maxLimit = opts.maxLimit ?? 100;

  const rawPage = parseInt(url.searchParams.get("page") ?? "1", 10);
  const rawLimit = parseInt(
    url.searchParams.get("limit") ?? String(defaultLimit),
    10,
  );

  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(rawLimit, maxLimit)
      : defaultLimit;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function parseDateRange(url: URL): { from?: Date; to?: Date } {
  const fromStr = url.searchParams.get("from");
  const toStr = url.searchParams.get("to");
  const result: { from?: Date; to?: Date } = {};
  if (fromStr) {
    const d = new Date(fromStr);
    if (!Number.isNaN(d.getTime())) result.from = d;
  }
  if (toStr) {
    const d = new Date(toStr);
    if (!Number.isNaN(d.getTime())) result.to = d;
  }
  return result;
}
