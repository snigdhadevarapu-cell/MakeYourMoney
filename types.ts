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
}
