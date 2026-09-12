export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  mrp?: number;
  stock: number;
  unit?: string;
  categoryId?: string;
  isActive: boolean;
  images?: string[];
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
}
