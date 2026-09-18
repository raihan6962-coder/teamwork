import type { Country } from "../types.js";

export const countries: Country[] = [
  { name: "United States", code: "US", flag: "🇺🇸", timezone: "America/New_York" },
  { name: "United Kingdom", code: "GB", flag: "🇬🇧", timezone: "Europe/London" },
  { name: "Canada", code: "CA", flag: "🇨🇦", timezone: "America/Toronto" },
  { name: "Australia", code: "AU", flag: "🇦🇺", timezone: "Australia/Sydney" },
  { name: "Germany", code: "DE", flag: "🇩🇪", timezone: "Europe/Berlin" },
  { name: "France", code: "FR", flag: "🇫🇷", timezone: "Europe/Paris" },
  { name: "Bangladesh", code: "BD", flag: "🇧🇩", timezone: "Asia/Dhaka" },
  { name: "India", code: "IN", flag: "🇮🇳", timezone: "Asia/Kolkata" },
  { name: "Pakistan", code: "PK", flag: "🇵🇰", timezone: "Asia/Karachi" },
  { name: "Japan", code: "JP", flag: "🇯🇵", timezone: "Asia/Tokyo" },
  { name: "China", code: "CN", flag: "🇨🇳", timezone: "Asia/Shanghai" },
  { name: "South Korea", code: "KR", flag: "🇰🇷", timezone: "Asia/Seoul" },
  { name: "Singapore", code: "SG", flag: "🇸🇬", timezone: "Asia/Singapore" },
  { name: "UAE", code: "AE", flag: "🇦🇪", timezone: "Asia/Dubai" },
  { name: "Saudi Arabia", code: "SA", flag: "🇸🇦", timezone: "Asia/Riyadh" },
  { name: "Brazil", code: "BR", flag: "🇧🇷", timezone: "America/Sao_Paulo" },
  { name: "Mexico", code: "MX", flag: "🇲🇽", timezone: "America/Mexico_City" },
  { name: "Nigeria", code: "NG", flag: "🇳🇬", timezone: "Africa/Lagos" },
  { name: "South Africa", code: "ZA", flag: "🇿🇦", timezone: "Africa/Johannesburg" },
  { name: "Egypt", code: "EG", flag: "🇪🇬", timezone: "Africa/Cairo" },
  { name: "Turkey", code: "TR", flag: "🇹🇷", timezone: "Europe/Istanbul" },
  { name: "Russia", code: "RU", flag: "🇷🇺", timezone: "Europe/Moscow" },
  { name: "Italy", code: "IT", flag: "🇮🇹", timezone: "Europe/Rome" },
  { name: "Spain", code: "ES", flag: "🇪🇸", timezone: "Europe/Madrid" },
  { name: "Netherlands", code: "NL", flag: "🇳🇱", timezone: "Europe/Amsterdam" },
  { name: "Sweden", code: "SE", flag: "🇸🇪", timezone: "Europe/Stockholm" },
  { name: "Norway", code: "NO", flag: "🇳🇴", timezone: "Europe/Oslo" },
  { name: "Denmark", code: "DK", flag: "🇩🇰", timezone: "Europe/Copenhagen" },
  { name: "Finland", code: "FI", flag: "🇫🇮", timezone: "Europe/Helsinki" },
  { name: "Poland", code: "PL", flag: "🇵🇱", timezone: "Europe/Warsaw" },
  { name: "Portugal", code: "PT", flag: "🇵🇹", timezone: "Europe/Lisbon" },
  { name: "Greece", code: "GR", flag: "🇬🇷", timezone: "Europe/Athens" },
  { name: "Ireland", code: "IE", flag: "🇮🇪", timezone: "Europe/Dublin" },
  { name: "New Zealand", code: "NZ", flag: "🇳🇿", timezone: "Pacific/Auckland" },
  { name: "Thailand", code: "TH", flag: "🇹🇭", timezone: "Asia/Bangkok" },
  { name: "Vietnam", code: "VN", flag: "🇻🇳", timezone: "Asia/Ho_Chi_Minh" },
  { name: "Indonesia", code: "ID", flag: "🇮🇩", timezone: "Asia/Jakarta" },
  { name: "Philippines", code: "PH", flag: "🇵🇭", timezone: "Asia/Manila" },
  { name: "Malaysia", code: "MY", flag: "🇲🇾", timezone: "Asia/Kuala_Lumpur" },
  { name: "Kenya", code: "KE", flag: "🇰🇪", timezone: "Africa/Nairobi" },
  { name: "Ghana", code: "GH", flag: "🇬🇭", timezone: "Africa/Accra" },
  { name: "Ethiopia", code: "ET", flag: "🇪🇹", timezone: "Africa/Addis_Ababa" },
  { name: "Morocco", code: "MA", flag: "🇲🇦", timezone: "Africa/Casablanca" },
  { name: "Argentina", code: "AR", flag: "🇦🇷", timezone: "America/Argentina/Buenos_Aires" },
  { name: "Colombia", code: "CO", flag: "🇨🇴", timezone: "America/Bogota" },
  { name: "Chile", code: "CL", flag: "🇨🇱", timezone: "America/Santiago" },
  { name: "Peru", code: "PE", flag: "🇵🇪", timezone: "America/Lima" },
  { name: "Israel", code: "IL", flag: "🇮🇱", timezone: "Asia/Jerusalem" },
  { name: "Lebanon", code: "LB", flag: "🇱🇧", timezone: "Asia/Beirut" },
  { name: "Jordan", code: "JO", flag: "🇯🇴", timezone: "Asia/Amman" },
];

