import { getTransactions, addTransaction } from "../services/financeService";
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  Trash2, 
  LogOut, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  PieChart as PieChartIcon,
  LayoutDashboard,
  Calendar
} from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Expense, CATEGORIES, Category } from "../types";
import { cn } from "../lib/utils";
import { getSummary } from "../services/financeService";
import { deleteTransaction } from "../services/financeService";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAs } from "file-saver";
import html2canvas from "html2canvas";
import { Income } from "../types";
import { useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

interface DashboardProps {
  onLogout: () => void;
}

const COLORS = ["#3b82f6", "#8b5cf6", "#d946ef", "#f43f5e", "#10b981", "#f59e0b"];

export default function Dashboard({ onLogout }: DashboardProps) {

  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const [user, setUser] = useState<any>(null);
  const [summary, setSummary] = useState({
  income: 0,
  expenses: 0,
  balance: 0,
});
const translateFrequency = (freq: string) => {
  switch (freq) {
    case "mensual": return "Mensual";
    case "semanal": return "Semanal";
    case "diario": return "Diario";
    case "quincenal": return "Quincenal";
    case "extra": return "Extra";
    default: return freq;
  }
};
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("Otros");
  const [frequency, setFrequency] = useState<"once" | "monthly">("once");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  
  // Income state
  const [incomes, setIncomes] = useState<any[]>([]);
  const income = useMemo(() =>
  incomes.reduce((acc, i) => acc + i.amount, 0),
[incomes]);

  const [incomeFrequency, setIncomeFrequency] = useState<
  "diario" | "semanal" | "quincenal" | "mensual" | "extra"
>("mensual");
const [paymentDay, setPaymentDay] = useState(1);
  const [isEditingIncome, setIsEditingIncome] = useState(true); // Start true if we want them to set it up
  const [tempIncome, setTempIncome] = useState("");
  const [incomeError, setIncomeError] = useState("");
const refreshData = async () => {
  const data = await getTransactions();

  setExpenses(data.filter(t => t.type === "expense"));
  setIncomes(data.filter(t => t.type === "income"));

  const summaryData = await getSummary();
  setSummary(summaryData);
};
useEffect(() => {
  const loadData = async () => {
    // 🔐 Obtener usuario logueado
    const { data: userData } = await supabase.auth.getUser();
    setUser(userData.user);

    // 📊 Traer transacciones
    const data = await getTransactions();

    setExpenses(data.filter(t => t.type === "expense"));
    setIncomes(data.filter(t => t.type === "income"));

    const summaryData = await getSummary();
    setSummary(summaryData);
  };

  loadData();
}, []);
  const totalExpenses = summary.expenses;
  const totalIncome = useMemo(() => {
  return incomes.reduce((acc, inc) => acc + (inc.amount || 0), 0);
}, [incomes]);
const monthlyIncome = useMemo(() => {
  return incomes.reduce((acc, inc) => {
    switch (inc.frequency) {
      case "mensual":
        return acc + inc.amount;
      case "quincenal":
        return acc + inc.amount * 2;
      case "semanal":
        return acc + inc.amount * 4;
      case "diario":
        return acc + inc.amount * 30;
      case "extra":
        return acc + inc.amount;
      default:
        return acc + inc.amount;
    }
  }, 0);
}, [incomes]);


const balance = totalIncome - summary.expenses;

  const fixedExpenses = expenses.filter(exp => exp.frequency === "monthly");

const variableExpenses = expenses.filter(
  exp => exp.frequency !== "monthly"
);

const totalFixedExpenses = fixedExpenses.reduce(
  (acc, exp) => acc + exp.amount,
  0
);


const totalVariableExpenses = variableExpenses.reduce(
  (acc, exp) => acc + exp.amount,
  0
);
const realAvailable = monthlyIncome - totalFixedExpenses;

const recommendedSavings = realAvailable > 0 ? realAvailable * 0.2 : 0;

const safeToSpend = realAvailable > 0 ? realAvailable - recommendedSavings : 0;
const monthlyProjection = useMemo(() => {
  if (totalIncome === 0) return null;

  const today = new Date();
  const day = today.getDate();

  // días del mes
  const daysInMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0
  ).getDate();

  // promedio diario de gasto variable
  const dailyAvg =
    day > 0 ? totalVariableExpenses / day : 0;

  // proyección total variable
  const projectedVariable = dailyAvg * daysInMonth;

  const projectedTotal = totalFixedExpenses + projectedVariable;

  const remaining = monthlyIncome - projectedTotal;

  return {
    projectedTotal,
    remaining
  };
}, [income, totalVariableExpenses, totalFixedExpenses]);

  const spentPercentage = useMemo(() => {
    if (totalIncome === 0) return 0;
    return Math.min((totalExpenses / totalIncome) * 100, 100);
  }, [totalIncome, totalExpenses]);

  const alert = useMemo(() => {
  if (totalIncome === 0) {
    return {
      type: "info",
      message: "Configura tu ingreso"
    };
  }
if (safeToSpend <= 0) {
  return {
    type: "danger",
    message: "🚨 Ya no deberías hacer más gastos variables este mes."
  };
}
  if (balance < 0) {
    return {
      type: "danger",
      message: "🚨 Estás en sobregiro"
    };
  }

  if (totalFixedExpenses > totalIncome * 0.7) {
    return {
      type: "danger",
      message: "🚨 Tus gastos fijos superan el 70% de tu ingreso"
    };
  }

  if (balance <= 0) {
    return {
      type: "warning",
      message: "⚠️ No tienes dinero disponible después de gastos fijos"
    };
  }

  return {
    type: "success",
    message: `Te queda disponible $${balance.toLocaleString("es-ES")} para gastar`
  };
}, [totalIncome, totalFixedExpenses, balance, realAvailable]);

  const categoryData = useMemo(() => {
    const data = CATEGORIES.map(cat => {
      const total = expenses
        .filter(exp => exp.category === cat)
        .reduce((sum, exp) => sum + exp.amount, 0);
      return { name: cat, value: total };
    }).filter(item => item.value > 0);
    return data;
  }, [expenses]);
  const lastExpenses = expenses.slice(0, 7).reverse();
  const categoryAlert = useMemo(() => {
  if (income === 0) return null;

  // 🚨 CONTROL GLOBAL DEL PRESUPUESTO
if (spentPercentage >= 95) {
  return {
    type: "danger",
    message: "🔴 Estás al límite de tu presupuesto mensual. Evita cualquier gasto innecesario."
  };
}

if (spentPercentage >= 80) {
  return {
    type: "warning",
    message: "🟡 Ya usaste la mayor parte de tu presupuesto. Gasta con cuidado."
  };
}
if (realAvailable <= 0) {
  return {
    type: "danger",
    message: "🚨 Ya consumiste tu presupuesto del mes. Evita nuevos gastos."
  };
}
const analyzed = categoryData.map(cat => {
  const percentage = (cat.value / income) * 100;

  const type =
    cat.name === "Vivienda" ||
    cat.name === "Servicios" ||
    cat.name === "Educación"
      ? "fixed"
      : cat.name === "Alimentación" ||
        cat.name === "Transporte" ||
        cat.name === "Salud"
      ? "necessary"
      : "optional";

  return { ...cat, percentage, type };
});
const risky = analyzed
  .filter(cat => cat.percentage >= 25)
  .sort((a, b) => {
    const priority = {
      optional: 3,
      necessary: 2,
      fixed: 1,
    };

    return priority[b.type] - priority[a.type];
  });
if (risky.length === 0) {
  return {
    type: "success",
    message: "🟢 Semáforo verde: tus gastos están equilibrados."
  };
}
const worst = risky[0];
if (worst.type === "necessary") {
  return {
    type: "warning",
    message: `🟡 ${worst.name} representa ${worst.percentage.toFixed(1)}% de tu ingreso. No es recortable, pero revísalo.`
  };
}
if (worst.type === "optional") {
  return {
    type: "danger",
    message: `🔴 ${worst.name} representa ${worst.percentage.toFixed(1)}% de tu ingreso. Este gasto sí es recortable.`
  };
}
return {
  type: "info",
  message: `🔵 ${worst.name} es un gasto fijo. No se recomienda recortar aquí.`
};
  const fixedCategories = ["Vivienda"];

  const variableExpenses = expenses.filter(
    (e) => !fixedCategories.includes(e.category)
  );

  const variableCategoryData = CATEGORIES.map(cat => {
    const total = variableExpenses
      .filter(e => e.category === cat)
      .reduce((sum, e) => sum + e.amount, 0);

    return { name: cat, value: total };
  }).filter(c => c.value > 0);

  const topCategory = variableCategoryData.reduce((max, cat) => {
    return cat.value > (max?.value || 0) ? cat : max;
  }, null as { name: string; value: number } | null);

  if (!topCategory) return null;

  const percentage = (topCategory.value / income) * 100;

  const formatMoney = (val: number) =>
    val.toLocaleString("es-ES");

  if (percentage >= 40) {
    return {
      type: "danger",
      message: `🚨 ${topCategory.name}: ${formatMoney(topCategory.value)} este mes en gastos variables.`
    };
  }

  if (percentage >= 25) {
    return {
      type: "warning",
      message: `⚠️ ${topCategory.name}: ${percentage.toFixed(1)}% de tu ingreso en gastos variables.`
    };
  }

  return {
    type: "success",
    message: `Tu mayor gasto es ${topCategory.name} (${percentage.toFixed(1)}%) del ingreso.`
  };
}, [expenses, income]);

  const addExpense = async (e: React.FormEvent) => {
  e.preventDefault();

  const parsedAmount = parseFloat(amount);

  if (!description || !amount || parsedAmount <= 0) {
    alert("❌ Revisa los datos del gasto");
    return;
  }

  const newExpense = {
    description,
    amount: parsedAmount,
    category,
    date: new Date(date + "T12:00:00").toISOString(),
    frequency,
  };

  console.log("🚀 ENVIANDO A SUPABASE:", newExpense);

  await addTransaction({
  user_id: user.id, // 👈 ESTE ES EL CAMBIO IMPORTANTE
  type: "expense",
  amount: newExpense.amount,
  date: newExpense.date,
  description: newExpense.description,
  frequency: frequency,
  category: category
});

  await refreshData();

  setDescription("");
  setAmount("");
};

  const deleteExpense = async (id: string) => {
  await deleteTransaction(id);
  await refreshData();
};
const deleteIncome = (id: string) => {
  deleteTransaction(id);
  refreshData();
};
  const exportToExcel = () => {
  // 📊 RESUMEN
  const worksheetData = [
  ["REPORTE FINANCIERO"],
  ["Fecha", new Date().toLocaleDateString()],
  [],
  ["RESUMEN"],
  ["Ingreso", income],
  ["Gastos", totalExpenses],
  ["Balance", balance],
  [],
  ["DESGLOSE DE GASTOS"],
  ["Fecha", "Descripción", "Categoría", "Tipo", "Monto"],
  ...expenses.map((e) => [
    new Date(e.date).toLocaleDateString(),
    e.description,
    e.category,
    e.frequency === "monthly" ? "Fijo" : "Variable",
    e.amount
  ]),
  [],
  ["CATEGORÍAS"],
  ["Categoría", "Total"],
  ...categoryData.map((c) => [c.name, c.value]),
  [],
  ["INSIGHTS"],
  [alert.message],
  categoryAlert ? [categoryAlert.message] : []
];

  const ws = XLSX.utils.aoa_to_sheet(worksheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Reporte");

  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const file = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });

  saveAs(file, "reporte-financiero.xlsx");
};

