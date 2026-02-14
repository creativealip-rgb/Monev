import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
    getMonthlyStats, getGoals, getBudgets, getTransactions, getTransactionById, getCategories,
    createTransaction, updateTransaction, deleteTransaction,
    createBudget, updateBudget, deleteBudget,
    createGoal, updateGoal, removeGoal,
    getInvestments, getInvestmentById, createInvestment, updateInvestment, deleteInvestment,
    getBills, getBillById, createBill, updateBill, deleteBill, toggleBillPaid
} from "@/backend/db/operations";
import { askFinanceAgent } from "@/lib/ai";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(session.user.id);

        const { message, history } = await req.json();

        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        // Fetch context data (current month)
        const now = new Date();
        const stats = await getMonthlyStats(userId, now.getFullYear(), now.getMonth() + 1);
        const allGoals = await getGoals(userId);
        const allBudgets = await getBudgets(userId, now.getMonth() + 1, now.getFullYear());
        const rawTransactions = await getTransactions(userId, 30);
        const allCategories = await getCategories(); // Categories are global
        const allInvestments = await getInvestments(userId);
        const allBills = await getBills(userId);

        const goalsContext = allGoals.map(g => ({
            id: g.id,
            name: g.name,
            targetAmount: g.targetAmount,
            currentAmount: g.currentAmount,
            remaining: g.targetAmount - g.currentAmount,
            percent: (g.currentAmount / g.targetAmount) * 100
        }));

        const budgetsContext = allBudgets.map((b: any) => ({
            id: b.id,
            category: b.category.name,
            limit: b.amount,
            spent: b.spent,
            remaining: Math.max(0, b.amount - b.spent),
            percent: (b.spent / b.amount) * 100
        }));

        const transactionsContext = rawTransactions.map((t: any) => {
            try {
                return {
                    id: t.id,
                    date: t.date instanceof Date ? t.date.toISOString() : new Date(t.date).toISOString(),
                    amount: t.amount,
                    description: t.description || "Tanpa Deskripsi",
                    category: allCategories.find(c => c.id === t.categoryId)?.name || "Lainnya",
                    type: t.type as "expense" | "income"
                };
            } catch (e) {
                console.error("Error mapping transaction context:", e, t);
                return null;
            }
        }).filter(Boolean) as any[];

        // Get AI response
        const aiResponse = await askFinanceAgent(message, {
            monthlyStats: stats,
            goals: goalsContext,
            budgets: budgetsContext,
            transactions: transactionsContext,
            investments: allInvestments.map(i => ({
                id: i.id,
                name: i.name,
                type: i.type,
                quantity: i.quantity,
                currentPrice: i.currentPrice,
                totalValue: i.quantity * i.currentPrice,
                platform: i.platform
            })),
            bills: allBills.map(b => ({
                id: b.id,
                name: b.name,
                amount: b.amount,
                dueDate: b.dueDate,
                isPaid: b.isPaid,
                frequency: b.frequency
            }))
        }, history);

        console.log("AI Response:", aiResponse);

        let finalReply = aiResponse.content;

        // Handle Tool Call (Record Transaction)
        if (aiResponse.toolCall) {
            const toolName = aiResponse.toolCall.function.name;
            const args = JSON.parse(aiResponse.toolCall.function.arguments);

            console.log(`[ToolCall] ${toolName}`, args);

            if (toolName === "record_transaction") {
                // Find category ID
                const category = allCategories.find(c =>
                    c.name.toLowerCase() === args.category.toLowerCase()
                ) || allCategories.find(c => c.name === "Lainnya");

                if (category) {
                    await createTransaction(userId, {
                        amount: args.amount,
                        description: args.description,
                        categoryId: category.id,
                        type: args.type,
                        date: new Date()
                    });

                    // Don't modify the content if AI already provided a confirmation
                    // But usually, it says "Sedang memproses..." if it's a tool call
                    if (finalReply.includes("memproses")) {
                        finalReply = `✅ Sip! Sudah saya catat ya, Bos. 
                        
📝 ${args.description}
💰 Rp ${args.amount.toLocaleString('id-ID')}
🏷️ ${category.name}

Ada lagi yang mau dicatat?`;
                    }
                }
            } else if (toolName === "create_budget") {
                const category = allCategories.find(c =>
                    c.name.toLowerCase() === args.category.toLowerCase()
                ) || allCategories.find(c => c.name === "Lainnya");

                if (category) {
                    await createBudget(userId, {
                        categoryId: category.id,
                        amount: args.amount,
                        month: args.month,
                        year: args.year
                    });

                    finalReply = `✅ Oke Bos! Budget ${category.name} sebesar Rp ${args.amount.toLocaleString('id-ID')} untuk bulan ${args.month}/${args.year} sudah saya buatkan. 🏦⚡`;
                }
            } else if (toolName === "create_goal") {
                await createGoal(userId, {
                    name: args.name,
                    targetAmount: args.targetAmount,
                    deadline: args.deadline ? new Date(args.deadline) : undefined,
                    icon: args.icon
                });

                finalReply = `✅ Mantap Alip! Target baru "${args.name}" sebesar Rp ${args.targetAmount.toLocaleString('id-ID')} sudah saya pasang. 🎯✨ Semangat nabungnya ya!`;
            } else if (toolName === "update_transaction") {
                const updateData: any = {};
                if (args.amount) updateData.amount = args.amount;
                if (args.description) updateData.description = args.description;
                if (args.type) updateData.type = args.type;
                if (args.category) {
                    const category = allCategories.find(c =>
                        c.name.toLowerCase() === args.category.toLowerCase()
                    );
                    if (category) updateData.categoryId = category.id;
                }

                const result = await updateTransaction(userId, args.id, updateData);
                if (result) {
                    finalReply = `✅ Beres, Bos! Transaksi [ID: ${args.id}] sudah saya perbarui. 📝✨`;
                } else {
                    finalReply = `❌ Waduh Bos, transaksi [ID: ${args.id}] tidak ketemu. Mungkin sudah terhapus sebelumnya? 🤔`;
                }
            } else if (toolName === "delete_transaction") {
                const transaction = await getTransactionById(userId, args.id);
                await deleteTransaction(userId, args.id);
                finalReply = `🗑️ Oke Bos, transaksi "${transaction ? transaction.description : 'ID ' + args.id}" sudah saya hapus dari catatan.`;
            } else if (toolName === "update_budget") {
                const result = await updateBudget(userId, args.id, { amount: args.amount });
                if (result) {
                    finalReply = `✅ Budget [ID: ${args.id}] sudah saya sesuaikan jadi Rp ${args.amount.toLocaleString('id-ID')}. 🏦⚡`;
                } else {
                    finalReply = `❌ Hmm, budget [ID: ${args.id}] tidak ditemukan nih, Bos. 🤔`;
                }
            } else if (toolName === "delete_budget") {
                await deleteBudget(userId, args.id);
                finalReply = `🗑️ Budget [ID: ${args.id}] sudah dihapus ya, Bos.`;
            } else if (toolName === "update_goal") {
                const updateData: any = {};
                if (args.name) updateData.name = args.name;
                if (args.targetAmount) updateData.targetAmount = args.targetAmount;
                if (args.deadline) updateData.deadline = new Date(args.deadline);
                if (args.icon) updateData.icon = args.icon;

                const result = await updateGoal(userId, args.id, updateData);
                if (result) {
                    finalReply = `✅ Target goal [ID: ${args.id}] sudah saya perbarui sesuai permintaan Bos! 🎯✨`;
                } else {
                    finalReply = `❌ Maaf Bos, goal [ID: ${args.id}] tidak ketemu di database. Coba cek lagi kodenya atau buat goal baru saja? 😊`;
                }
            } else if (toolName === "delete_goal") {
                const result = await removeGoal(userId, args.id);
                if (result) {
                    finalReply = `🗑️ Goal "${result.name}" [ID: ${args.id}] sudah saya hapus dari daftar target Bos.`;
                } else {
                    finalReply = `❌ Hmm, goal [ID: ${args.id}] sepertinya sudah tidak ada di database kita, Bos. 🤔`;
                }
            } else if (toolName === "reallocate_goal_funds") {
                const fromGoal = allGoals.find(g => g.id === args.fromGoalId);
                if (!fromGoal) {
                    finalReply = `❌ Waduh Bos, goal asal [ID: ${args.fromGoalId}] tidak ketemu.`;
                } else {
                    const amountToMove = args.amount || fromGoal.currentAmount;

                    if (args.target === "goal" && args.toGoalId) {
                        const toGoal = allGoals.find(g => g.id === args.toGoalId);
                        if (toGoal) {
                            await updateGoal(userId, toGoal.id, {
                                currentAmount: toGoal.currentAmount + amountToMove
                            });
                            // Also decrease fromGoal
                            await updateGoal(userId, fromGoal.id, {
                                currentAmount: fromGoal.currentAmount - amountToMove
                            });

                            finalReply = `✅ Dana sebesar Rp ${amountToMove.toLocaleString('id-ID')} sudah saya pindahkan dari "${fromGoal.name}" ke "${toGoal.name}". Pindahan beres! 💸✨`;
                        } else {
                            finalReply = `❌ Goal tujuan [ID: ${args.toGoalId}] tidak ditemukan nih, Bos.`;
                        }
                    } else if (args.target === "balance") {
                        // Create income transaction to "return" funds to balance
                        await createTransaction(userId, {
                            amount: amountToMove,
                            description: `Pengalihan dana dari Goal: ${fromGoal.name}`,
                            categoryId: allCategories.find(c => c.name === "Tabungan")?.id ||
                                allCategories.find(c => c.name === "Investasi")?.id ||
                                allCategories.find(c => c.name === "Lainnya")?.id ||
                                allCategories[0].id,
                            type: "income",
                            date: new Date()
                        });
                        // Decrease fromGoal
                        await updateGoal(userId, fromGoal.id, {
                            currentAmount: fromGoal.currentAmount - amountToMove
                        });

                        finalReply = `✅ Dana sebesar Rp ${amountToMove.toLocaleString('id-ID')} dari "${fromGoal.name}" sudah saya kembalikan ke Saldo Utama sebagai Pemasukan ya, Bos! 💰⚡`;
                    }
                }
            } else if (toolName === "add_goal_funds") {
                const targetGoal = allGoals.find(g => g.id === args.goalId);
                if (!targetGoal) {
                    finalReply = `❌ Waduh Bos, goal [ID: ${args.goalId}] tidak ditemukan.`;
                } else {
                    // Create expense transaction (moving money from balance to goal)
                    await createTransaction(userId, {
                        amount: args.amount,
                        description: `Setoran ke Goal: ${targetGoal.name}`,
                        categoryId: allCategories.find(c => c.name === "Tabungan")?.id ||
                            allCategories.find(c => c.name === "Investasi")?.id ||
                            allCategories.find(c => c.name === "Lainnya")?.id ||
                            allCategories[0].id,
                        type: "expense",
                        date: new Date()
                    });

                    // Update goal currentAmount
                    await updateGoal(userId, targetGoal.id, {
                        currentAmount: targetGoal.currentAmount + args.amount
                    });

                    finalReply = `✅ Beres Bos! Dana sebesar Rp ${args.amount.toLocaleString('id-ID')} sudah saya sisihkan dari Saldo Utama ke goal "${targetGoal.name}". Semangat nabungnya ya! 🎯✨`;
                }
            } else if (toolName === "create_bill") {
                await createBill(userId, {
                    name: args.name,
                    amount: args.amount,
                    dueDate: args.dueDate,
                    frequency: args.frequency,
                    icon: args.icon
                });
                finalReply = `✅ Sip! Tagihan "${args.name}" sebesar Rp ${args.amount.toLocaleString('id-ID')} (Tgl ${args.dueDate}) sudah saya catat. Jangan lupa bayar ya Bos! 🧾⚡`;
            } else if (toolName === "update_bill") {
                const updateData: any = {};
                if (args.name) updateData.name = args.name;
                if (args.amount) updateData.amount = args.amount;
                if (args.dueDate) updateData.dueDate = args.dueDate;

                await updateBill(userId, args.id, updateData);
                finalReply = `✅ Tagihan [ID: ${args.id}] sudah saya update sesuai permintaan Bos! 👌`;
            } else if (toolName === "delete_bill") {
                const bill = await getBillById(userId, args.id);
                await deleteBill(userId, args.id);
                finalReply = `🗑️ Oke, tagihan "${bill ? bill.name : 'ID ' + args.id}" sudah saya hapus.`;
            } else if (toolName === "mark_bill_paid") {
                const bill = await toggleBillPaid(userId, args.id);
                if (bill) {
                    let extraMessage = "";
                    if (args.paidFromBalance && bill.isPaid) {
                        // Create expense transaction
                        await createTransaction(userId, {
                            amount: bill.amount,
                            description: `Bayar Tagihan: ${bill.name}`,
                            categoryId: allCategories.find(c => c.name === "Tagihan")?.id || allCategories[0].id,
                            type: "expense",
                            date: new Date()
                        });
                        extraMessage = "\n💸 Saldo utama sudah dipotong untuk pembayaran ini.";
                    }

                    finalReply = bill.isPaid
                        ? `✅ Mantap! Tagihan "${bill.name}" sudah ditandai LUNAS. 🎉${extraMessage}`
                        : `✅ Oke, status tagihan "${bill.name}" saya ubah jadi BELUM DIBAYAR.`;
                } else {
                    finalReply = `❌ Tagihan tidak ditemukan Bos.`;
                }
            } else if (toolName === "create_investment") {
                await createInvestment(userId, {
                    name: args.name,
                    type: args.type,
                    quantity: args.quantity,
                    avgBuyPrice: args.buyPrice,
                    currentPrice: args.currentPrice,
                    platform: args.platform
                });
                finalReply = `✅ Keren! Aset investasi baru "${args.name}" (${args.quantity} unit) sudah saya tambahkan ke portofolio. 📈🚀`;
            } else if (toolName === "update_investment") {
                const investment = await getInvestmentById(userId, args.id);
                const updateData: any = {};
                if (args.quantity) updateData.quantity = args.quantity;
                if (args.buyPrice) updateData.avgBuyPrice = args.buyPrice;
                if (args.currentPrice) updateData.currentPrice = args.currentPrice;

                await updateInvestment(userId, args.id, updateData);
                const updatedInvestment = await getInvestmentById(userId, args.id); // Re-fetch to confirm

                if (!updatedInvestment) {
                    finalReply = `❌ Gagal mengupdate investasi [ID: ${args.id}]. Data tidak ditemukan di database.`;
                } else {
                    let extra = "";
                    if (args.soldAmount) {
                        await createTransaction(userId, {
                            amount: args.soldAmount,
                            description: `Penjualan Aset Partial: ${updatedInvestment.name}`,
                            categoryId: allCategories.find(c => c.name === "Investasi")?.id || allCategories.find(c => c.name === "Pemasukan")?.id || allCategories[0].id,
                            type: "income",
                            date: new Date()
                        });
                        extra = `\n💰 Uang hasil penjualan Rp ${args.soldAmount.toLocaleString('id-ID')} sudah masuk ke Saldo Utama.`;
                    }

                    finalReply = `✅ Data portofolio "${updatedInvestment.name}" sudah diperbarui!\n📊 Total Unit Sekarang: ${updatedInvestment.quantity}${extra}`;
                }
            } else if (toolName === "delete_investment") {
                const investment = await getInvestmentById(userId, args.id); // Need to fetch details first
                await deleteInvestment(userId, args.id);

                let extra = "";
                if (args.soldAmount && investment) {
                    await createTransaction(userId, {
                        amount: args.soldAmount,
                        description: `Penjualan Aset: ${investment.name}`,
                        categoryId: allCategories.find(c => c.name === "Investasi")?.id || allCategories.find(c => c.name === "Pemasukan")?.id || allCategories[0].id,
                        type: "income",
                        date: new Date()
                    });
                    extra = `\n💰 Uang hasil penjualan Rp ${args.soldAmount.toLocaleString('id-ID')} sudah masuk ke Saldo Utama.`;
                }

                finalReply = `🗑️ Aset investasi "${investment ? investment.name : 'ID ' + args.id}" sudah saya hapus dari portofolio.${extra}`;
            }
        }

        // Final cleanup to remove any markdown bold syntax that might have slipped through
        finalReply = finalReply.replace(/\*\*/g, "");

        return NextResponse.json({ reply: finalReply });
    } catch (error: any) {
        console.error("Chat API Error:", error);
        return NextResponse.json({
            error: "Internal Server Error",
            details: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
