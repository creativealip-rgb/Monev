export interface ReportData {
    userName: string;
    month: string;
    year: number;
    stats: {
        income: number;
        expense: number;
        balance: number;
    };
    allocations: Array<{
        name: string;
        amount: number;
        percentage: number;
        target: number;
    }>;
    categories: Array<{
        name: string;
        amount: number;
        type: "income" | "expense";
    }>;
    investments: Array<{
        name: string;
        type: string;
        value: number;
    }>;
    aiInsight: string;
}

export async function generateWealthReport(data: ReportData) {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(val);
    };

    // Header
    doc.setFillColor(14, 165, 233); // sky-500
    doc.rect(0, 0, pageWidth, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("MONEV WEALTH REPORT", margin, 25);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`${data.month} ${data.year}`, pageWidth - margin - 30, 25);

    // User Info
    doc.setTextColor(51, 65, 85); // slate-700
    doc.setFontSize(12);
    doc.text(`Pelapor: ${data.userName}`, margin, 55);
    doc.text(`Dicetak pada: ${new Date().toLocaleDateString("id-ID")}`, margin, 62);

    // Summary Box
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.roundedRect(margin, 75, pageWidth - (margin * 2), 35, 3, 3);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text("TOTAL PEMASUKAN", margin + 10, 85);
    doc.text("TOTAL PENGELUARAN", margin + 75, 85);
    doc.text("SALDO BERSIH", margin + 140, 85);

    doc.setFontSize(12);
    doc.setTextColor(51, 65, 85);
    doc.text(formatCurrency(data.stats.income), margin + 10, 95);
    doc.text(formatCurrency(data.stats.expense), margin + 75, 95);

    doc.setTextColor(14, 165, 233);
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrency(data.stats.balance), margin + 140, 95);

    // 50/30/20 Rules
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Alokasi 50/30/20", margin, 130);

    autoTable(doc, {
        startY: 135,
        margin: { left: margin, right: margin },
        head: [["Kategori Alokasi", "Realisasi (%)", "Target (%)", "Nominal"]],
        body: data.allocations.map(a => [
            a.name,
            `${a.percentage.toFixed(1)}%`,
            `${a.target}%`,
            formatCurrency(a.amount)
        ]),
        headStyles: { fillColor: [14, 165, 233] },
        theme: "striped"
    });

    // Top Expenses
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Top Pengeluaran", margin, (doc as any).lastAutoTable.finalY + 15);

    autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        margin: { left: margin, right: margin },
        head: [["Kategori", "Jumlah"]],
        body: data.categories
            .filter(c => c.type === "expense")
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5)
            .map(c => [c.name, formatCurrency(c.amount)]),
        headStyles: { fillColor: [244, 63, 94] }, // rose-500
        theme: "striped"
    });

    // Investments
    if (data.investments.length > 0) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Portofolio Investasi", margin, (doc as any).lastAutoTable.finalY + 15);

        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 20,
            margin: { left: margin, right: margin },
            head: [["Asset", "Tipe", "Nilai Pasar"]],
            body: data.investments.map(i => [i.name, i.type, formatCurrency(i.value)]),
            headStyles: { fillColor: [16, 185, 129] }, // emerald-500
            theme: "striped"
        });
    }

    // AI Insight
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    if (finalY > 240) doc.addPage();

    const currentY = (doc as any).lastAutoTable.finalY + 15 > 240 ? 25 : finalY;

    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, currentY, pageWidth - (margin * 2), 40, 2, 2, "FD");

    doc.setFontSize(12);
    doc.setTextColor(14, 165, 233);
    doc.setFont("helvetica", "bold");
    doc.text("AI Smart Advice", margin + 5, currentY + 10);

    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.setFont("helvetica", "normal");

    const splitText = doc.splitTextToSize(data.aiInsight, pageWidth - (margin * 2) - 10);
    doc.text(splitText, margin + 5, currentY + 20);

    // Footer
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(
            `Monev AI - Generated by Strategic Finance Engine. Halaman ${i} dari ${totalPages}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: "center" }
        );
    }

    return doc;
}
