import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db/neon";
import { computeDailyMetricsForDate } from "@/lib/analytics/computeDailyMetrics";
import { getAllRedFlagsForDate } from "@/lib/analytics/redFlags";
import {
  generateDailyInsight,
  generateFallbackInsight,
  DailyInsight,
} from "@/lib/deepseek/client";
import { isValidDateString } from "@/lib/utils/date";

const QuerySchema = z.object({
  date: z.string().refine(isValidDateString, {
    message: "Format tanggal tidak valid. Gunakan YYYY-MM-DD",
  }),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date");

    const validation = QuerySchema.safeParse({ date });

    if (!validation.success) {
      return NextResponse.json(
        { error: "Parameter query tidak valid", details: validation.error.issues },
        { status: 400 }
      );
    }

    const targetDate = validation.data.date;
    const sql = getDb();

    // Check cache first
    const cached = await sql`
      SELECT payload_json FROM daily_insights_cache
      WHERE date = ${targetDate}
      LIMIT 1
    `;

    if (cached.length > 0 && cached[0].payload_json) {
      return NextResponse.json({
        success: true,
        cached: true,
        data: cached[0].payload_json as DailyInsight,
      });
    }

    // Compute metrics and red flags
    const metrics = await computeDailyMetricsForDate(targetDate);
    const redFlags = await getAllRedFlagsForDate(
      targetDate,
      metrics.salesmen_metrics
    );

    let insight: DailyInsight;
    let fromLLM = false;

    // Try to generate insight via DeepSeek
    try {
      if (process.env.DEEPSEEK_API_KEY) {
        insight = await generateDailyInsight(metrics, redFlags);
        fromLLM = true;
      } else {
        // No API key, use fallback
        insight = generateFallbackInsight(metrics, redFlags);
      }
    } catch (error) {
      console.error("Error DeepSeek, menggunakan fallback:", error);
      insight = generateFallbackInsight(metrics, redFlags);
    }

    // Cache the result
    try {
      await sql`
        INSERT INTO daily_insights_cache (date, payload_json)
        VALUES (${targetDate}, ${JSON.stringify(insight)})
        ON CONFLICT (date) DO UPDATE SET payload_json = ${JSON.stringify(insight)}
      `;
    } catch (cacheError) {
      console.error("Gagal menyimpan cache insight:", cacheError);
    }

    return NextResponse.json({
      success: true,
      cached: false,
      from_llm: fromLLM,
      data: insight,
    });
  } catch (error) {
    console.error("Error insight harian:", error);
    return NextResponse.json(
      { error: "Kesalahan server internal" },
      { status: 500 }
    );
  }
}
