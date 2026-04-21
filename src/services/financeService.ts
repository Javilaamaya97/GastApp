import { supabase } from "../lib/supabaseClient";

export const getTransactions = async () => {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("date", { ascending: true });

  if (error) {
    console.error(error);
    return [];
  }

  return data;
};

export const addTransaction = async (transaction: any) => {
  const { error } = await supabase
    .from("transactions")
    .insert([transaction]);

  if (error) {
    console.error(error);
  }
};

export const deleteTransaction = async (id: string) => {
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
  }
};

export const getSummary = async () => {
  const { data } = await supabase
    .from("transactions")
    .select("*");

  if (!data) return { income: 0, expenses: 0, balance: 0 };

  const income = data
    .filter(t => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);

  const expenses = data
    .filter(t => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);

  return {
    income,
    expenses,
    balance: income - expenses
  };
};