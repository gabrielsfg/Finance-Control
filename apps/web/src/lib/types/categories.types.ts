export type SubCategory = {
  id: number;
  categoryId: number;
  categoryName: string;
  categoryColor: string | null;
  name: string;
};

export type Category = {
  id: number;
  name: string;
  color: string | null;
  isSystem: boolean;
  subCategories: SubCategory[];
};

export type CreateCategoryRequest = {
  name: string;
  color?: string;
};

export type UpdateCategoryRequest = {
  id: number;
  name: string;
  color?: string;
};

export type UpdateCategoriesRequest = {
  categories: UpdateCategoryRequest[];
};

export type CreateSubCategoryRequest = {
  name: string;
  categoryId: number;
};

export type UpdateSubCategoryRequest = {
  name: string;
  categoryId: number;
};
