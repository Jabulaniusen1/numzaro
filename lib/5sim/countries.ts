import { FIVESIM_COUNTRY_MAPPING, FIVESIM_REVERSE_COUNTRY_MAPPING } from './types';

// Helper functions for country mapping between ISO codes and 5sim.net country names

/**
 * Convert ISO country code to 5sim.net country name
 * @param isoCode ISO country code (e.g., 'US', 'GB', 'RU')
 * @returns 5sim.net country name or null if not found
 */
export function isoToFiveSimCountry(isoCode: string): string | null {
  return FIVESIM_COUNTRY_MAPPING[isoCode.toUpperCase()] || null;
}

/**
 * Convert 5sim.net country name to ISO country code
 * @param fiveSimCountry 5sim.net country name (e.g., 'usa', 'england', 'russia')
 * @returns ISO country code or null if not found
 */
export function fiveSimCountryToIso(fiveSimCountry: string): string | null {
  return FIVESIM_REVERSE_COUNTRY_MAPPING[fiveSimCountry.toLowerCase()] || null;
}

/**
 * Get all supported ISO country codes
 * @returns Array of ISO country codes
 */
export function getSupportedIsoCountries(): string[] {
  return Object.keys(FIVESIM_COUNTRY_MAPPING);
}

/**
 * Get all supported 5sim.net country names
 * @returns Array of 5sim.net country names
 */
export function getSupportedFiveSimCountries(): string[] {
  return Object.values(FIVESIM_COUNTRY_MAPPING);
}

/**
 * Check if a country is supported by 5sim.net
 * @param isoCode ISO country code
 * @returns true if supported, false otherwise
 */
export function isCountrySupported(isoCode: string): boolean {
  return isoCode.toUpperCase() in FIVESIM_COUNTRY_MAPPING;
}

/**
 * Get country display name mapping for UI
 * @returns Mapping of ISO codes to display names
 */
export function getCountryDisplayNames(): Record<string, string> {
  return {
    "US": "United States",
    "GB": "United Kingdom", 
    "RU": "Russia",
    "CN": "China",
    "IN": "India",
    "BR": "Brazil",
    "DE": "Germany",
    "FR": "France",
    "IT": "Italy",
    "ES": "Spain",
    "CA": "Canada",
    "AU": "Australia",
    "JP": "Japan",
    "KR": "South Korea",
    "MX": "Mexico",
    "ID": "Indonesia",
    "PH": "Philippines",
    "TH": "Thailand",
    "VN": "Vietnam",
    "MY": "Malaysia",
    "SG": "Singapore",
    "NL": "Netherlands",
    "BE": "Belgium",
    "CH": "Switzerland",
    "AT": "Austria",
    "SE": "Sweden",
    "NO": "Norway",
    "DK": "Denmark",
    "FI": "Finland",
    "PL": "Poland",
    "CZ": "Czech Republic",
    "HU": "Hungary",
    "RO": "Romania",
    "GR": "Greece",
    "PT": "Portugal",
    "IE": "Ireland",
    "TR": "Turkey",
    "IL": "Israel",
    "AE": "United Arab Emirates",
    "SA": "Saudi Arabia",
    "EG": "Egypt",
    "ZA": "South Africa",
    "NG": "Nigeria",
    "KE": "Kenya",
    "AR": "Argentina",
    "CL": "Chile",
    "CO": "Colombia",
    "PE": "Peru",
    "VE": "Venezuela",
    "UA": "Ukraine",
    "KZ": "Kazakhstan",
    "UZ": "Uzbekistan",
    "AF": "Afghanistan",
    "PK": "Pakistan",
    "BD": "Bangladesh",
    "LK": "Sri Lanka",
    "NP": "Nepal",
    "MM": "Myanmar",
    "LA": "Laos",
    "KH": "Cambodia",
    "MN": "Mongolia",
    "GE": "Georgia",
    "AM": "Armenia",
    "AZ": "Azerbaijan",
    "TJ": "Tajikistan",
    "TM": "Turkmenistan",
    "KG": "Kyrgyzstan"
  };
}

/**
 * Get popular countries for quick selection
 * @returns Array of popular ISO country codes
 */
export function getPopularCountries(): string[] {
  return [
    "US",  // United States
    "GB",  // United Kingdom
    "DE",  // Germany
    "FR",  // France
    "CA",  // Canada
    "AU",  // Australia
    "RU",  // Russia
    "CN",  // China
    "IN",  // India
    "BR"   // Brazil
  ];
}

/**
 * Get countries by region
 * @returns Object with regions as keys and arrays of country codes as values
 */
export function getCountriesByRegion(): Record<string, string[]> {
  return {
    "North America": ["US", "CA", "MX"],
    "Europe": ["GB", "DE", "FR", "IT", "ES", "NL", "BE", "CH", "AT", "SE", "NO", "DK", "FI", "PL", "CZ", "HU", "RO", "GR", "PT", "IE"],
    "Asia": ["CN", "IN", "JP", "KR", "RU", "ID", "PH", "TH", "VN", "MY", "SG", "KZ", "UZ", "AF", "PK", "BD", "LK", "NP", "MM", "LA", "KH", "MN", "GE", "AM", "AZ", "TJ", "TM", "KG"],
    "South America": ["BR", "AR", "CL", "CO", "PE", "VE"],
    "Middle East & Africa": ["TR", "IL", "AE", "SA", "EG", "ZA", "NG", "KE", "UA"],
    "Oceania": ["AU"]
  };
}
