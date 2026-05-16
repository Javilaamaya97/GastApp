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
import { signOut } from "../services/authService";
import { getProfile, upgradeToPremium } from "../services/profileService";

interface DashboardProps {
  onLogout: () => void;
}

const COLORS = ["#3b82f6", "#8b5cf6", "#d946ef", "#f43f5e", "#10b981", "#f59e0b"];
const parseLocalDate = (value?: string) => {
  if (!value || typeof value !== "string") {
    return new Date();
  }

  const parts = value.split("-");

  if (parts.length !== 3) {
    return new Date();
  }

  const [year, month, day] = parts.map(Number);

  return new Date(year, month - 1, day);
};

export default function Dashboard({ onLogout }: DashboardProps) {

  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [summary, setSummary] = useState({
  income: 0,
  expenses: 0,
  balance: 0,
});


// 👇 PEGA ESTO AQUÍ
const getQuincena = (dateStr: string) => {
  const d = parseLocalDate(dateStr);
  return d.getDate() <= 15 ? "first" : "second";
};
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
  const expandedExpenses = useMemo(() => {
  if (!expenses || expenses.length === 0) return [];

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  return expenses.filter((exp) => {
    const d = parseLocalDate(exp.paid_date || exp.date);

    return (
      d &&
      !isNaN(d.getTime()) &&
      d.getMonth() === currentMonth &&
      d.getFullYear() === currentYear
    );
  });
}, [expenses]);
if (expandedExpenses?.length > 0) {
  console.log("EXPANDED:", expandedExpenses[0]);
}
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [category, setCategory] = useState<Category>("Otros");
  const [frequency, setFrequency] = useState<"once" | "monthly">("once");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dueDate, setDueDate] = useState(format(new Date(), "yyyy-MM-dd"));
  
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
  const loadProfile = async () => {

  const data = await getProfile();

  setProfile(data);

};

loadProfile();
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
 const totalExpenses = expandedExpenses
  .filter(exp => exp.paid_date)
  .reduce((acc, exp) => acc + Math.round(Number(exp.amount) || 0), 0);



  const totalIncome = useMemo(() => {
  return incomes.reduce((acc, inc) => acc + Math.round(Number(inc.amount) || 0), 0);
}, [incomes]);
const monthlyIncome = useMemo(() => {
  return incomes.reduce((acc, inc) => {
    const amount = Math.round(Number(inc.amount) || 0);

    switch (inc.frequency) {
      case "mensual":
        return acc + amount;
      case "quincenal":
        return acc + amount * 2;
      case "semanal":
        return acc + amount * 4;
      case "diario":
        return acc + amount * 30;
      case "extra":
        return acc + amount;
      default:
        return acc + amount;
    }
  }, 0);
}, [incomes]);
const recurrentIncome = useMemo(() => {
  return incomes
    .filter(i => i.frequency !== "extra")
    .reduce((acc, inc) => {
      switch (inc.frequency) {
        case "mensual":
          return acc + inc.amount;
        case "quincenal":
          return acc + inc.amount * 2;
        case "semanal":
          return acc + inc.amount * 4;
        case "diario":
          return acc + inc.amount * 30;
        default:
          return acc + inc.amount;
      }
    }, 0);
}, [incomes]);
const incomeFirst = incomes
  .filter((i) => {
    const day =
      i.payment_day ||
      parseLocalDate(i.date).getDate();

    return day <= 15;
  })
  .reduce((sum, i) => {
    return sum + Math.round(Number(i.amount) || 0);
  }, 0);

const incomeSecond = incomes
  .filter((i) => {
    const day =
      i.payment_day ||
      parseLocalDate(i.date).getDate();

    return day > 15;
  })
  .reduce((sum, i) => {
    return sum + Math.round(Number(i.amount) || 0);
  }, 0);

const expenseFirst = expandedExpenses
  .filter(e => getQuincena(e.paid_date || e.date) === "first")
  .reduce((sum, e) => sum + e.amount, 0);

const expenseSecond = expandedExpenses
  .filter(e => getQuincena(e.paid_date || e.date) === "second")
  .reduce((sum, e) => sum + e.amount, 0);

const balance = monthlyIncome - totalExpenses;

  const fixedExpenses = expenses.filter(exp => exp.expense_type === "fixed");

const variableExpenses = expenses.filter(
  exp => exp.expense_type !== "fixed"
);

const totalFixedExpenses = fixedExpenses.reduce(
  (acc, exp) => acc + Math.round(Number(exp.amount) || 0),
  0
);
const pendingExpenses = expandedExpenses
  .filter(exp => !exp.paid_date)
  .reduce((acc, exp) => acc + Math.round(Number(exp.amount) || 0), 0);
const realBalance = monthlyIncome - pendingExpenses;
const totalVariableExpenses = variableExpenses.reduce(
  (acc, exp) => acc + Math.round(Number(exp.amount) || 0),
  0
);
//const realAvailable = monthlyIncome - totalFixedExpenses;
const today = new Date();

// 🔹 INGRESOS YA RECIBIDOS
const receivedIncome = incomes
  .filter((inc) => {
    const incomeDate = parseLocalDate(inc.date);
    return incomeDate <= today;
  })
  .reduce((acc, inc) => {
    return acc + Math.round(Number(inc.amount) || 0);
  }, 0);

// 🔹 GASTOS YA PAGADOS
const paidExpenses = expenses
  .filter((exp) => exp.paid_date)
  .reduce((acc, exp) => {
    return acc + Math.round(Number(exp.amount) || 0);
  }, 0);

