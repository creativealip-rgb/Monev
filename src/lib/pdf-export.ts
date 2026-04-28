/**
 * PDF Export utility for Monev Analytics
 * Uses jspdf + jspdf-autotable to generate monthly financial reports
 */

import { formatCurrency } from "@/frontend/lib/utils";

interface CategoryStat {
    categoryName: string;
    total: number;
    color?: string;
}

interface PdfExportData {
    month: number;
    year: number;
    income: number;
    expense: number;
    balance: number;
    categoryStats: CategoryStat[];
    periodLabel?: string;
    anomalies?: Array<{
        date: string;
        totalAmount: number;
        transactionCount: number;
        severity?: "low" | "medium" | "high";
        insight?: string;
    }>;
    actionItems?: string[];
    userName?: string;
}

interface JsPdfWithPageCount {
    internal: {
        getNumberOfPages(): number;
    };
}

const MONTH_NAMES = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export async function exportAnalyticsPDF(data: PdfExportData): Promise<void> {
    // Lazy load jspdf to avoid bundle size impact unless needed
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();

    // ── Header ──────────────────────────────────────────────
    doc.setFillColor(14, 165, 233); // sky-500
    doc.rect(0, 0, pageWidth, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("MONEV", 15, 18);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Laporan Keuangan Bulanan", 15, 26);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(data.periodLabel || `${MONTH_NAMES[data.month - 1]} ${data.year}`, pageWidth - 15, 20, { align: "right" });

    if (data.userName) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(data.userName, pageWidth - 15, 27, { align: "right" });
    }

    // ── Summary Cards ────────────────────────────────────────
    const cardY = 52;
    const cardW = (pageWidth - 40) / 3;

    const summaryCards = [
        { label: "Pemasukan", value: data.income, color: [16, 185, 129] as [number, number, number] },
        { label: "Pengeluaran", value: data.expense, color: [239, 68, 68] as [number, number, number] },
        { label: "Saldo Bersih", value: data.balance, color: data.balance >= 0 ? [59, 130, 246] as [number, number, number] : [239, 68, 68] as [number, number, number] },
    ];

    summaryCards.forEach((card, idx) => {
        const x = 15 + idx * (cardW + 5);
        doc.setFillColor(...card.color);
        doc.roundedRect(x, cardY, cardW, 22, 3, 3, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(card.label, x + cardW / 2, cardY + 7, { align: "center" });

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(
            formatCurrency(Math.abs(card.value)),
            x + cardW / 2,
            cardY + 16,
            { align: "center" }
        );
    });

    // ── Category Breakdown Table ─────────────────────────────
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Rincian Pengeluaran per Kategori", 15, cardY + 34);

    const tableData = data.categoryStats
        .sort((a, b) => b.total - a.total)
        .map((cat, idx) => [
            String(idx + 1),
            cat.categoryName,
            formatCurrency(cat.total),
            data.expense > 0 ? `${Math.round((cat.total / data.expense) * 100)}%` : "0%",
        ]);

    autoTable(doc, {
        startY: cardY + 38,
        head: [["#", "Kategori", "Jumlah", "% Pengeluaran"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [14, 165, 233], fontStyle: "bold", fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        columnStyles: {
            0: { cellWidth: 10, halign: "center" },
            2: { halign: "right" },
            3: { halign: "center" },
        },
        margin: { left: 15, right: 15 },
    });

    const finalY = (doc as typeof doc & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || (cardY + 90);

    // ── Anomaly Summary ─────────────────────────────────────
    const anomalies = (data.anomalies || []).slice(0, 3);
    if (anomalies.length > 0) {
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Anomali Pengeluaran", 15, finalY + 12);

        const anomalyRows = anomalies.map((item) => [
            new Date(item.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
            formatCurrency(item.totalAmount),
            `${item.transactionCount} trx`,
            (item.severity || "low").toUpperCase(),
        ]);

        autoTable(doc, {
            startY: finalY + 16,
            head: [["Tanggal", "Nominal", "Transaksi", "Severity"]],
            body: anomalyRows,
            theme: "striped",
            headStyles: { fillColor: [245, 158, 11], fontStyle: "bold", fontSize: 9 },
            bodyStyles: { fontSize: 9 },
            margin: { left: 15, right: 15 },
        });
    }

    const afterAnomalyY = (doc as typeof doc & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || finalY;

    // ── Action Items ────────────────────────────────────────
    if ((data.actionItems || []).length > 0) {
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Aksi Prioritas", 15, afterAnomalyY + 12);

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");

        let currentY = afterAnomalyY + 19;
        data.actionItems?.slice(0, 3).forEach((action, index) => {
            const lines = doc.splitTextToSize(`${index + 1}. ${action}`, pageWidth - 30);
            doc.text(lines, 18, currentY);
            currentY += lines.length * 5 + 2;
        });
    }

    // ── Footer ───────────────────────────────────────────────
    const pageCount = (doc as unknown as JsPdfWithPageCount).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(8);
        doc.text(
            `Dibuat oleh Monev AI • ${new Date().toLocaleDateString("id-ID")} • Halaman ${i} dari ${pageCount}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 8,
            { align: "center" }
        );
    }

    // ── Save ─────────────────────────────────────────────────
    doc.save(`monev-laporan-${MONTH_NAMES[data.month - 1].toLowerCase()}-${data.year}.pdf`);
}
