export function whatsappUrl(phone: string | null | undefined): string | null {
  if (!phone) return null;

  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7) return null;

  // Números colombianos de 10 dígitos sin indicativo: se asume +57.
  const withCountryCode = digits.length === 10 ? `57${digits}` : digits;

  return `https://wa.me/${withCountryCode}`;
}
