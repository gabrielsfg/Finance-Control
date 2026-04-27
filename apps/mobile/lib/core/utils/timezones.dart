class TimezoneOption {
  const TimezoneOption({required this.iana, required this.label, required this.offset});

  /// IANA identifier, e.g. "America/Sao_Paulo"
  final String iana;

  /// Human-readable name, e.g. "São Paulo"
  final String label;

  /// UTC offset string, e.g. "UTC-3"
  final String offset;

  String get display => '$label ($offset)';
}

/// All timezones sorted alphabetically by [label].
const List<TimezoneOption> kTimezones = [
  TimezoneOption(iana: 'Pacific/Pago_Pago',       label: 'American Samoa',         offset: 'UTC-11'),
  TimezoneOption(iana: 'Pacific/Midway',           label: 'Midway Island',          offset: 'UTC-11'),
  TimezoneOption(iana: 'Pacific/Honolulu',         label: 'Hawaii',                 offset: 'UTC-10'),
  TimezoneOption(iana: 'America/Anchorage',        label: 'Alaska',                 offset: 'UTC-9'),
  TimezoneOption(iana: 'America/Los_Angeles',      label: 'Los Angeles',            offset: 'UTC-8'),
  TimezoneOption(iana: 'America/Vancouver',        label: 'Vancouver',              offset: 'UTC-8'),
  TimezoneOption(iana: 'America/Tijuana',          label: 'Tijuana',                offset: 'UTC-8'),
  TimezoneOption(iana: 'America/Denver',           label: 'Denver',                 offset: 'UTC-7'),
  TimezoneOption(iana: 'America/Phoenix',          label: 'Arizona',                offset: 'UTC-7'),
  TimezoneOption(iana: 'America/Chihuahua',        label: 'Chihuahua',              offset: 'UTC-7'),
  TimezoneOption(iana: 'America/Mazatlan',         label: 'Mazatlan',               offset: 'UTC-7'),
  TimezoneOption(iana: 'America/Chicago',          label: 'Chicago',                offset: 'UTC-6'),
  TimezoneOption(iana: 'America/Mexico_City',      label: 'Mexico City',            offset: 'UTC-6'),
  TimezoneOption(iana: 'America/Regina',           label: 'Saskatchewan',           offset: 'UTC-6'),
  TimezoneOption(iana: 'America/Tegucigalpa',      label: 'Central America',        offset: 'UTC-6'),
  TimezoneOption(iana: 'America/New_York',         label: 'New York',               offset: 'UTC-5'),
  TimezoneOption(iana: 'America/Toronto',          label: 'Toronto',                offset: 'UTC-5'),
  TimezoneOption(iana: 'America/Bogota',           label: 'Bogota',                 offset: 'UTC-5'),
  TimezoneOption(iana: 'America/Lima',             label: 'Lima',                   offset: 'UTC-5'),
  TimezoneOption(iana: 'America/Caracas',          label: 'Caracas',                offset: 'UTC-4'),
  TimezoneOption(iana: 'America/Halifax',          label: 'Halifax',                offset: 'UTC-4'),
  TimezoneOption(iana: 'America/La_Paz',           label: 'La Paz',                 offset: 'UTC-4'),
  TimezoneOption(iana: 'America/Manaus',           label: 'Manaus',                 offset: 'UTC-4'),
  TimezoneOption(iana: 'America/Santiago',         label: 'Santiago',               offset: 'UTC-4'),
  TimezoneOption(iana: 'America/St_Johns',         label: 'Newfoundland',           offset: 'UTC-3:30'),
  TimezoneOption(iana: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires',    offset: 'UTC-3'),
  TimezoneOption(iana: 'America/Fortaleza',        label: 'Fortaleza',              offset: 'UTC-3'),
  TimezoneOption(iana: 'America/Godthab',          label: 'Greenland',              offset: 'UTC-3'),
  TimezoneOption(iana: 'America/Montevideo',       label: 'Montevideo',             offset: 'UTC-3'),
  TimezoneOption(iana: 'America/Sao_Paulo',        label: 'São Paulo',              offset: 'UTC-3'),
  TimezoneOption(iana: 'Atlantic/South_Georgia',   label: 'South Georgia',          offset: 'UTC-2'),
  TimezoneOption(iana: 'Atlantic/Azores',          label: 'Azores',                 offset: 'UTC-1'),
  TimezoneOption(iana: 'Atlantic/Cape_Verde',      label: 'Cape Verde Islands',     offset: 'UTC-1'),
  TimezoneOption(iana: 'Europe/London',            label: 'London',                 offset: 'UTC+0'),
  TimezoneOption(iana: 'Africa/Monrovia',          label: 'Monrovia',               offset: 'UTC+0'),
  TimezoneOption(iana: 'UTC',                      label: 'UTC',                    offset: 'UTC+0'),
  TimezoneOption(iana: 'Europe/Amsterdam',         label: 'Amsterdam',              offset: 'UTC+1'),
  TimezoneOption(iana: 'Europe/Belgrade',          label: 'Belgrade',               offset: 'UTC+1'),
  TimezoneOption(iana: 'Europe/Berlin',            label: 'Berlin',                 offset: 'UTC+1'),
  TimezoneOption(iana: 'Europe/Brussels',          label: 'Brussels',               offset: 'UTC+1'),
  TimezoneOption(iana: 'Europe/Budapest',          label: 'Budapest',               offset: 'UTC+1'),
  TimezoneOption(iana: 'Europe/Copenhagen',        label: 'Copenhagen',             offset: 'UTC+1'),
  TimezoneOption(iana: 'Europe/Lisbon',            label: 'Lisbon',                 offset: 'UTC+1'),
  TimezoneOption(iana: 'Europe/Ljubljana',         label: 'Ljubljana',              offset: 'UTC+1'),
  TimezoneOption(iana: 'Europe/Madrid',            label: 'Madrid',                 offset: 'UTC+1'),
  TimezoneOption(iana: 'Europe/Paris',             label: 'Paris',                  offset: 'UTC+1'),
  TimezoneOption(iana: 'Europe/Prague',            label: 'Prague',                 offset: 'UTC+1'),
  TimezoneOption(iana: 'Europe/Rome',              label: 'Rome',                   offset: 'UTC+1'),
  TimezoneOption(iana: 'Europe/Sarajevo',          label: 'Sarajevo',               offset: 'UTC+1'),
  TimezoneOption(iana: 'Europe/Skopje',            label: 'Skopje',                 offset: 'UTC+1'),
  TimezoneOption(iana: 'Europe/Stockholm',         label: 'Stockholm',              offset: 'UTC+1'),
  TimezoneOption(iana: 'Europe/Vienna',            label: 'Vienna',                 offset: 'UTC+1'),
  TimezoneOption(iana: 'Europe/Warsaw',            label: 'Warsaw',                 offset: 'UTC+1'),
  TimezoneOption(iana: 'Europe/Zagreb',            label: 'Zagreb',                 offset: 'UTC+1'),
  TimezoneOption(iana: 'Africa/Algiers',           label: 'West Central Africa',    offset: 'UTC+1'),
  TimezoneOption(iana: 'Europe/Athens',            label: 'Athens',                 offset: 'UTC+2'),
  TimezoneOption(iana: 'Europe/Bucharest',         label: 'Bucharest',              offset: 'UTC+2'),
  TimezoneOption(iana: 'Africa/Cairo',             label: 'Cairo',                  offset: 'UTC+2'),
  TimezoneOption(iana: 'Africa/Harare',            label: 'Harare',                 offset: 'UTC+2'),
  TimezoneOption(iana: 'Europe/Helsinki',          label: 'Helsinki',               offset: 'UTC+2'),
  TimezoneOption(iana: 'Asia/Jerusalem',           label: 'Jerusalem',              offset: 'UTC+2'),
  TimezoneOption(iana: 'Europe/Kiev',              label: 'Kyiv',                   offset: 'UTC+2'),
  TimezoneOption(iana: 'Europe/Riga',              label: 'Riga',                   offset: 'UTC+2'),
  TimezoneOption(iana: 'Europe/Sofia',             label: 'Sofia',                  offset: 'UTC+2'),
  TimezoneOption(iana: 'Europe/Tallinn',           label: 'Tallinn',                offset: 'UTC+2'),
  TimezoneOption(iana: 'Europe/Vilnius',           label: 'Vilnius',                offset: 'UTC+2'),
  TimezoneOption(iana: 'Asia/Baghdad',             label: 'Baghdad',                offset: 'UTC+3'),
  TimezoneOption(iana: 'Asia/Kuwait',              label: 'Kuwait',                 offset: 'UTC+3'),
  TimezoneOption(iana: 'Africa/Nairobi',           label: 'Nairobi',                offset: 'UTC+3'),
  TimezoneOption(iana: 'Asia/Riyadh',              label: 'Riyadh',                 offset: 'UTC+3'),
  TimezoneOption(iana: 'Europe/Moscow',            label: 'Moscow',                 offset: 'UTC+3'),
  TimezoneOption(iana: 'Asia/Tehran',              label: 'Tehran',                 offset: 'UTC+3:30'),
  TimezoneOption(iana: 'Asia/Baku',                label: 'Baku',                   offset: 'UTC+4'),
  TimezoneOption(iana: 'Asia/Muscat',              label: 'Muscat',                 offset: 'UTC+4'),
  TimezoneOption(iana: 'Asia/Tbilisi',             label: 'Tbilisi',                offset: 'UTC+4'),
  TimezoneOption(iana: 'Asia/Yerevan',             label: 'Yerevan',                offset: 'UTC+4'),
  TimezoneOption(iana: 'Asia/Kabul',               label: 'Kabul',                  offset: 'UTC+4:30'),
  TimezoneOption(iana: 'Asia/Yekaterinburg',       label: 'Ekaterinburg',           offset: 'UTC+5'),
  TimezoneOption(iana: 'Asia/Karachi',             label: 'Karachi',                offset: 'UTC+5'),
  TimezoneOption(iana: 'Asia/Tashkent',            label: 'Tashkent',               offset: 'UTC+5'),
  TimezoneOption(iana: 'Asia/Kolkata',             label: 'Mumbai / New Delhi',     offset: 'UTC+5:30'),
  TimezoneOption(iana: 'Asia/Colombo',             label: 'Sri Lanka',              offset: 'UTC+5:30'),
  TimezoneOption(iana: 'Asia/Kathmandu',           label: 'Kathmandu',              offset: 'UTC+5:45'),
  TimezoneOption(iana: 'Asia/Almaty',              label: 'Almaty',                 offset: 'UTC+6'),
  TimezoneOption(iana: 'Asia/Dhaka',               label: 'Dhaka',                  offset: 'UTC+6'),
  TimezoneOption(iana: 'Asia/Rangoon',             label: 'Rangoon',                offset: 'UTC+6:30'),
  TimezoneOption(iana: 'Asia/Bangkok',             label: 'Bangkok',                offset: 'UTC+7'),
  TimezoneOption(iana: 'Asia/Jakarta',             label: 'Jakarta',                offset: 'UTC+7'),
  TimezoneOption(iana: 'Asia/Krasnoyarsk',         label: 'Krasnoyarsk',            offset: 'UTC+7'),
  TimezoneOption(iana: 'Asia/Hong_Kong',           label: 'Hong Kong',              offset: 'UTC+8'),
  TimezoneOption(iana: 'Asia/Irkutsk',             label: 'Irkutsk',                offset: 'UTC+8'),
  TimezoneOption(iana: 'Asia/Kuala_Lumpur',        label: 'Kuala Lumpur',           offset: 'UTC+8'),
  TimezoneOption(iana: 'Australia/Perth',          label: 'Perth',                  offset: 'UTC+8'),
  TimezoneOption(iana: 'Asia/Singapore',           label: 'Singapore',              offset: 'UTC+8'),
  TimezoneOption(iana: 'Asia/Taipei',              label: 'Taipei',                 offset: 'UTC+8'),
  TimezoneOption(iana: 'Asia/Ulaanbaatar',         label: 'Ulaanbaatar',            offset: 'UTC+8'),
  TimezoneOption(iana: 'Asia/Shanghai',            label: 'Beijing / Chongqing',    offset: 'UTC+8'),
  TimezoneOption(iana: 'Asia/Seoul',               label: 'Seoul',                  offset: 'UTC+9'),
  TimezoneOption(iana: 'Asia/Tokyo',               label: 'Tokyo',                  offset: 'UTC+9'),
  TimezoneOption(iana: 'Asia/Yakutsk',             label: 'Yakutsk',                offset: 'UTC+9'),
  TimezoneOption(iana: 'Australia/Adelaide',       label: 'Adelaide',               offset: 'UTC+9:30'),
  TimezoneOption(iana: 'Australia/Darwin',         label: 'Darwin',                 offset: 'UTC+9:30'),
  TimezoneOption(iana: 'Australia/Brisbane',       label: 'Brisbane',               offset: 'UTC+10'),
  TimezoneOption(iana: 'Australia/Hobart',         label: 'Hobart',                 offset: 'UTC+10'),
  TimezoneOption(iana: 'Australia/Melbourne',      label: 'Melbourne',              offset: 'UTC+10'),
  TimezoneOption(iana: 'Pacific/Guam',             label: 'Guam',                   offset: 'UTC+10'),
  TimezoneOption(iana: 'Pacific/Port_Moresby',     label: 'Port Moresby',           offset: 'UTC+10'),
  TimezoneOption(iana: 'Australia/Sydney',         label: 'Sydney',                 offset: 'UTC+10'),
  TimezoneOption(iana: 'Asia/Vladivostok',         label: 'Vladivostok',            offset: 'UTC+10'),
  TimezoneOption(iana: 'Asia/Magadan',             label: 'Magadan',                offset: 'UTC+11'),
  TimezoneOption(iana: 'Pacific/Noumea',           label: 'New Caledonia',          offset: 'UTC+11'),
  TimezoneOption(iana: 'Pacific/Solomon Islands',  label: 'Solomon Islands',        offset: 'UTC+11'),
  TimezoneOption(iana: 'Pacific/Auckland',         label: 'Auckland',               offset: 'UTC+12'),
  TimezoneOption(iana: 'Pacific/Fiji',             label: 'Fiji',                   offset: 'UTC+12'),
  TimezoneOption(iana: 'Asia/Kamchatka',           label: 'Kamchatka',              offset: 'UTC+12'),
  TimezoneOption(iana: 'Pacific/Tongatapu',        label: 'Nuku\'alofa',            offset: 'UTC+13'),
];

/// Sorted alphabetically by label for display in the picker.
final List<TimezoneOption> kTimezonesAlphabetical = List.unmodifiable(
  [...kTimezones]..sort((a, b) => a.label.compareTo(b.label)),
);

/// Finds a [TimezoneOption] by IANA identifier, returns null if not found.
TimezoneOption? timezoneByIana(String iana) {
  try {
    return kTimezones.firstWhere((t) => t.iana == iana);
  } catch (_) {
    return null;
  }
}
