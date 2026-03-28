/**
 * Personel API'sine giderken password_hash asla gönderilmez (yanlışlıkla şifre güncellemesini önler).
 * Yeni şifre yalnızca kullanıcı bilinçli olarak dolu bıraktıysa eklenir.
 */
export function buildStaffSavePayload(form, id) {
  const { password_hash, password, off_days_text, ...rest } = form || {};
  const clean = id != null && id !== undefined ? { ...rest, id } : { ...rest };
  const pw = typeof password === 'string' ? password.trim() : '';
  if (pw) clean.password = pw;
  delete clean.off_days_text;
  return clean;
}

/** Sunucudan gelen personel kaydından form state üretir (hash alanını düşürür). */
export function staffFormStateFromServer(staff) {
  if (!staff) {
    return { name: '', phone: '', role: '', branch: '', status: '', username: '', password: '', is_active: 1, off_days_text: '' };
  }
  const { password_hash, ...rest } = staff;
  let offDaysText = '';
  if (rest.off_days) {
    try {
      const arr = typeof rest.off_days === 'string' ? JSON.parse(rest.off_days) : rest.off_days;
      if (Array.isArray(arr)) offDaysText = arr.join('\n');
    } catch (e) { /* ignore */ }
  }
  return { ...rest, password: '', is_active: staff.is_active ?? 1, off_days_text: offDaysText };
}
