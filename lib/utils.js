export const generateUniqueSlug = (companyName) => {
  const trMap = {
    ç: 'c',
    ğ: 'g',
    ş: 's',
    ü: 'u',
    ı: 'i',
    ö: 'o',
    Ç: 'C',
    Ğ: 'G',
    Ş: 'S',
    Ü: 'U',
    İ: 'I',
    Ö: 'O',
  };

  // İsim temizleme
  const cleaned = companyName
    .replace(/[çğşüıöÇĞŞÜİÖ]/g, (match) => trMap[match])
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');

  // Kısa UUID (4 haneli rastgele karakter)
  const shortId = Math.random().toString(36).substring(2, 6);

  return `${cleaned}-${shortId}`;
};
