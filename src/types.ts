// =======================
// 🔹 CATEGORÍAS
// =======================
export type Category =
  | "Alimentación"
  | "Transporte"
  | "Vivienda"
  | "Entretenimiento"
  | "Salud"
  | "Otros";

export const CATEGORIES: Category[] = [
  "Alimentación",
  "Transporte",
  "Vivienda",
  "Entretenimiento",
  "Salud",
  "Otros",
];

// =======================
// 🔹 TIPOS DE GASTO
// =======================
export type ExpenseType = "fixed" | "variable" | "one-time";

// =======================
// 🔹 GASTOS
// =======================
export type Expense = {
  id: string;
  amount: number;
  description: string;

  category: Category;
  type: ExpenseType;

  // 🧠 CUANDO SALE EL DINERO (CLAVE REAL)
  paidDate: string;

  // 📅 SOLO SI ES FIJO
  dueDate?: string;
};

// =======================
// 🔹 INGRESOS
// =======================
export type Income = {
  id: string;
  amount: number;
  type: "income";

  frequency: "diario" | "semanal" | "quincenal" | "mensual" | "extra";

  // 🧠 CUANDO ENTRA EL DINERO
  date: string;

  description: string;

  // 🔥 para análisis quincenal
  payment_day?: number;
};

// =======================
// 🔹 TRANSACCIONES (DB / SUPABASE)
// =======================
export interface Transaction {
  id?: string;
  type: "income" | "expense";

  amount: number;
  description: string;

  date: string; // base única para todo (IMPORTANTE)

  // opcionales por tipo
  category?: Category;
  expenseType?: ExpenseType;

  // solo gastos reales
  paidDate?: string;
  dueDate?: string;

  // ingresos
  frequency?: Income["frequency"];
  payment_day?: number;

  // multiusuario
  user_id?: string;
}