// 🔹 DINERO RESERVADO PARA GASTOS FIJOS PENDIENTES
const currentDay = today.getDate();

// 🔹 SOLO RESERVAR GASTOS CERCANOS
const reservedMoney = expenses
  .filter((exp) => {
    // solo gastos fijos pendientes
    if (exp.expense_type !== "fixed") return false;
    if (exp.paid_date) return false;

    const due = parseLocalDate(
      exp.due_date || exp.date
    );

    const dueDay = due.getDate();

    // 🔥 lógica inteligente:
    // solo reservar gastos que vencen
    // antes del próximo ingreso

    if (currentDay <= 15) {
      return dueDay <= 15;
    }

    return dueDay > 15;
  })
  .reduce((acc, exp) => {
    return acc + Math.round(Number(exp.amount) || 0);
  }, 0);

// 🔹 DINERO REALMENTE DISPONIBLE HOY
const realAvailable =
  receivedIncome -
  paidExpenses -
  reservedMoney;

// 🔹 AHORRO RECOMENDADO
const recommendedSavings =
  realAvailable > 0
    ? realAvailable * 0.2
    : 0;

// 🔹 GASTO LIBRE
const immediateExpenses = expandedExpenses
  .filter((exp) => {
    if (exp.paid_date) return false;

    const due = parseLocalDate(
      exp.due_date || exp.date
    );

    const dueDay = due.getDate();

    // 🔹 solo gastos antes del próximo ingreso
    return dueDay <= 15;
  })
  .reduce((acc, exp) => {
    return acc + Math.round(Number(exp.amount) || 0);
  }, 0);

 // 🔹 DINERO RESERVADO REAL
const reservedToday = expenses
  .filter((exp) => {

    // ignorar pagados
    if (exp.paid_date) return false;

    // solo gastos fijos
    return exp.expense_type === "fixed";

  })
  .reduce((acc, exp) => {
    return acc + Math.round(Number(exp.amount) || 0);
  }, 0);
// 🔹 INGRESO PROYECTADO DEL MES
const projectedIncome =
  incomeFirst + incomeSecond;

// 🔹 INGRESOS EXTRA
const extraIncome = incomes
  .filter((inc) => inc.frequency === "extra")
  .reduce((acc, inc) => {
    return acc + Math.round(Number(inc.amount) || 0);
  }, 0);

// 🔹 LIQUIDEZ REAL HOY
const liquidIncome =
  (
    currentDay <= 15
      ? incomeFirst
      : incomeFirst + incomeSecond
  ) + extraIncome;

// 🔹 DINERO REALMENTE DISPONIBLE HOY
const liquidAvailable =
  liquidIncome
  - paidExpenses
  - reservedToday;

// 🔹 DISPONIBLE PROYECTADO DEL MES
const projectedAvailable =
  projectedIncome - totalFixedExpenses;

