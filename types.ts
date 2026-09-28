export interface PricePoint {
  date: string;
  price: number;
}

export interface Deal {
  id: string;
  title: string;
  oldPrice: number;
  newPrice: number;
  discountPercentage: number;
  source: string;
  imageKeyword?: string;
  imageUrl?: string;
  highlight?: boolean;
  hasPriceDropped?: boolean;
  priceHistory?: PricePoint[];
}

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isDemo?: boolean;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface StorePlace {
  title: string;
  uri: string;
  address?: string;
  type?: string;
  reviewSnippet?: string;
}
