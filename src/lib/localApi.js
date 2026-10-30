// Sends same-origin requests to the local API and reports service errors.
export async function localApi(path, { body, ...options } = {}) {
  const response = await fetch(`/api${path}`, {
    credentials: 'same-origin',
    ...options,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  let result = {};
  try { result = await response.json(); } catch { /* keep the generic error */ }
  if (!response.ok) {
    const error = new Error(result.error || `Local service returned ${response.status}.`);
    error.status = response.status;
    throw error;
  }
  return result;
}