const monthlyProjection = useMemo(() => {
  if (monthlyIncome === 0) return null;

  const today = new Date();
  const day = today.getDate();

  // días del mes
  const daysInMonth = parseLocalDate(
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
}, [monthlyIncome, totalVariableExpenses, totalFixedExpenses]);
// 🔥 ANÁLISIS POR QUINCENAS
const quincenaAnalysis = useMemo(() => {
  if (incomes.length === 0) return null;

  
  const getQuincena = (dateStr: string) => {
    const d = parseLocalDate(dateStr);
    return d.getDate() <= 15 ? "first" : "second";
  };

  // 🔹 INGRESOS REALES
  let firstIncome = 0;
  let secondIncome = 0;

  incomes.forEach((inc) => {
    if (inc.frequency === "extra") return;
  const day = inc.payment_day || parseLocalDate(inc.date).getDate();

  // 🔹 PRIMER INGRESO
  if (day <= 15) {
    firstIncome += Math.round(Number(inc.amount) || 0);
  } else {
    secondIncome += Math.round(Number(inc.amount) || 0);
  }

  // 🔹 SEGUNDO INGRESO SI ES QUINCENAL
  if (inc.frequency === "quincenal") {
    const secondDay = day + 15 > 31 ? 30 : day + 15;

    if (secondDay <= 15) {
      firstIncome += inc.amount;
    } else {
      secondIncome += inc.amount;
    }
  }
});

  // 🔹 GASTOS VARIABLES (se quedan donde pasan)
  let firstVariable = 0;
  let secondVariable = 0;

  expenses
    .filter((e) => e.expense_type !== "fixed")
    .forEach((exp) => {
      const q = getQuincena(exp.paid_date);
      if (q === "first") firstVariable += Math.round(Number(exp.amount) || 0);
      else secondVariable += Math.round(Number(exp.amount) || 0);
    });

  // 🔹 GASTOS FIJOS SEGÚN FECHA REAL
let firstFixed = 0;
let secondFixed = 0;

expenses
  .filter((e) => e.expense_type === "fixed")
  .forEach((exp) => {

    const dueDay = parseLocalDate(
      exp.due_date || exp.date
    ).getDate();

    // 🔹 si vence antes o el 15
    if (dueDay <= 15) {
      firstFixed += Math.round(Number(exp.amount) || 0);
    }

    // 🔹 si vence después del 15
    else {
      secondFixed += Math.round(Number(exp.amount) || 0);
    }
  });

  // 🔹 BALANCES
 const firstBalance = Math.round(firstIncome - firstVariable - firstFixed);
const secondBalance = Math.round(secondIncome - secondVariable - secondFixed);

  return {
    firstHalfIncome: firstIncome,
    secondHalfIncome: secondIncome,

    firstHalfExpenses: firstVariable + firstFixed,
    secondHalfExpenses: secondVariable + secondFixed,

    firstBalance,
    secondBalance,
  };
}, [incomes, expenses]);

const criticalExpense = useMemo(() => {
  if (!quincenaAnalysis) return null;

  const sorted = expenses
    .filter(e => e.expense_type === "fixed")
    .sort((a, b) =>
      parseLocalDate(a.due_date || a.date).getDate() -
      parseLocalDate(b.due_date || b.date).getDate()
    );

  let runningBalance = 0;

  let firstIncome = 0;
  let secondIncome = 0;

  incomes.forEach(inc => {
    if (inc.frequency === "extra") return;

    const day = inc.payment_day || 1;

    if (day <= 15) firstIncome += inc.amount;
    else secondIncome += inc.amount;

    // 🔹 SI ES QUINCENAL
if (inc.frequency === "quincenal") {

  // ingreso actual
  if (day <= 15) {
    firstIncome += Math.round(Number(inc.amount) || 0);
    secondIncome += Math.round(Number(inc.amount) || 0);
  }

  else {
    secondIncome += Math.round(Number(inc.amount) || 0);
    firstIncome += Math.round(Number(inc.amount) || 0);
  }
}
  });

  runningBalance = firstIncome;

  for (let exp of sorted) {
    const expDay = parseLocalDate(exp.due_date || exp.date).getDate();

    if (expDay > 15 && runningBalance === firstIncome) {
      runningBalance = secondIncome;
    }

    if (runningBalance < exp.amount) {
      return exp;
    }

    runningBalance -= exp.amount;
  }

  return null;
}, [expenses, incomes, quincenaAnalysis]);
const savingPlan = useMemo(() => {
  if (!quincenaAnalysis) return null;

  const first = quincenaAnalysis.firstBalance;
  const second = quincenaAnalysis.secondBalance;

  if (second < 0) {
    const deficit = Math.abs(second);
    const canSave = Math.max(first, 0);
    const missing = deficit - canSave;

    return {
      type: "danger",
      title: `⚠️ El gasto "${criticalExpense?.description || "principal"}" genera un déficit de $${deficit.toLocaleString("es-ES")} en la segunda quincena.`,
      plan: `💡 Para cubrirlo:`,
      details: [
        `Guarda $${Math.round(canSave).toLocaleString("es-ES")} de la primera quincena`,
        missing > 0
          ? `Te faltarán $${Math.round(missing).toLocaleString("es-ES")} adicionales`
          : "Con eso cubres todo"
      ]
    };
  }

  if (first < 0) {
    return {
      type: "danger",
      title: "🚨 No tienes suficiente dinero en la primera quincena.",
      plan: "💡 Necesitas ingresos antes del día 15 o reducir gastos.",
      details: []
    };
  }
if (projectedAvailable < 0) {
  return {
    type: "warning",
    title: "⚠️ Necesitas ajustar gastos o aumentar ingresos para cerrar el mes sin déficit.",
    plan: null,
    details: []
  };
}
  return {
    type: "success",
    title: "🟢 Tus gastos están bien distribuidos.",
    plan: null,
    details: []
  };
}, [quincenaAnalysis, criticalExpense]);
const cashflowAlert = useMemo(() => {
  if (incomes.length === 0) return null;

  // 🔹 combinar eventos (ingresos + gastos)
  const events: { date: string; amount: number }[] = [];

  incomes.forEach((inc) => {
  const baseDate = inc.date || format(new Date(), "yyyy-MM-dd");

  events.push({
    date: baseDate,
    amount: inc.amount
  });

  if (inc.frequency === "quincenal") {
    const d = parseLocalDate(baseDate);

    if (!d || isNaN(d.getTime())) return;

    const second = new Date(d);
    second.setDate(d.getDate() + 15);

    events.push({
      date: format(second, "yyyy-MM-dd"),
      amount: inc.amount
    });
  }
});

  expenses.forEach((exp) => {
  events.push({
  date: exp.paid_date || exp.due_date || exp.date,
  amount: -exp.amount
});
});

  // 🔹 ordenar por fecha
  events.sort((a, b) =>
    parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime()
  );

  // 🔹 simular flujo
  let balance = 0;

  for (const e of events) {
    balance += e.amount;

    if (balance < 0) {
      const parsed = parseLocalDate(e.date);

if (!parsed || isNaN(parsed.getTime())) continue;

return {
  day: format(parsed, "dd MMM", { locale: es }),
  rawDate: e.date,
  deficit: Math.round(Math.abs(balance))
};

    }
  }

  return null;
}, [incomes, expenses]);

  const smartDistribution = useMemo(() => {
  if (incomes.length === 0 || expenses.length === 0) return [];

  // 🔹 Expandir ingresos (incluye quincenal)
  const expandedIncomes: any[] = [];

  incomes.forEach((inc) => {
    if (inc.frequency === "extra") return;

    const baseDay = inc.payment_day || 1;

    expandedIncomes.push({
      ...inc,
      effectiveDay: baseDay,
      remaining: Math.round(Number(inc.amount) || 0)
    });

    if (inc.frequency === "quincenal") {
      expandedIncomes.push({
        ...inc,
        effectiveDay: baseDay + 15 > 30 ? 30 : baseDay + 15,
        remaining: Math.round(Number(inc.amount) || 0)
      });
    }
  });

  // 🔹 Ordenar ingresos por día
  expandedIncomes.sort((a, b) => a.effectiveDay - b.effectiveDay);

  // 🔹 Gastos fijos ordenados por fecha
  const fixedExpenses = expenses
    .filter(e => e.expense_type === "fixed")
    .sort((a, b) =>
      parseLocalDate(a.due_date || a.date).getDate() -
      parseLocalDate(b.due_date || b.date).getDate()
    );

  const distribution: any[] = [];

  // 🔹 Asignación inteligente
  fixedExpenses.forEach((exp) => {
    let remainingExpense = Math.round(Number(exp.amount) || 0);
const expDay = parseLocalDate(exp.due_date || exp.date).getDate();

const validIncomes = expandedIncomes
  .filter(inc => inc.effectiveDay <= expDay)
  .sort((a, b) => b.effectiveDay - a.effectiveDay); // 👈 clave
    let totalAvailable = 0;

for (let inc of validIncomes) {
  totalAvailable += inc.remaining;
}

if (totalAvailable >= remainingExpense) {
  // 🔥 asignar TODO al último ingreso disponible
  // 🔹 DIVIDIR ENTRE MÚLTIPLES INGRESOS
for (let inc of validIncomes) {

  if (remainingExpense <= 0) break;

  if (inc.remaining <= 0) continue;

  const usedAmount = Math.min(
    inc.remaining,
    remainingExpense
  );

  distribution.push({
    incomeDay: inc.effectiveDay,
    expense: exp.description,
    amount: Math.round(usedAmount)
  });

  inc.remaining -= usedAmount;
  remainingExpense -= usedAmount;
}
}
  });

  const grouped: any = {};

  distribution.forEach(item => {
    const key = item.incomeDay + "-" + item.expense;

    if (!grouped[key]) {
      grouped[key] = { ...item };
    } else {
      grouped[key].amount = Math.round(grouped[key].amount + item.amount);
    }
  });

  const finalDistribution = Object.values(grouped);

// 🔹 ETIQUETA DE COBERTURA
finalDistribution.forEach((item: any) => {

  if (item.incomeDay <= 15) {
    item.coveredBy = "Primera quincena";
  }

  else {
    item.coveredBy = "Segunda quincena";
  }
});

return finalDistribution;
}, [incomes, expenses]);
const paymentRisk = useMemo(() => {
  // 🔹 solo evaluar si hay gastos fijos pendientes
const pendingFixedExpenses = expenses.filter(
  e =>
    e.expense_type === "fixed" &&
    !e.paid_date
);

if (pendingFixedExpenses.length === 0) {
  return null;
}
  if (incomes.length === 0 || expenses.length === 0) return null;

  const incomeMap: Record<number, number> = {};

  incomes.forEach((inc) => {
    if (inc.frequency === "extra") return;

    const day = inc.payment_day || 1;

    incomeMap[day] = (incomeMap[day] || 0) + Math.round(Number(inc.amount) || 0);

    if (inc.frequency === "quincenal") {
      const secondDay = day + 15 > 30 ? 30 : day + 15;
     incomeMap[secondDay] = (incomeMap[secondDay] || 0) + Math.round(Number(inc.amount) || 0);
    }
  });

  const incomeDays = Object.keys(incomeMap)
    .map(Number)
    .sort((a, b) => a - b);

  const sortedExpenses = expenses
    .filter(e => e.expense_type === "fixed")
    .sort((a, b) =>
      parseLocalDate(a.due_date || a.date).getDate() -
      parseLocalDate(b.due_date || b.date).getDate()
    );

  let available = 0;

  for (let exp of sortedExpenses) {
    const expDay = parseLocalDate(exp.due_date || exp.date).getDate();

    incomeDays.forEach(day => {
      if (day <= expDay) {
        available += incomeMap[day];
        delete incomeMap[day];
      }
    });

   if (available < Math.round(Number(exp.amount) || 0)) {
      return {
        type: "danger",
        message: `🚨 No puedes pagar ${exp.description} antes del día ${expDay}`
      };
    }

   available -= Math.round(Number(exp.amount) || 0);
  }

  return null;
}, [incomes, expenses]);

  const spentPercentage = useMemo(() => {
    if (monthlyIncome === 0) return 0;
return Math.min((totalExpenses / monthlyIncome) * 100, 100);
  }, [totalIncome, totalExpenses]);

 const alert = useMemo(() => {

  // 🔹 SIN INGRESOS
  if (monthlyIncome === 0) {
    return {
      type: "info",
      message: "Configura tu ingreso"
    };
  }

  // 🔥 ALERTA POR QUINCENAS (PRIORIDAD ALTA)
  if (quincenaAnalysis) {
    const { firstBalance, secondBalance } = quincenaAnalysis;

    if (firstBalance < 0) {
      return {
        type: "danger",
        message: `🚨 En la primera quincena te faltan $${Math.abs(Math.round(firstBalance)).toLocaleString("es-ES")}`
      };
    }
  }
  
if (liquidAvailable <= 0) {
  // 🔥 VALIDAR SI LOS GASTOS FIJOS SUPERAN INGRESOS DISPONIBLES
if (smartDistribution.length > 0) {
  const totalToReserve = smartDistribution.reduce(
    (acc, item) => acc + item.amount,
    0
  );

  if (totalToReserve > monthlyIncome) {
    return {
      type: "danger",
      message: "🚨 Tus gastos fijos superan tus ingresos. Vas a entrar en déficit."
    };
  }
}
  return {
    type: "danger",
    message: "🚨 Ya no deberías hacer más gastos variables este mes."
  };
}
  if (monthlyIncome - totalExpenses < 0) {
    return {
      type: "danger",
      message: "🚨 Estás en sobregiro"
    };
  }

  if (totalFixedExpenses > monthlyIncome * 0.7) {
    return {
      type: "danger",
      message: "🚨 Tus gastos fijos superan el 70% de tu ingreso"
    };
  }

   return {
  type:
    projectedAvailable < 0
      ? "danger"
      : projectedAvailable < 200000
      ? "warning"
      : "success",

  message:
    projectedAvailable < 0
      ? `💸 Tu proyección para el final del mes es de -$${Math.abs(projectedAvailable).toLocaleString("es-ES")}`
      : `✅ Tu proyección para el final del mes es de $${projectedAvailable.toLocaleString("es-ES")}`
};
}, [monthlyIncome, pendingExpenses, totalFixedExpenses]);

  const categoryData = useMemo(() => {
    const data = CATEGORIES.map(cat => {
      const total = expenses
        .filter(exp => exp.category === cat)
        .reduce((sum, exp) => sum + exp.amount, 0);
      return { name: cat, value: total };
    }).filter(item => item.value > 0);
    return data;
  }, [expenses]);
  const lastExpenses = expandedExpenses.slice(0, 7).reverse();
  console.log("LAST EXPENSES:", lastExpenses);
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

  if (liquidAvailable <= 0) {
  return {
    type: "danger",
    message:
      "🚨 Ya no tienes dinero disponible en esta quincena."
  };
}

  return null;
}, [income, spentPercentage, realAvailable]);

  const addExpense = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!description || !amount) return;

