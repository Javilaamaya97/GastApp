// src/services/financeService.ts

export type Transaction = {
  id: string;
  type: "income" | "expense";
  amount: number;
  date: string;
  description?: string;

  frequency?: "once" | "monthly"; // 👈 AÑADIR
};

const STORAGE_KEY = "finance_data";

// Obtener datos
export const getTransactions = (): Transaction[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

// Guardar datos
export const saveTransactions = (transactions: Transaction[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
};

// Agregar transacción
export const addTransaction = (transaction: Transaction) => {
  const current = getTransactions();
  saveTransactions([...current, transaction]);
};

// Eliminar transacción ✅ (AQUÍ VA)
export const deleteTransaction = (id: string) => {
  const current = getTransactions();
  const updated = current.filter(t => t.id !== id);
  saveTransactions(updated);
};

// Calcular totales
export const getSummary = () => {
  const data = getTransactions();

  let income = 0;
  let expenses = 0;

  data.forEach((t) => {
    if (t.type === "income") {
      income += t.amount;
    } else {
      expenses += t.amount;
    }
  });

  return {
    income,
    expenses,
    balance: income - expenses,
  };
};