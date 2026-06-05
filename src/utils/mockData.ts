import { ClothingItem, Outfit } from '../types';

export const MOCK_CLOTHING_ITEMS: ClothingItem[] = [
  {
    id: '1',
    name: 'White Linen Shirt',
    category: 'Tops',
    color: 'White',
    season: ['Summer', 'Spring'],
    occasion: ['Casual', 'Work'],
    createdAt: '2025-11-02T10:00:00.000Z',
  },
  {
    id: '2',
    name: 'Dark Wash Jeans',
    category: 'Bottoms',
    color: 'Navy',
    season: ['All-Season'],
    occasion: ['Casual'],
    createdAt: '2025-11-05T10:00:00.000Z',
  },
  {
    id: '3',
    name: 'Black Blazer',
    category: 'Outerwear',
    color: 'Black',
    season: ['Fall', 'Winter', 'Spring'],
    occasion: ['Work', 'Formal'],
    createdAt: '2025-11-08T10:00:00.000Z',
  },
  {
    id: '4',
    name: 'Floral Midi Dress',
    category: 'Dresses',
    color: 'Pink',
    season: ['Spring', 'Summer'],
    occasion: ['Date Night', 'Party'],
    createdAt: '2025-11-10T10:00:00.000Z',
  },
  {
    id: '5',
    name: 'White Sneakers',
    category: 'Shoes',
    color: 'White',
    season: ['All-Season'],
    occasion: ['Casual', 'Athletic'],
    createdAt: '2025-11-12T10:00:00.000Z',
  },
  {
    id: '6',
    name: 'Camel Trench Coat',
    category: 'Outerwear',
    color: 'Beige',
    season: ['Fall', 'Winter'],
    occasion: ['Work', 'Formal'],
    createdAt: '2025-11-15T10:00:00.000Z',
  },
  {
    id: '7',
    name: 'Striped Cotton Tee',
    category: 'Tops',
    color: 'Navy',
    season: ['Summer', 'Spring'],
    occasion: ['Casual'],
    createdAt: '2025-11-18T10:00:00.000Z',
  },
  {
    id: '8',
    name: 'High-Waist Trousers',
    category: 'Bottoms',
    color: 'Black',
    season: ['All-Season'],
    occasion: ['Work', 'Formal'],
    createdAt: '2025-11-20T10:00:00.000Z',
  },
  {
    id: '9',
    name: 'Leather Crossbody Bag',
    category: 'Accessories',
    color: 'Brown',
    season: ['All-Season'],
    occasion: ['Casual', 'Work', 'Date Night'],
    createdAt: '2025-11-22T10:00:00.000Z',
  },
  {
    id: '10',
    name: 'Chunky Knit Sweater',
    category: 'Tops',
    color: 'Beige',
    season: ['Fall', 'Winter'],
    occasion: ['Casual'],
    createdAt: '2025-11-25T10:00:00.000Z',
  },
];

export const MOCK_OUTFITS: Outfit[] = [
  {
    id: '1',
    name: 'Weekend Casual',
    clothingItemIds: ['7', '2', '5'],
    occasion: 'Casual',
    season: 'Spring',
    createdAt: '2025-11-28T10:00:00.000Z',
  },
  {
    id: '2',
    name: 'Office Ready',
    clothingItemIds: ['1', '8', '3', '5'],
    occasion: 'Work',
    season: 'All-Season',
    createdAt: '2025-11-29T10:00:00.000Z',
  },
  {
    id: '3',
    name: 'Date Night',
    clothingItemIds: ['4', '9', '5'],
    occasion: 'Date Night',
    season: 'Summer',
    createdAt: '2025-11-30T10:00:00.000Z',
  },
  {
    id: '4',
    name: 'Winter Layers',
    clothingItemIds: ['10', '8', '6', '9'],
    occasion: 'Casual',
    season: 'Winter',
    createdAt: '2025-12-01T10:00:00.000Z',
  },
];

export function getClothingItemsForOutfit(
  outfit: Outfit,
  items: ClothingItem[],
): ClothingItem[] {
  return outfit.clothingItemIds
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is ClothingItem => item !== undefined);
}

