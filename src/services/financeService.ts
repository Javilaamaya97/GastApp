import { supabase } from "../lib/supabaseClient";

export const addTransaction = async (transaction: Transaction) => {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) throw new Error("Usuario no autenticado");

  const { data, error } = await supabase
    .from("transactions")
    .insert([
      {
        ...transaction,
        user_id: user.id, // 🔥 CLAVE DEL MULTIUSUARIO
      },
    ])
    .select();

  if (error) {
    console.error("❌ ERROR INSERT:", error);
    throw error;
  }

  return data;
};

export const deleteTransaction = async (id: string) => {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) return;

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id); // 🔥 SEGURIDAD

  if (error) {
    console.error("❌ ERROR DELETE:", error);
  }
};

export const getTransactions = async (): Promise<Transaction[]> => {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) return [];

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id) // 🔥 FILTRO
    .order("date", { ascending: false });

  if (error) {
    console.error("❌ ERROR GET:", error);
    return [];
  }

  return data as Transaction[];
};

export const getSummary = async () => {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return { income: 0, expenses: 0, balance: 0 };
  }

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id);

  if (error || !data) {
    console.error(error);
    return { income: 0, expenses: 0, balance: 0 };
  }

  const income = data
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = data
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    income,
    expenses,
    balance: income - expenses
  };
};