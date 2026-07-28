export function getErrorMessage(e: unknown, fallback: string): string {
  if (e instanceof Error && e.message) return e.message;
  if (typeof e === 'string' && e) return e;
  // Supabase/PostgREST errors are plain objects (not `Error` instances) with
  // a `message` string -- without this check, every database error fell
  // through to the generic fallback, hiding the real cause from the user.
  if (e && typeof e === 'object' && 'message' in e && typeof (e as { message: unknown }).message === 'string') {
    const message = (e as { message: string }).message;
    if (message) return message;
  }
  return fallback;
}
