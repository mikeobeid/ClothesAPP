export const CLOTHING_CATEGORIES = [
  'Tops',
  'Bottoms',
  'Dresses',
  'Outerwear',
  'Shoes',
  'Accessories',
] as const;

export const SEASONS = [
  'Spring',
  'Summer',
  'Fall',
  'Winter',
  'All-Season',
] as const;

export const OCCASIONS = [
  'Casual',
  'Work',
  'Formal',
  'Athletic',
  'Date Night',
  'Party',
  'Travel',
] as const;

export type ColorOption = {
  name: string;
  hex: string;
};

export const COLORS: ColorOption[] = [
  { name: 'Black', hex: '#1A1A1A' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Gray', hex: '#9CA3AF' },
  { name: 'Navy', hex: '#1E3A5F' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Red', hex: '#EF4444' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Green', hex: '#22C55E' },
  { name: 'Brown', hex: '#92400E' },
  { name: 'Beige', hex: '#D4C4A8' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Yellow', hex: '#EAB308' },
];
