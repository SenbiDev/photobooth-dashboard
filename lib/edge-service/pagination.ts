import type { ListParams, ListResponse } from "./types";

const PAGE_SIZE = 100;

export async function fetchAllPages<T>(
  list: (params: ListParams) => Promise<ListResponse<T>>,
): Promise<ListResponse<T>> {
  const data: T[] = [];
  let skip = 0;
  let message = "";
  for (;;) {
    const response = await list({ skip, limit: PAGE_SIZE });
    message = response.message;
    data.push(...response.data);
    const complete = response.pagination
      ? data.length >= response.pagination.total_data
      : response.data.length < PAGE_SIZE;
    if (response.data.length === 0 || complete) {
      return { message, data, pagination: null };
    }
    skip += response.data.length;
  }
}
