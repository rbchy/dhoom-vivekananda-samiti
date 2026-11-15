// Turn Supabase errors into a clear message. A missing table means the SQL setup file was not run yet.
export function describeDbError(error) {
  if (!error) return ''
  const text = `${error.code || ''} ${error.message || ''}`
  if (/42P01|PGRST205|does not exist|schema cache/i.test(text)) {
    return 'Database table or column not found. In Supabase → SQL Editor, run the files in the project supabase folder (first donations-and-events-schema.sql, then temple-management-schema.sql), then reload this page.'
  }
  if (/23505|duplicate key/i.test(text)) return 'This entry already exists (duplicate).'
  if (/42501|row-level security|permission denied/i.test(text)) return 'Permission denied. Please log in again as an administrator.'
  return error.message || 'Something went wrong. Please try again.'
}
