export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateRecipeDto = Omit<Recipe, "id" | "createdAt" | "updatedAt">;

export type UpdateRecipeDto = Partial<Recipe>;
