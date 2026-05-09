import { getDb, demoDataTemplates, accounts, transactions, budgets, bills } from "../db";
import { eq } from "drizzle-orm";

export interface DemoDataTemplate {
  scope: "quick" | "standard" | "complete";
  durationDays: number;
  transactionCount: number;
  templateData: {
    accounts: Array<{
      name: string;
      type: string;
      balance: number;
      currency: string;
      icon: string;
      color: string;
    }>;
    transactions: Array<{
      day: number;
      description: string;
      amount: number;
      type: string;
      category: string;
      account: string;
    }>;
    budgets: Array<{
      category: string;
      amount: number;
      month: number;
      year: number;
    }>;
    bills: Array<{
      name: string;
      amount: number;
      dueDate: number;
    }>;
    goals?: Array<any>;
    recurring?: Array<any>;
  };
}

export async function getTemplateByScope(scope: "quick" | "standard" | "complete"): Promise<DemoDataTemplate | null> {
  const db = getDb();
  
  const template = await db
    .select()
    .from(demoDataTemplates)
    .where(eq(demoDataTemplates.scope, scope))
    .limit(1);

  if (!template || template.length === 0) {
    return null;
  }

  return {
    scope: template[0].scope as "quick" | "standard" | "complete",
    durationDays: template[0].durationDays,
    transactionCount: template[0].transactionCount,
    templateData: JSON.parse(template[0].templateData),
  };
}

export async function applyDemoData(userId: number, scope: "quick" | "standard" | "complete"): Promise<void> {
  const db = getDb();
  const template = await getTemplateByScope(scope);

  if (!template) {
    throw new Error(`Template not found for scope: ${scope}`);
  }

  const { templateData } = template;
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - template.durationDays);

  // Insert accounts
  const accountMap = new Map<string, number>();
  for (const acc of templateData.accounts) {
    const [inserted] = await db
      .insert(accounts)
      .values({
        userId,
        name: acc.name,
        type: acc.type,
        balance: acc.balance,
        currency: acc.currency,
        icon: acc.icon,
        color: acc.color,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: accounts.id });
    
    accountMap.set(acc.name, inserted.id);
  }

  // Insert transactions
  for (const txn of templateData.transactions) {
    const accountId = accountMap.get(txn.account);
    if (!accountId) continue;

    const txnDate = new Date(startDate);
    txnDate.setDate(txnDate.getDate() + txn.day - 1);

    await db.insert(transactions).values({
      userId,
      accountId,
      amount: txn.amount,
      description: txn.description,
      category: txn.category,
      type: txn.type,
      date: txnDate,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Insert budgets
  for (const budget of templateData.budgets) {
    await db.insert(budgets).values({
      userId,
      category: budget.category,
      amount: budget.amount,
      month: budget.month,
      year: budget.year,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Insert bills
  for (const bill of templateData.bills) {
    await db.insert(bills).values({
      userId,
      name: bill.name,
      amount: bill.amount,
      dueDate: bill.dueDate,
      isPaid: false,
      createdAt: now,
      updatedAt: now,
    });
  }
}
