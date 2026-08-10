export type FoodOption = {
  name: string;
  price: number;
  description: string;
  photos: string[];
  isDefault: boolean;
  availableFor?: string[];
  _id: string;
};
