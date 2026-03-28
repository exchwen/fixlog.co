/**
 * Personel API'sine giderken password_hash asla gönderilmez (yanlışlıkla şifre güncellemesini önler).
 * Yeni şifre yalnızca kullanıcı bilinçli olarak dolu bıraktıysa eklenir.
 */
export function buildStaffSavePayload(form, id) {
  const { password_hash, password, ...rest } = form || {};
  const clean = id != null && id !== undefined ? { ...rest, id } : { ...rest };
  const pw = typeof password === 'string' ? password.trim() : '';
  if (pw) clean.password = pw;
  return clean;
}

/** Sunucudan gelen personel kaydından form state üretir (hash alanını düşürür). */
export function staffFormStateFromServer(staff) {
  if (!staff) {
    return { name: '', phone: '', role: '', branch: '', status: '', username: '', password: '', is_active: 1 };
  }
  const { password_hash, ...rest } = staff;
  return { ...rest, password: '', is_active: staff.is_active ?? 1 };
}
