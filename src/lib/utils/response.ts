/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Standard success response format
 */
export const successResponse = (data: any, message = "Success") => ({
  success: true,
  message,
  data,
});

/**
 * Paginated response format
 */
export const paginatedResponse = (
  data: any[],
  meta: {
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
  },
  message = "Data retrieved successfully"
) => ({
  success: true,
  message,
  data,
  meta,
});
