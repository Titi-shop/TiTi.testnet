export async function apiFetch(
  url: string,
  options?: RequestInit
) {
  return fetch(url, {
    ...options,
    credentials: "include", // ✅ cookie only
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });
}
