export async function apiFetch(
  url: string,
  token: string | null,
  options: RequestInit = {}
) {
  const headers: HeadersInit = {
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
    cache: "no-store",
    credentials: "include", // giữ cookie fallback
  });
}
