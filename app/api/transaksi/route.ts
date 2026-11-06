import { NextRequest, NextResponse } from "next/server";
import { GoogleSheetsRepository } from "@/lib/repositories/sheetsRepository";
import { Transaksi } from "@/lib/types/transaksi";

const repo = new GoogleSheetsRepository();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bulan = searchParams.get("bulan") || undefined;
    const noDokumen = searchParams.get("noDokumen") || undefined;

    const action = searchParams.get("action");
    if (action === "daftarBulan") {
      const months = await repo.ambilDaftarBulan();
      return NextResponse.json({ success: true, data: months });
    }

    if (noDokumen) {
      const data = await repo.ambilTransaksi(noDokumen);
      return NextResponse.json({ success: true, data });
    }


    const data = await repo.ambilSemuaTransaksi(bulan);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("[API Transaksi GET Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengambil data dari Google Sheets" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Transaksi;
    if (!body || !body.noDokumen) {
      return NextResponse.json(
        { success: false, error: "Data transaksi tidak valid (noDokumen wajib ada)" },
        { status: 400 }
      );
    }

    await repo.simpanTransaksi(body);
    return NextResponse.json({ success: true, message: "Transaksi berhasil disimpan ke Google Sheets" });
  } catch (error: any) {
    console.error("[API Transaksi POST Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menyimpan data ke Google Sheets" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { noDokumen, status } = body;

    if (!noDokumen || !status) {
      return NextResponse.json(
        { success: false, error: "noDokumen dan status wajib disertakan" },
        { status: 400 }
      );
    }

    await repo.updateStatus(noDokumen, status);
    return NextResponse.json({ success: true, message: `Status ${noDokumen} berhasil diupdate ke ${status}` });
  } catch (error: any) {
    console.error("[API Transaksi PATCH Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal update status di Google Sheets" },
      { status: 500 }
    );
  }
}