// 🔥 NUEVA VALIDACIÓN INTELIGENTE
if (!date && !dueDate) {
  alert("Debes ingresar fecha del gasto o fecha límite");
  return;
}

  const today = new Date();
  const paid = date ? parseLocalDate(date) : null;

 if (paid && paid > today) {
  alert("No puedes registrar un gasto en el futuro");
  return;
}

  if (Number(amount) > balance) {
    const confirmOverdraft = confirm(
      "⚠️ Este gasto te dejará en negativo. ¿Deseas continuar?"
    );
    if (!confirmOverdraft) return;
  }

  const newExpense = {
  type: "expense",
  expense_type: frequency === "monthly" ? "fixed" : "variable",
  amount: Number(amount),
  description,
  category,

  // 🔥 clave
  date: format(
  parseLocalDate(date || dueDate),
  "yyyy-MM-dd"
),
 paid_date: isPaid
  ? format(new Date(), "yyyy-MM-dd")
  : null,
  due_date: dueDate || date
};
  await addTransaction(newExpense);
  await refreshData();

  setDescription("");
  setAmount("");
};
  const deleteExpense = async (id: string) => {
  await deleteTransaction(id);
  await refreshData();
};
const deleteIncome = async (id: string) => {
  await deleteTransaction(id);
  await refreshData();
};
const markAsPaid = async (expense: any) => {

  const { error } = await supabase
    .from("transactions")
    .update({
      paid_date: format(new Date(), "yyyy-MM-dd")
    })
    .eq("id", expense.id);

  if (error) {
    console.error(error);
    return;
  }

  await refreshData();
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
    parseLocalDate(e.date).toLocaleDateString(),
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
      ["Ingreso", `$${monthlyIncome.toLocaleString("es-ES")}`],
      ["Total Gastado", `$${totalExpenses}`],
      ["Balance", `$${balance}`],
      ["Gastos Fijos", `$${totalFixedExpenses}`],
      ["Gastos Variables", `$${totalVariableExpenses}`],
      ["% Gastado", `${spentPercentage.toFixed(1)}%`]
    ]
  });

  // 📋 TABLA DE GASTOS
  const tableData = expenses.map((exp) => [
  parseLocalDate(exp.date).toLocaleDateString(),
  exp.description,
  exp.category,
  exp.expense_type === "fixed" ? "Fijo" : "Variable",
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
    type: "income",
    amount: val,
    date: new Date().toISOString(),
    description: `Ingreso ${incomeFrequency}`,
    frequency: incomeFrequency,
    payment_day: incomeFrequency === "extra" ? null : paymentDay
  };

  await addTransaction(newIncome); // 👈 SIN user_id NI id

  await refreshData();

  setIsEditingIncome(false);
  setTempIncome("");
};

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${
  theme === "dark"
    ? "bg-[#0a0a0a] text-white"
    : "bg-gray-100 text-gray-900"
}`}>
      {/* Navbar */}
      <nav className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
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
  className="mr-4 text-sm px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
>
  {theme === "dark" ? "🌞 Claro" : "🌙 Oscuro"}
</button>
          <button 
            onClick={async () => {
  await signOut();
  onLogout();
}}
            className="flex items-center gap-2 p-2 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {profile?.plan === "premium" ? (

  <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/20">

    <p className="text-amber-400 font-bold text-lg">
      👑 Plan Premium Activo
    </p>

    <p className="text-sm text-gray-300 mt-1">
      Acceso a funciones avanzadas de análisis financiero.
    </p>

  </div>

) : (

  <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10">

    <p className="text-white font-bold text-lg">
      🔒 Plan Free
    </p>

    <p className="text-sm text-gray-400 mt-1">
      Actualiza a Premium para desbloquear análisis inteligentes avanzados.
    </p>

    <button
  onClick={async () => {

    await upgradeToPremium();

    const updatedProfile = await getProfile();

    setProfile(updatedProfile);

  }}
  className="mt-4 bg-amber-500 hover:bg-amber-400 text-black font-bold px-5 py-2 rounded-xl transition-all"
>
  Mejorar a Premium
</button>

  </div>

)}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
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
              <p className="text-gray-400 text-sm uppercase tracking-wider font-bold">
                {income === 0 ? "Configura tu Ingreso" : "Configuración de Ingreso"}
              </p>
              {!isEditingIncome && (
                <button 
                  onClick={() => {
                    setTempIncome(income.toString());
                    setIsEditingIncome(true);
                  }}
                  className="text-[#3b82f6] text-sm font-bold hover:underline"
                >
                  Editar
                </button>
              )}
            </div>

            {isEditingIncome ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-2">
                  {(["diario", "semanal", "quincenal", "mensual", "extra"] as const).map((freq) => (
                    <button 
                      key={freq}
                      onClick={() => setIncomeFrequency(freq)}
                      className={cn(
                        "py-2 rounded-lg text-sm font-bold transition-all",
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
  {incomeFrequency !== "extra" && (
  <div>
    <label className="text-sm text-gray-400 font-bold">
      Día en que recibes el ingreso
    </label>

    <input
      type="number"
      min="1"
      max="31"
      value={paymentDay}
      onChange={(e) => setPaymentDay(Number(e.target.value))}
      className="..."
    />
  </div>
)}
  {/* ERROR */}
  </div>
                  {incomeError && (
    <p className="text-red-400 text-sm mt-2">
      {incomeError}
    </p>
  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => setIsEditingIncome(false)}
                    className="flex-1 py-3 rounded-xl text-sm font-bold bg-white/5 text-gray-400 hover:bg-white/10 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSaveIncome}
                    className="flex-1 py-3 rounded-xl text-sm font-black bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    GUARDAR INGRESO
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <h2 className={`text-3xl font-black ${
  theme === "dark" ? "text-white" : "text-gray-900"
}`}>
  ${monthlyIncome.toLocaleString("es-ES")}
</h2>

<span className="text-sm text-gray-500 font-bold uppercase">
  mensual
</span>

<p className="text-sm text-gray-400">
  Equivale a $
  {recurrentIncome.toLocaleString("es-ES")}
  {" "}en ingresos recurrentes
</p>
                </div>
                {income === 0 ? (
                  <p className="text-sm text-amber-400 font-medium animate-pulse">¡Configura tu ingreso para empezar a planificar!</p>
                ) : (
                  <p className="text-sm text-gray-500">Este es tu presupuesto base para planificar tus gastos.</p>
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
          className="flex justify-between items-center bg-white/5 p-4 rounded-xl"
        >
          <div>
            <p className={`font-bold ${theme === "dark" ? "text-white" : "text-black"}`}>
              ${inc.amount.toLocaleString("es-ES")}
            </p>
            <p className="text-sm text-gray-400">
  {translateFrequency(inc.frequency)} • Día {inc.payment_day || 1}
</p>
            
          </div>

          <div className="text-sm text-gray-400">
            <button
  onClick={() => deleteIncome(inc.id)}
  className="text-red-400 text-sm hover:underline mt-1"
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
                <p className="text-gray-400 text-sm uppercase tracking-wider font-bold mb-1">Gastado</p>
                <p className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>${totalExpenses.toLocaleString("es-ES")}</p>
              </div>
            <div className="grid grid-cols-2 gap-2 text-sm border-t border-white/5 pt-3">
  <div className={`${theme === "dark" ? "bg-white/5" : "bg-gray-200"} rounded-lg p-2`}>
    <p className="text-gray-400">Fijos</p>
   {pendingExpenses > 0 && (
  <>
    <p className="text-gray-400">Pendientes</p>
    <p className="font-bold text-amber-400">
      ${Math.round(pendingExpenses).toLocaleString("es-ES")}
    </p>
  </>
)}
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
                <p className="text-gray-400 text-sm uppercase tracking-wider font-bold mb-1">Disponible hoy</p>
                <p className={cn(
                  "text-xl font-bold",
                  balance >= 0 ? "text-emerald-400" : "text-rose-500"
                )}>
                  ${liquidAvailable.toLocaleString("es-ES")}
                  <p className="text-sm text-yellow-400 mt-1">
  Reservado: $
  {reservedToday.toLocaleString("es-ES")}
</p>
                </p>
                <div className="mt-3 text-sm">

  <div className={`${theme === "dark" ? "bg-white/5" : "bg-gray-200"} rounded-lg p-2`}>
    <p className="text-gray-400">Ahorro Opcional (20%)</p>
    <p className="text-blue-400 font-bold">
      ${(balance > 0 ? balance * 0.2 : 0).toLocaleString("es-ES")}
    </p>
  </div>

</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-bold uppercase">
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
                <label className="text-sm text-gray-400 uppercase font-bold">Descripción</label>
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
              <div className="grid grid-cols-2 gap-4 items-start">
                <div className="space-y-1">
                  <label className="text-sm text-gray-400 uppercase font-bold">Monto</label>
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
                  <label className="text-sm text-gray-400 uppercase font-bold">Categoría</label>
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
              <div className="space-y-3">

  {/* FRECUENCIA */}
  <div className="space-y-1">
    <label className="text-sm text-gray-400 uppercase font-bold">Frecuencia</label>
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

  {/* FECHA DEL GASTO */}
<div className="space-y-1">
  <label className="text-sm text-gray-400 uppercase font-bold">
    Fecha del gasto
  </label>

  <input 
    type="date"
    value={date}
    onChange={(e) => setDate(e.target.value)}
    className={`w-full border rounded-xl px-4 py-3 ${
      theme === "dark"
        ? "bg-[#1a1a1a] border-white/10 text-white"
        : "bg-white border-gray-300 text-black"
    }`}
  />
</div>

{/* FECHA LÍMITE */}
<div className="space-y-1">
  <label className="text-sm text-gray-400 uppercase font-bold">
    Fecha límite de pago
  </label>

  <input 
    type="date"
    value={dueDate}
    onChange={(e) => setDueDate(e.target.value)}
    className={`w-full border rounded-xl px-4 py-3 ${
      theme === "dark"
        ? "bg-[#1a1a1a] border-white/10 text-white"
        : "bg-white border-gray-300 text-black"
    }`}
  />
</div>
</div>
<div className="flex items-center gap-2">
  <input
    type="checkbox"
    checked={isPaid}
    onChange={(e) => setIsPaid(e.target.checked)}
  />
  <label className="text-sm text-gray-400">
    Ya pagué este gasto
  </label>
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

        
       {/* RIGHT COLUMN */}
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
              <div className="w-full h-[300px]">
  <ResponsiveContainer width="100%" height="100%">
    
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
          <Cell
            key={`cell-${index}`}
            fill={COLORS[index % COLORS.length]}
          />
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
</div>
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
              <div className="w-full h-[300px]">
  <ResponsiveContainer width="100%" height="100%">
                                <BarChart
 data={expenses
  .map(e => ({
    ...e,
    displayDate: e.paid_date || e.due_date || e.date
  }))
  .slice(0, 7)
  .reverse()
}
>
                  <CartesianGrid 
  strokeDasharray="3 3" 
  stroke={theme === "dark" ? "#333" : "#ccc"} 
  vertical={false} 
/>
                 <XAxis dataKey="displayDate"
  tickFormatter={(date) => {
  const d = parseLocalDate(date);

  if (!d || isNaN(d.getTime())) return "";

  return format(d, "dd MMM", { locale: es });
}}
  stroke={theme === "dark" ? "#888" : "#374151"}
/>
                  <YAxis 
  tickFormatter={(value) => 
  `$${value.toLocaleString("es-ES")}`
}
  stroke={theme === "dark" ? "#888" : "#374151"}
/>
                  <Tooltip
  formatter={(value: number) =>
    `$${value.toLocaleString("es-ES")}`
  }
  labelFormatter={(label) => {
  const d = parseLocalDate(label);

  if (!d || isNaN(d.getTime())) return "";

  return format(d, "dd MMM yyyy", { locale: es });
}}
 contentStyle={{
  backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
  border: theme === "dark" ? "1px solid #1e293b" : "1px solid #e5e7eb",
  borderRadius: "10px"
}}
itemStyle={{ color: theme === "dark" ? "#fff" : "#000" }}
labelStyle={{ color: theme === "dark" ? "#fff" : "#000" }}
/>
                 <Bar
  dataKey="amount"
  radius={[6, 6, 0, 0]}
  barSize={25}
>
  {expenses
    .slice(0, 7)
    .reverse()
    .map((entry, index) => (
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
              </div>
            </motion.div>
          </div>
{/* 🧠 ASISTENTE FINANCIERO */}

{paymentRisk && (
  <div className="mt-3 p-3 rounded-xl bg-red-500/10 text-red-400 text-sm font-semibold">
    {paymentRisk.message}
  </div>
)}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  className={`border rounded-2xl p-6 shadow-xl transition-colors ${
    theme === "dark"
      ? "bg-[#121212] border-white/5"
      : "bg-white border-gray-200"
  }`}
>
 <h3 className={`text-lg font-bold mb-4 ${
  theme === "dark" ? "text-white" : "text-gray-900"
}`}>
  🧠 Asistente Financiero
</h3>

  {!smartDistribution || smartDistribution.length === 0 ? (
    <p className="text-sm text-gray-400">
      Agrega ingresos y gastos fijos para ver recomendaciones inteligentes.
    </p>
  ) : (
    <div className="space-y-4">

      {/* 🔹 DISTRIBUCIÓN DE GASTOS */}
      <div>
        <p className="text-sm uppercase text-gray-400 font-bold mb-2">
          Distribución de gastos fijos
        </p>
        

        {smartDistribution.map((item, i) => (
          <div
            key={i}
            className={`flex justify-between items-center p-3 rounded-xl ${
              theme === "dark" ? "bg-white/5" : "bg-gray-100"
            }`}
          >
            <div className="text-sm">
              <p className="font-bold">
                Día {item.incomeDay}
              </p>
              <p className="text-sm text-gray-400">
                {item.expense}
              </p>
              <p className="text-sm text-blue-400">
  {item.coveredBy}
</p>
            </div>

            <p className="font-bold text-blue-400">
              ${item.amount.toLocaleString("es-ES")}
            </p>
          </div>
        ))}
      </div>

      {/* 🔹 BALANCE POR QUINCENA */}
      {quincenaAnalysis && (
        <div>
          <p className="text-sm uppercase text-gray-400 font-bold mb-2">
            Estado por quincena
          </p>

          <div className="grid grid-cols-2 gap-3">

            <div className={`p-3 rounded-xl ${
              theme === "dark" ? "bg-white/5" : "bg-gray-100"
            }`}>
              <p className="text-sm text-gray-400">Primera quincena</p>
              <p className={`font-bold ${
                quincenaAnalysis.firstBalance >= 0
                  ? "text-emerald-400"
                  : "text-rose-500"
              }`}>
                ${quincenaAnalysis.firstBalance.toLocaleString("es-ES")}
              </p>
            </div>

            <div className={`p-3 rounded-xl ${
              theme === "dark" ? "bg-white/5" : "bg-gray-100"
            }`}>
              <p className="text-sm text-gray-400">Segunda quincena</p>
              <p className={`font-bold ${
                quincenaAnalysis.secondBalance >= 0
                  ? "text-emerald-400"
                  : "text-rose-500"
              }`}>
                ${quincenaAnalysis.secondBalance.toLocaleString("es-ES")}
              </p>
            </div>

          </div>
        </div>
      )}

      {/* 🔹 RECOMENDACIÓN INTELIGENTE */}
      
      {quincenaAnalysis && (
        <div className={`p-4 rounded-xl ${
          theme === "dark"
            ? "bg-blue-500/10 text-blue-400"
            : "bg-blue-100 text-blue-700"
        }`}>
          {quincenaAnalysis.firstBalance < 0 && (
            <p>
              ⚠️ Estás gastando más de lo que recibes en la primera quincena. 
              Intenta cubrir gastos grandes con el segundo ingreso.
            </p>
          )}


          {!cashflowAlert &&
 quincenaAnalysis.firstBalance >= 0 &&
 quincenaAnalysis.secondBalance >= 0 &&
 projectedAvailable >= 0 && (
  <p>
    ✅ Vas bien distribuido. Puedes ahorrar o gastar con tranquilidad.
  </p>
)}


          {/* 🔥 ALERTA DE FLUJO */}
{cashflowAlert && (
  <div className="mt-3 p-3 rounded-xl bg-rose-500/10 text-rose-400 text-sm font-semibold">
    ⚠️ Te quedarías sin dinero el día {cashflowAlert.day}. <br />

    💸 Te faltan ${cashflowAlert.deficit.toLocaleString("es-ES")} <br />

    💡 Recomendación:
    <ul className="mt-2 list-disc ml-4 text-sm">
      <li>Reduce gastos variables</li>
      <li>O mueve gastos a después del día {cashflowAlert.day}</li>
      <li>O agrega un ingreso extra antes de esa fecha</li>
    </ul>
       </div>
      )}
      {savingPlan && (
  <div
    className={`mt-3 p-5 rounded-xl border ${
      savingPlan.type === "danger"
        ? theme === "dark"
          ? "bg-rose-500/10 border-rose-500/20"
          : "bg-rose-100 border-rose-300"
        : theme === "dark"
        ? "bg-emerald-500/10 border-emerald-500/20"
        : "bg-emerald-100 border-emerald-300"
    }`}
  >

    {/* 🔴 TITULO */}
    <p
      className={`text-sm font-bold ${
        savingPlan.type === "danger"
          ? theme === "dark"
            ? "text-rose-400"
            : "text-rose-700"
          : theme === "dark"
          ? "text-emerald-400"
          : "text-emerald-700"
      }`}
    >
      {savingPlan.title}
    </p>

    {/* 💡 PLAN */}
    {savingPlan.plan && (
      <p
        className={`mt-3 text-sm font-semibold ${
          theme === "dark" ? "text-white" : "text-gray-900"
        }`}
      >
        {savingPlan.plan}
      </p>
    )}

    {/* 📊 DETALLES */}
    <div className="mt-2 space-y-1">
      {savingPlan.details?.map((d, i) => (
        <p
          key={i}
          className={`text-sm ${
            theme === "dark" ? "text-gray-300" : "text-gray-700"
          }`}
        >
          • {d}
        </p>
      ))}
    </div>

  </div>
)}
        </div>
      )}

    </div>
  )}
</motion.div>
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
    className="text-sm px-3 py-2 bg-green-500/20 text-green-400 rounded-lg"
  >
    Excel
  </button>

  <button
    onClick={exportToPDF}
    className="text-sm px-3 py-2 bg-red-500/20 text-red-400 rounded-lg"
  >
    PDF
  </button>
</div>
            </div>
            <div className="overflow-x-auto rounded-xl">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-sm text-gray-400 uppercase bg-white/5">
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
                      expenses.map((exp) => {

  console.log(exp);

  return (
    <motion.tr 
      key={exp.id}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="hover:bg-white/5 transition-colors group"
    >

      <td className="px-6 py-4 text-sm text-gray-400">
        {(() => {
          const d = new Date(exp.date);

if (isNaN(d.getTime())) return "—";

return format(d, "dd MMM", { locale: es });
        })()}
      </td>

      <td className="px-6 py-4 font-medium">
        {exp.description}
      </td>

      <td className="px-6 py-4">
        <span className="text-sm px-2 py-1 rounded-full bg-white/5 border border-white/10">
          {exp.category}
        </span>
      </td>

      <td className={`px-6 py-4 text-right font-bold ${
        theme === "dark"
          ? "text-white"
          : "text-black"
      }`}>
        ${exp.amount.toLocaleString("es-ES")}
      </td>

      <td className="px-6 py-4 text-right">

        {!exp.paid_date && !exp.is_paid && (
          <button
            onClick={() => markAsPaid(exp)}
            className="text-emerald-400 text-sm mr-3 hover:underline"
          >
            Pagar
          </button>
        )}

        {(exp.paid_date || exp.is_paid) && (
          <span className="text-emerald-400 text-sm mr-3">
            ✅ Pagado
          </span>
        )}

        <button 
          onClick={() => deleteExpense(exp.id)}
          className="p-2 text-gray-500 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-4 h-4" />
        </button>

      </td>

    </motion.tr>
  );
})
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
        </div>
      </main>
    </div>
  );
}