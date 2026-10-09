/**
 * Patron JWT ve localStorage oturumunu /get-slug ile kurar (login / kayıt sonrası).
 */
export async function fetchAndStorePatronSession(apiUrl, user) {
  const idToken = await user.getIdToken();
  const res = await fetch(`${apiUrl}/get-slug`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  const data = await res.json().catch(() => ({}));
  if (data.slug && data.token) {
    localStorage.setItem('patron_authToken', data.token);
    localStorage.setItem('patron_userRole', data.role || 'Patron');
    localStorage.setItem('patron_userName', data.name || 'Patron');
    localStorage.setItem('patron_userSlug', data.slug);
    return { ok: true, slug: data.slug };
  }
  return { ok: false };
}