const exportToPDF = () => {
  const doc = new jsPDF();

  // 🧾 TÍTULO
  doc.setFontSize(16);
  doc.text("Reporte Financiero", 14, 10);
  

  doc.setFontSize(10);
  doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 16);

  // 📊 RESUMEN
  autoTable(doc, {
    startY: 20,
    head: [["Resumen", "Valor"]],
    body: [
      ["Ingreso", `$${income}`],
      ["Total Gastado", `$${totalExpenses}`],
      ["Balance", `$${balance}`],
      ["Gastos Fijos", `$${totalFixedExpenses}`],
      ["Gastos Variables", `$${totalVariableExpenses}`],
      ["% Gastado", `${spentPercentage.toFixed(1)}%`]
    ]
  });

  // 📋 TABLA DE GASTOS
  const tableData = expenses.map((exp) => [
    new Date(exp.date).toLocaleDateString(),
    exp.description,
    exp.category,
    exp.frequency === "monthly" ? "Fijo" : "Variable",
    `$${exp.amount}`
  ]);

  autoTable(doc, {
    startY: (doc as any).lastAutoTable?.finalY
  ? (doc as any).lastAutoTable.finalY + 10
  : 20,
    head: [["Fecha", "Descripción", "Categoría", "Tipo", "Monto"]],
    body: tableData
  });

  doc.save("reporte-financiero.pdf");
};
  const exportData = () => {
  const data = {
    income,
    totalExpenses,
    balance,
    fixedExpenses: totalFixedExpenses,
    variableExpenses: totalVariableExpenses,
    categoryData,
    expenses,
    date: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "reporte-financiero.json";
  a.click();

  URL.revokeObjectURL(url);

};

  const handleSaveIncome = async () => {
  const val = parseFloat(tempIncome);

  setIncomeError("");

  if (!tempIncome || isNaN(val)) {
    setIncomeError("⚠️ Ingresa un valor válido");
    return;
  }

  if (val <= 0) {
    setIncomeError("❌ El ingreso debe ser mayor a 0");
    return;
  }

  const newIncome = {
  id: crypto.randomUUID(),
  type: "income",
  amount: val,
  date: new Date().toISOString(),
  description: `Ingreso ${incomeFrequency}`,
  frequency: incomeFrequency,
  payment_day: paymentDay // 🔥 NUEVO
};

  await addTransaction({
  ...newIncome,
  user_id: user.id,
  payment_day: paymentDay
});
  await refreshData();

  setIncome(val);
  setIsEditingIncome(false);
};

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${
  theme === "dark"
    ? "bg-[#0a0a0a] text-white"
    : "bg-gray-100 text-gray-900"
}`}>
      {/* Navbar */}
      <nav className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-tr from-[#7c3aed] to-[#3b82f6] rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:rotate-12 transition-transform">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <span className="font-black text-2xl tracking-tighter italic">
              Gast<span className="text-[#3b82f6]">APP</span>
            </span>
          </div>
          <button
  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
  className="mr-4 text-xs px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
>
  {theme === "dark" ? "🌞 Claro" : "🌙 Oscuro"}
</button>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form & Stats */}
        <div className="lg:col-span-4 space-y-8">
          {/* Income Config Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`border rounded-2xl p-6 shadow-xl transition-colors ${
  theme === "dark"
    ? "bg-[#121212] border-white/5"
    : "bg-white border-gray-200"
}`}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-400 text-xs uppercase tracking-wider font-bold">
                {income === 0 ? "Configura tu Ingreso" : "Configuración de Ingreso"}
              </p>
              {!isEditingIncome && (
                <button 
                  onClick={() => {
                    setTempIncome(income.toString());
                    setIsEditingIncome(true);
                  }}
                  className="text-[#3b82f6] text-xs font-bold hover:underline"
                >
                  Editar
                </button>
              )}
            </div>

            {isEditingIncome ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {(["diario", "semanal", "quincenal", "mensual", "extra"] as const).map((freq) => (
                    <button 
                      key={freq}
                      onClick={() => setIncomeFrequency(freq)}
                      className={cn(
                        "py-2 rounded-lg text-[10px] font-bold transition-all",
                        incomeFrequency === freq ? "bg-[#3b82f6] text-white" : theme === "dark"
  ? "bg-white/5 text-gray-400"
  : "bg-gray-200 text-gray-700"
                      )}
                    >
                      {freq === "extra"
      ? "Extra"
      : freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="relative group">
                  <div className="space-y-3">
  {/* MONTO */}
  <div className="relative group">
    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
      $
    </span>

    <input 
      type="number"
      value={tempIncome}
      onChange={(e) => setTempIncome(e.target.value)}
      placeholder="0.00"
      min="0"
      step="0.01"
      className={`w-full rounded-xl pl-8 pr-4 py-3 text-lg font-bold outline-none transition-colors ${
  theme === "dark"
    ? "bg-white/5 border border-white/10 text-white"
    : "bg-gray-100 border border-gray-300 text-black"
}`}
    />
  </div>

  {/* DÍA DE PAGO */}
  <div>
    <label className="text-xs text-gray-400 font-bold">
      Día en que recibes el ingreso
    </label>

    <input
      type="number"
      min="1"
      max="31"
      value={paymentDay}
      onChange={(e) => setPaymentDay(Number(e.target.value))}
      className={`w-full mt-1 rounded-xl px-4 py-2 text-sm outline-none transition-colors ${
  theme === "dark"
    ? "bg-white/5 border border-white/10 text-white"
    : "bg-gray-100 border border-gray-300 text-black"
}`}
    />
  </div>

  {/* ERROR */}
  </div>
                  {incomeError && (
    <p className="text-red-400 text-xs mt-2">
      {incomeError}
    </p>
  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => setIsEditingIncome(false)}
                    className="flex-1 py-3 rounded-xl text-xs font-bold bg-white/5 text-gray-400 hover:bg-white/10 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSaveIncome}
                    className="flex-1 py-3 rounded-xl text-xs font-black bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    GUARDAR INGRESO
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <h2 className="text-3xl font-black text-white">
                    ${income.toLocaleString("es-ES")}
                  </h2>
                  <span className="text-xs text-gray-500 font-bold uppercase">{incomeFrequency}</span>
                </div>
                {income === 0 ? (
                  <p className="text-xs text-amber-400 font-medium animate-pulse">¡Configura tu ingreso para empezar a planificar!</p>
                ) : (
                  <p className="text-xs text-gray-500">Este es tu presupuesto base para planificar tus gastos.</p>
                )}
              </div>
            )}
          </motion.div>
          
<div className={`border rounded-2xl p-6 shadow-xl transition-colors ${
  theme === "dark"
    ? "bg-[#121212] border-white/5"
    : "bg-white border-gray-200"
}`}>
  <h3 className="text-lg font-bold mb-4">Historial de Ingresos</h3>

  {incomes.length === 0 ? (
    <p className="text-gray-500 text-sm">No hay ingresos registrados</p>
  ) : (
    <div className="space-y-3">
      {incomes.map((inc) => (
        <div
          key={inc.id}
          className="flex justify-between items-center bg-white/5 p-3 rounded-xl"
        >
          <div>
            <p className={`font-bold ${theme === "dark" ? "text-white" : "text-black"}`}>
              ${inc.amount.toLocaleString("es-ES")}
            </p>
            <p className="text-xs text-gray-400">
  {translateFrequency(inc.frequency)} • Día {inc.payment_day || 1}
</p>
            
          </div>

          <div className="text-xs text-gray-400">
            <button
  onClick={() => deleteIncome(inc.id)}
  className="text-red-400 text-xs hover:underline mt-1"
>
  Eliminar
</button>
          </div>
        </div>
      ))}
    </div>
  )}
</div>

          {/* Stats Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className={`border rounded-2xl p-6 shadow-xl transition-colors ${
  theme === "dark"
    ? "bg-[#121212] border-white/5"
    : "bg-white border-gray-200"
}`}
          >
            <div className="grid grid-cols-2 gap-4 divide-y divide-white/5">
              <div>
                <p className="text-gray-400 text-[10px] uppercase tracking-wider font-bold mb-1">Gastado</p>
                <p className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>${totalExpenses.toLocaleString("es-ES")}</p>
              </div>
            <div className="grid grid-cols-2 gap-2 text-xs border-t border-white/5 pt-3">
  <div className={`${theme === "dark" ? "bg-white/5" : "bg-gray-200"} rounded-lg p-2`}>
    <p className="text-gray-400">Fijos</p>
    <p className={`font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
      ${totalFixedExpenses.toLocaleString("es-ES")}
    </p>
  </div>
  <div className={`${theme === "dark" ? "bg-white/5" : "bg-gray-200"} rounded-lg p-2`}>
    <p className="text-gray-400">Variables</p>
    <p className={`font-bold ${theme === "dark" ? "text-white" : "text-black"}`}>
  ${totalVariableExpenses.toLocaleString("es-ES")}
</p>
  </div>
</div>
            
              <div className="text-right">
                <p className="text-gray-400 text-[10px] uppercase tracking-wider font-bold mb-1">Disponible</p>
                <p className={cn(
                  "text-xl font-bold",
                  balance >= 0 ? "text-emerald-400" : "text-rose-500"
                )}>
                  ${balance.toLocaleString("es-ES")}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
  
  <div className={`${theme === "dark" ? "bg-white/5" : "bg-gray-200"} rounded-lg p-2`}>
    <p className="text-gray-400">Disponible</p>
    <p className={cn(
      "font-bold",
      balance >= 0 ? "text-emerald-400" : "text-rose-500"
    )}>
      ${balance.toLocaleString("es-ES")}
    </p>
  </div>

  <div className={`${theme === "dark" ? "bg-white/5" : "bg-gray-200"} rounded-lg p-2`}>
    <p className="text-gray-400">Ahorro Opcional(20%) </p>
    <p className="text-blue-400 font-bold">
      ${(balance > 0 ? balance * 0.2 : 0).toLocaleString("es-ES")}
    </p>
  </div>

</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase">
                <span className="text-gray-500">Uso del presupuesto</span>
                <span className={cn(
                  spentPercentage > 90 ? "text-rose-500" : spentPercentage > 70 ? "text-amber-500" : "text-emerald-500"
                )}>
                  {spentPercentage.toFixed(1)}%
                </span>
              </div>
              <div
  className={cn(
    "p-4 rounded-xl text-sm font-medium leading-snug border border-white/10 shadow-lg shadow-black/20",
    alert.type === "danger" && "bg-rose-500/10 text-rose-400",
    alert.type === "warning" && "bg-amber-500/10 text-amber-400",
    alert.type === "success" && "bg-emerald-500/10 text-emerald-400",
    alert.type === "normal" && "bg-blue-500/10 text-blue-400",
    alert.type === "info" && "bg-gray-500/10 text-gray-400"
  )}
>
  {alert.message}
  {categoryAlert && (
  <div
    className={cn(
      "p-3 rounded-xl text-sm font-semibold mt-2",
      categoryAlert.type === "warning" && "bg-amber-500/10 text-amber-400",
      categoryAlert.type === "normal" && "bg-blue-500/10 text-blue-400"
    )}
  >
    {categoryAlert.message}
  </div>
)}

</div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${spentPercentage}%` }}
                  className={cn(
                    "h-full transition-colors duration-500",
                    spentPercentage > 90 ? "bg-rose-500" : spentPercentage > 70 ? "bg-amber-500" : "bg-emerald-500"
                  )}
                />
              </div>
            </div>
            
          </motion.div>

          {/* Add Expense Form */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className={`border rounded-2xl p-6 shadow-xl transition-colors ${
  theme === "dark"
    ? "bg-[#121212] border-white/5"
    : "bg-white border-gray-200"
}`}
          >
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#3b82f6]" />
              Nuevo Gasto
            </h3>
            <form onSubmit={addExpense} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-400 uppercase font-bold">Descripción</label>
                <input 
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej: Supermercado"
                  className={`w-full border rounded-xl px-4 py-3 outline-none transition-all ${
  theme === "dark"
    ? "bg-[#1a1a1a] border-white/10 text-white"
    : "bg-white border-gray-300 text-black"
}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 space-y-4 items-start">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 uppercase font-bold">Monto</label>
                  <input 
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className={`w-full border rounded-xl px-4 py-3 outline-none transition-all ${
  theme === "dark"
    ? "bg-[#1a1a1a] border-white/10 text-white"
    : "bg-white border-gray-300 text-black"
}`}
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 uppercase font-bold">Categoría</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className={`w-full border rounded-xl px-4 py-3 outline-none transition-all ${
  theme === "dark"
    ? "bg-[#1a1a1a] border-white/10 text-white"
    : "bg-white border-gray-300 text-black"
}`}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
              <div className="space-y-1">
  <label className="text-xs text-gray-400 uppercase font-bold">Frecuencia</label>
  <select 
    value={frequency}
    onChange={(e) => setFrequency(e.target.value as "once" | "monthly")}
    className={`w-full border rounded-xl px-4 py-3 outline-none transition-all ${
  theme === "dark"
    ? "bg-[#1a1a1a] border-white/10 text-white"
    : "bg-white border-gray-300 text-black"
}`}
  >
    <option value="once">Único</option>
    <option value="monthly">Mensual</option>
  </select>
</div>
                <label className="text-xs text-gray-400 uppercase font-bold">Fecha</label>
                <input 
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`w-full border rounded-xl px-4 py-3 outline-none transition-all ${
  theme === "dark"
    ? "bg-[#1a1a1a] border-white/10 text-white"
    : "bg-white border-gray-300 text-black"
}`}
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Registrar Gasto
              </button>
            </form>
          </motion.div>
        </div>

        {/* Right Column: List & Charts */}
        <div className="lg:col-span-8 space-y-8">
          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`border rounded-2xl p-6 shadow-xl transition-colors ${
  theme === "dark"
    ? "bg-[#121212] border-white/5"
    : "bg-white border-gray-200"
}`}
            >
              <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                <PieChartIcon className="w-4 h-4" /> Distribución
              </h3>
              <ResponsiveContainer width="100%" height="85%">
                <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
  <Pie
    data={categoryData}
    cx="50%"
    cy="50%"
    innerRadius={50}
    outerRadius={90}
    paddingAngle={3}
    dataKey="value"
  >
    {categoryData.map((entry, index) => (
      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
    ))}
  </Pie>

  <Tooltip
    formatter={(value: number, name: string) => [
      `$${value.toLocaleString("es-ES")}`,
      name
    ]}
    contentStyle={{
      backgroundColor: "#0f172a",
      border: "1px solid #1e293b",
      borderRadius: "10px"
    }}
    itemStyle={{ color: "#fff" }}
  />
</PieChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`border rounded-2xl p-6 shadow-xl transition-colors ${
  theme === "dark"
    ? "bg-[#121212] border-white/5"
    : "bg-white border-gray-200"
}`}
            >
              <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Historial
              </h3>
              <ResponsiveContainer width="100%" height="85%">
                <div className="text-center mt-2 text-xs text-gray-400">
  {categoryData.length > 0 && (
  <p className="text-sm text-gray-400 whitespace-nowrap overflow-hidden text-ellipsis">
    Mayor gasto:{" "}
    <span className="text-white font-bold">
      {
        categoryData.reduce((max, cat) =>
          cat.value > max.value ? cat : max
        ).name
      }
    </span>
  </p>
)}
</div>
                <BarChart
  data={lastExpenses}
  margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis
  dataKey="date"
  tickFormatter={(date) =>
    format(new Date(date), "dd MMM", { locale: es })
  }
  stroke="#888"
/>
                  <YAxis 
  tickFormatter={(value) => `$${value / 1000}k`}
  stroke="#888"
/>
                  <Tooltip
  formatter={(value: number) =>
    `$${value.toLocaleString("es-ES")}`
  }
  labelFormatter={(label) =>
    format(new Date(label), "dd MMM yyyy", { locale: es })
  }
  contentStyle={{
    backgroundColor: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "10px"
  }}
  itemStyle={{ color: "#fff" }}
/>
                  <Bar
  dataKey="amount"
  radius={[6, 6, 0, 0]}
  barSize={25}
>
  {lastExpenses.map((entry, index) => (
    <Cell
      key={`cell-${index}`}
      fill={
        entry.category === "Entretenimiento"
          ? "#ef4444"
          : entry.category === "Alimentación"
          ? "#f59e0b"
          : entry.category === "Vivienda"
          ? "#8b5cf6"
          : "#3b82f6"
      }
    />
  ))}
</Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Expense List */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`border rounded-2xl p-6 shadow-xl transition-colors ${
  theme === "dark"
    ? "bg-[#121212] border-white/5"
    : "bg-white border-gray-200"
}`}
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-bold">Últimos Movimientos</h3>
              
              <div className="flex items-center gap-2">
  <button
    onClick={exportToExcel}
    className="text-xs px-3 py-2 bg-green-500/20 text-green-400 rounded-lg"
  >
    Excel
  </button>

  <button
    onClick={exportToPDF}
    className="text-xs px-3 py-2 bg-red-500/20 text-red-400 rounded-lg"
  >
    PDF
  </button>
</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase bg-white/5">
                    <th className="px-6 py-4">Fecha</th>
                    <th className="px-6 py-4">Descripción</th>
                    <th className="px-6 py-4">Categoría</th>
                    <th className="px-6 py-4 text-right">Monto</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <AnimatePresence mode="popLayout">
                    {expenses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">
                          No hay gastos registrados aún.
                        </td>
                      </tr>
                    ) : (
                      expenses.map((exp) => (
                        <motion.tr 
                          key={exp.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="hover:bg-white/5 transition-colors group"
                        >
                          <td className="px-6 py-4 text-sm text-gray-400">
                            {format(new Date(exp.date), "dd MMM", { locale: es })}
                          </td>
                          <td className="px-6 py-4 font-medium">{exp.description}</td>
                          <td className="px-6 py-4">
                            <span className="text-xs px-2 py-1 rounded-full bg-white/5 border border-white/10">
                              {exp.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-white">
                            ${exp.amount.toLocaleString("es-ES")}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => deleteExpense(exp.id)}
                              className="p-2 text-gray-500 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}