import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { scheduledReports } from "@/backend/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const resolvedParams = await params;
        const userId = parseInt(session.user.id);
        const reportId = parseInt(resolvedParams.id);

        const db = getDb();
        const report = await db.select()
            .from(scheduledReports)
            .where(and(
                eq(scheduledReports.id, reportId),
                eq(scheduledReports.userId, userId)
            ))
            .get();

        if (!report) {
            return NextResponse.json({ error: "Report not found" }, { status: 404 });
        }

        if (!report.pdfData) {
            return NextResponse.json({ error: "PDF not available" }, { status: 404 });
        }

        return new NextResponse(Buffer.from(report.pdfData, 'base64'), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Monev_Report_${report.reportMonth}_${report.reportYear}.pdf"`,
            },
        });

    } catch (error) {
        console.error("Download error:", error);
        return NextResponse.json(
            { error: "Failed to download report" },
            { status: 500 }
        );
    }
}
