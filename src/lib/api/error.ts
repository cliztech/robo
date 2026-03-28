import { NextResponse } from 'next/server'

export type ApiErrorPayload = {
  error_code: string
  message: string
  details?: unknown
}

export function apiError(
  status: number,
  errorCode: string,
  message: string,
  details?: unknown,
): NextResponse<ApiErrorPayload> {
  return NextResponse.json(
    {
      error_code: errorCode,
      message,
      ...(details === undefined ? {} : { details }),
    },
    { status },
  )
}
