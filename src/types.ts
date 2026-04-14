export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  frequency: "once" | "monthly";
}

export type Category = "Alimentación" | "Transporte" | "Vivienda" | "Entretenimiento" | "Salud" | "Otros";

export const CATEGORIES: Category[] = [
  "Alimentación",
  "Transporte",
  "Vivienda",
  "Entretenimiento",
  "Salud",
  "Otros",
];
export type Income = {
  id: string;
  amount: number;
  type: "salary" | "extra" | "freelance" | "other";
  frequency: "once" | "weekly" | "biweekly" | "monthly";
  date: string;
  description: string;
};