export const timezones = [
  { label: "🇧🇩 Bangladesh (BST)", value: "Asia/Dhaka" },
  { label: "🇮🇳 India (IST)", value: "Asia/Kolkata" },
  { label: "🇦🇪 UAE (GST)", value: "Asia/Dubai" },
  { label: "🇸🇬 Singapore (SGT)", value: "Asia/Singapore" },
  { label: "🇬🇧 UK (GMT/BST)", value: "Europe/London" },
  { label: "🇺🇸 US Eastern (ET)", value: "America/New_York" },
  { label: "🇺🇸 US Central (CT)", value: "America/Chicago" },
  { label: "🇺🇸 US Mountain (MT)", value: "America/Denver" },
  { label: "🇺🇸 US Pacific (PT)", value: "America/Los_Angeles" },
  { label: "🇺🇸 US Alaska (AKT)", value: "America/Anchorage" },
  { label: "🇺🇸 US Hawaii (HT)", value: "Pacific/Honolulu" },
  { label: "🇯🇵 Japan (JST)", value: "Asia/Tokyo" },
  { label: "🇨🇳 China (CST)", value: "Asia/Shanghai" },
  { label: "🇰🇷 South Korea (KST)", value: "Asia/Seoul" },
  { label: "🇦🇺 Australia Eastern (AEST)", value: "Australia/Sydney" },
  { label: "🇳🇿 New Zealand (NZST)", value: "Pacific/Auckland" },
  { label: "🇧🇷 Brazil (BRT)", value: "America/Sao_Paulo" },
  { label: "🇩🇪 Germany (CET)", value: "Europe/Berlin" },
  { label: "🇫🇷 France (CET)", value: "Europe/Paris" },
  { label: "🇷🇺 Russia (MSK)", value: "Europe/Moscow" },
];

export function searchCountries(query: string): Country[] {
  const lower = query.toLowerCase();
  return countries.filter(
    (c) =>
      c.name.toLowerCase().includes(lower) ||
      c.code.toLowerCase().includes(lower)
  );
}

export function getCountryByCode(code: string): Country | undefined {
  return countries.find((c) => c.code === code);
}

export function getCountryPage(page: number, perPage: number = 10): Country[] {
  const start = page * perPage;
  return countries.slice(start, start + perPage);
}

export function getTotalCountryPages(perPage: number = 10): number {
  return Math.ceil(countries.length / perPage);
}
