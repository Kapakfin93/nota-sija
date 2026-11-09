import { google } from "googleapis";
import path from "path";
import fs from "fs";
import { Transaksi, StatusTransaksi, ModeBagianBawah, ItemBarang } from "../types/transaksi";
import { ISheetRepository } from "./ISheetRepository";
import { formatAngkaId } from "../services/documentNumber";

export class GoogleSheetsRepository implements ISheetRepository {
  private spreadsheetId: string;
  private keyFilePath: string;

  constructor(spreadsheetId?: string, keyFilePath?: string) {
    this.spreadsheetId =
      spreadsheetId ||
      process.env.GOOGLE_SHEET_ID ||
      "1HcHWHnSm7S8zc01ur7btOg_icLx6aHUZwYwJZkC9OOU";
    this.keyFilePath =
      keyFilePath ||
      process.env.GOOGLE_SERVICE_ACCOUNT_PATH ||
      path.join(process.cwd(), "service-account.json");
  }

  private getSheetsClient() {
    // 1. Prioritas Cloud / Vercel: Baca dari raw JSON Environment Variable
    const envJson =
      process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_CREDENTIALS;
    if (envJson) {
      try {
        const credentials = JSON.parse(envJson);
        if (credentials.private_key) {
          credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");
        }
        const auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });
        return google.sheets({ version: "v4", auth });
      } catch (e: any) {
        console.error(
          "[GoogleSheetsRepository] Gagal parse GOOGLE_SERVICE_ACCOUNT_JSON dari env:",
          e
        );
      }
    }

    // 2. Alternatif Vercel: Baca dari variable terpisah
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    if (clientEmail && privateKey) {
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: clientEmail,
          private_key: privateKey.replace(/\\n/g, "\n"),
        },
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });
      return google.sheets({ version: "v4", auth });
    }

    // 3. Fallback Local Development: File service-account.json di local disk
    if (fs.existsSync(this.keyFilePath)) {
      const auth = new google.auth.GoogleAuth({
        keyFile: this.keyFilePath,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });
      return google.sheets({ version: "v4", auth });
    }

    throw new Error(
      "Kredensial Google Sheets tidak ditemukan. Di Vercel, tambahkan Environment Variable: GOOGLE_SERVICE_ACCOUNT_JSON (berisi isi seluruh file service-account.json) atau GOOGLE_CLIENT_EMAIL & GOOGLE_PRIVATE_KEY."
    );
  }


  /**
   * Ekstrak segmen MM_YY dari tanggalDokumen ("DD/MM/YY") atau noDokumen ("DD/MM/YY/NN")
   */
  private extractMonthYear(tanggalDokumen?: string, noDokumen?: string): string {
    if (tanggalDokumen) {
      const parts = tanggalDokumen.split("/");
      if (parts.length >= 3) {
        return `${parts[1]}_${parts[2]}`;
      }
    }
    if (noDokumen) {
      const parts = noDokumen.split("/");
      if (parts.length >= 3) {
        return `${parts[1]}_${parts[2]}`;
      }
    }
    // Fallback bulan & tahun saat ini
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yy = String(now.getFullYear()).slice(-2);
    return `${mm}_${yy}`;
  }

  /**
   * Menentukan nama tab bulanan:
   * Nota -> "Nota_MM_YY" (contoh: Nota_09_26)
   * Orderan -> "Orderan_MM_YY" (contoh: Orderan_09_26)
   */
  private getTargetSheetName(t: Transaksi): string {
    const monthYear = this.extractMonthYear(t.tanggalDokumen, t.noDokumen);
    const prefix = t.mode === "proyek" ? "Orderan" : "Nota";
    return `${prefix}_${monthYear}`;
  }

  /**
   * Memastikan tab bulanan sudah ada di Google Sheet. Jika belum ada,
   * buat tab baru lengkap dengan baris header Navy dan freeze row 1.
   */
  private async ensureSheetExists(sheetName: string, isOrderan: boolean): Promise<void> {
    const sheets = this.getSheetsClient();
    const meta = await sheets.spreadsheets.get({ spreadsheetId: this.spreadsheetId });
    const existing = (meta.data.sheets || []).find(
      s => s.properties?.title?.toLowerCase() === sheetName.toLowerCase()
    );

    if (existing) return; // Tab sudah ada

    // Header spesifik sesuai fisik dokumen
    const headers = isOrderan
      ? [
          "No. Orderan",
          "Tanggal",
          "Kepada",
          "Paket Pesanan",
          "Waktu Kerja",
          "Waktu Kirim",
          "Nama Barang/Jasa",
          "Volume",
          "Satuan",
          "Harga Satuan",
          "Jumlah",
          "Total Orderan",
          "Status Proyek",
        ]
      : [
          "No. Nota",
          "Tanggal",
          "Kepada Yth",
          "Nama Barang",
          "Volume",
          "Harga Satuan",
          "Jumlah",
          "Total Nota",
          "Mode Bawah",
          "Keterangan Kwitansi",
          "Status Bayar",
        ];

    // 1. Tambah sheet baru
    const addRes = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: this.spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetName,
                gridProperties: {
                  frozenRowCount: 1,
                },
              },
            },
          },
        ],
      },
    });

    const newSheetId = addRes.data.replies?.[0]?.addSheet?.properties?.sheetId || 0;

    // 2. Isi nilai header
    await sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: `${sheetName}!A1:${String.fromCharCode(64 + headers.length)}1`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [headers],
      },
    });

    // 3. Format header (Navy, bold, text putih, alignment center)
    const requests: any[] = [
      {
        repeatCell: {
          range: {
            sheetId: newSheetId,
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: headers.length,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.12, green: 0.23, blue: 0.54 }, // Navy #1e3a8a
              textFormat: {
                bold: true,
                foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
                fontSize: 10,
              },
              horizontalAlignment: "CENTER",
            },
          },
          fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)",
        },
      },
      // 4. Format desimal ribuan (#,##0) untuk kolom harga dan total (hingga baris 1000)
      {
        repeatCell: {
          range: {
            sheetId: newSheetId,
            startRowIndex: 1,
            endRowIndex: 1000,
            startColumnIndex: isOrderan ? 9 : 5,
            endColumnIndex: isOrderan ? 12 : 8,
          },
          cell: {
            userEnteredFormat: {
              numberFormat: {
                type: "NUMBER",
                pattern: "#,##0",
              },
              horizontalAlignment: "RIGHT",
            },
          },
          fields: "userEnteredFormat(numberFormat,horizontalAlignment)",
        },
      },
    ];

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: this.spreadsheetId,
      requestBody: {
        requests,
      },
    });
  }

  /**
   * Konversi transaksi ke baris-baris fisik dokumen (Ledger Style per item barang)
   */
  private formatRows(t: Transaksi): (string | number)[][] {
    const isOrderan = t.mode === "proyek";
    const items = t.items && t.items.length > 0 ? t.items : [
      { namaBarang: "-", qty: 1, satuan: "", hargaSatuan: t.total, totalHarga: t.total }
    ];

    if (isOrderan) {
      return items.map((it, idx) => [
        t.noDokumen,
        t.tanggalDokumen,
        t.namaCustomer,
        t.deskripsi || "",
        t.waktuPengerjaan || "",
        t.waktuPengiriman || "",
        it.namaBarang,
        it.qty,
        it.satuan || "pcs",
        it.hargaSatuan,
        it.totalHarga,
        idx === 0 ? t.total : "", // Total diletakkan di baris pertama
        t.status,
      ]);
    }

    // Format Nota
    return items.map((it, idx) => {
      const volumeStr = it.satuan
        ? `${formatAngkaId(it.qty)} ${it.satuan}`
        : `${formatAngkaId(it.qty)} pcs`;
      return [
        t.noDokumen,
        t.tanggalDokumen,
        t.namaCustomer,
        it.namaBarang,
        volumeStr,
        it.hargaSatuan,
        it.totalHarga,
        idx === 0 ? t.total : "", // Total diletakkan di baris pertama
        t.modeBagianBawah,
        t.keteranganKwitansi || "",
        t.status,
      ];
    });
  }

  async simpanTransaksi(data: Transaksi): Promise<void> {
    const sheetName = this.getTargetSheetName(data);
    const isOrderan = data.mode === "proyek";

    await this.ensureSheetExists(sheetName, isOrderan);
    const sheets = this.getSheetsClient();

    // Cek apakah No Dokumen sudah ada di sheet (jika ada, hapus baris lama sebelum insert baru agar tidak dobel)
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${sheetName}!A:A`,
    });

    const rows = res.data.values || [];
    let existingIndices: number[] = [];
    for (let i = 1; i < rows.length; i++) {
      if (rows[i] && rows[i][0] === data.noDokumen) {
        existingIndices.push(i + 1);
      }
    }

    const newRows = this.formatRows(data);

    if (existingIndices.length > 0) {
      // Update baris mulai dari baris pertama yang cocok
      const firstRow = existingIndices[0];
      const endCol = isOrderan ? "M" : "K";
      const totalSpan = Math.max(existingIndices.length, newRows.length);
      const paddedRows: (string | number)[][] = [...newRows];
      const colCount = isOrderan ? 13 : 11;
      while (paddedRows.length < totalSpan) {
        paddedRows.push(Array(colCount).fill(""));
      }
      await sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A${firstRow}:${endCol}${firstRow + totalSpan - 1}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: paddedRows,
        },
      });
      await this.applyNumberFormatting(sheetName, firstRow - 1, newRows.length, isOrderan);
    } else {
      // Append baris baru
      const appendRes = await sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:A`,
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: newRows,
        },
      });
      const updatedRange = appendRes.data.updates?.updatedRange || "";
      const match = updatedRange.match(/!A(\d+):/);
      const startRow = match ? parseInt(match[1], 10) - 1 : rows.length;
      await this.applyNumberFormatting(sheetName, startRow, newRows.length, isOrderan);
    }
  }

  private async applyNumberFormatting(
    sheetName: string,
    startRowIndex: number,
    rowCount: number,
    isOrderan: boolean
  ): Promise<void> {
    try {
      const sheets = this.getSheetsClient();
      const meta = await sheets.spreadsheets.get({ spreadsheetId: this.spreadsheetId });
      const targetSheet = (meta.data.sheets || []).find(
        s => s.properties?.title?.toLowerCase() === sheetName.toLowerCase()
      );
      if (!targetSheet || targetSheet.properties?.sheetId === undefined) return;

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: targetSheet.properties.sheetId,
                  startRowIndex,
                  endRowIndex: startRowIndex + rowCount,
                  startColumnIndex: isOrderan ? 9 : 5,
                  endColumnIndex: isOrderan ? 12 : 8,
                },
                cell: {
                  userEnteredFormat: {
                    numberFormat: {
                      type: "NUMBER",
                      pattern: "#,##0",
                    },
                    horizontalAlignment: "RIGHT",
                  },
                },
                fields: "userEnteredFormat(numberFormat,horizontalAlignment)",
              },
            },
          ],
        },
      });
    } catch (e) {
      console.warn(`[GoogleSheetsRepository] Gagal applyNumberFormatting pada ${sheetName}:`, e);
    }
  }

  async ambilTransaksi(noDokumen: string): Promise<Transaksi | null> {
    const sheets = this.getSheetsClient();
    const monthYear = this.extractMonthYear(undefined, noDokumen);

    // Cek kemungkinan di tab Nota maupun tab Orderan bulan terkait
    const candidateSheets = [`Nota_${monthYear}`, `Orderan_${monthYear}`];

    for (const sheetName of candidateSheets) {
      try {
        const res = await sheets.spreadsheets.values.get({
          spreadsheetId: this.spreadsheetId,
          range: `${sheetName}!A2:M`,
        });

        const rows = res.data.values || [];
        const matching = rows.filter(r => r[0] === noDokumen);
        if (matching.length > 0) {
          const isOrderan = sheetName.startsWith("Orderan");
          return this.parseRowsToTransaksi(matching, isOrderan);
        }
      } catch {
        // Tab mungkin belum ada
      }
    }

    return null;
  }

  private parseCleanNumber(val: any): number {
    if (typeof val === "number") return val;
    if (!val) return 0;
    const str = String(val).replace(/[^0-9,-]/g, "").replace(",", ".");
    return Number(str) || 0;
  }

  private parseRowsToTransaksi(rows: string[][], isOrderan: boolean): Transaksi {
    const first = rows[0];
    const items: ItemBarang[] = rows.map(r => {
      if (isOrderan) {
        return {
          namaBarang: r[6] || "",
          qty: this.parseCleanNumber(r[7]) || 1,
          satuan: r[8] || "",
          hargaSatuan: this.parseCleanNumber(r[9]),
          totalHarga: this.parseCleanNumber(r[10]),
        };
      }
      // Nota: volume diformat dengan formatAngkaId (titik ribuan, koma desimal, contoh: "1.401 pcs" atau "1,5 M2")
      const volumeStr = (r[4] || "").trim();
      const volMatch = volumeStr.match(/^([0-9.,]+)\s*(.*)$/);
      const qty = volMatch ? this.parseCleanNumber(volMatch[1]) : 1;
      const satuan = volMatch ? volMatch[2].trim() : "";
      return {
        namaBarang: r[3] || "",
        qty,
        satuan,
        hargaSatuan: this.parseCleanNumber(r[5]),
        totalHarga: this.parseCleanNumber(r[6]),
      };
    });

    const total =
      this.parseCleanNumber(first[7]) ||
      items.reduce((s, i) => s + i.totalHarga, 0);

    if (isOrderan) {
      return {
        noDokumen: first[0],
        tanggalDokumen: first[1],
        namaCustomer: first[2],
        mode: "proyek",
        status: (first[12] as StatusTransaksi) || "berjalan",
        deskripsi: first[3],
        waktuPengerjaan: first[4],
        waktuPengiriman: first[5],
        items,
        total,
        modeBagianBawah: "kosong",
      };
    }

    return {
      noDokumen: first[0],
      tanggalDokumen: first[1],
      namaCustomer: first[2],
      mode: "normal",
      status: (first[10] as StatusTransaksi) || "tertagih",
      modeBagianBawah: (first[8] as ModeBagianBawah) || "kosong",
      keteranganKwitansi: first[9],
      items,
      total,
    };
  }

  async ambilSemuaTransaksi(bulan?: string): Promise<Transaksi[]> {
    const sheets = this.getSheetsClient();
    const meta = await sheets.spreadsheets.get({ spreadsheetId: this.spreadsheetId });
    const sheetTitles = (meta.data.sheets || [])
      .map(s => s.properties?.title || "")
      .filter(t => t.startsWith("Nota_") || t.startsWith("Orderan_"));

    const list: Transaksi[] = [];

    for (const title of sheetTitles) {
      if (bulan) {
        // Filter bulan (contoh bulan: "09" atau "09_26")
        if (!title.includes(bulan)) continue;
      }

      try {
        const res = await sheets.spreadsheets.values.get({
          spreadsheetId: this.spreadsheetId,
          range: `${title}!A2:M`,
        });

        const rows = res.data.values || [];
        // Group per noDokumen
        const grouped: { [noDokumen: string]: string[][] } = {};
        for (const row of rows) {
          const no = row[0];
          if (!no) continue;
          if (!grouped[no]) grouped[no] = [];
          grouped[no].push(row);
        }

        const isOrderan = title.startsWith("Orderan");
        for (const no in grouped) {
          list.push(this.parseRowsToTransaksi(grouped[no], isOrderan));
        }
      } catch (e) {
        console.warn(`[GoogleSheetsRepository] Gagal membaca sheet ${title}:`, e);
      }
    }

    return list;
  }

  async ambilDaftarBulan(): Promise<string[]> {
    const sheets = this.getSheetsClient();
    try {
      const meta = await sheets.spreadsheets.get({ spreadsheetId: this.spreadsheetId });
      const sheetTitles = (meta.data.sheets || [])
        .map(s => s.properties?.title || "")
        .filter(t => t.startsWith("Nota_") || t.startsWith("Orderan_"));

      const months = new Set<string>();
      for (const title of sheetTitles) {
        const parts = title.split("_");
        if (parts.length >= 3) {
          months.add(`${parts[1]}_${parts[2]}`);
        }
      }
      return Array.from(months).sort().reverse();
    } catch (e) {
      console.warn("[GoogleSheetsRepository] Gagal membaca metadata sheets:", e);
      return [];
    }
  }

  async updateStatus(noDokumen: string, status: Transaksi["status"]): Promise<void> {
    const sheets = this.getSheetsClient();
    const monthYear = this.extractMonthYear(undefined, noDokumen);
    const candidateSheets = [`Nota_${monthYear}`, `Orderan_${monthYear}`];

    for (const sheetName of candidateSheets) {
      try {
        const res = await sheets.spreadsheets.values.get({
          spreadsheetId: this.spreadsheetId,
          range: `${sheetName}!A:A`,
        });

        const rows = res.data.values || [];
        const matchingRows: number[] = [];
        for (let i = 1; i < rows.length; i++) {
          if (rows[i] && rows[i][0] === noDokumen) {
            matchingRows.push(i + 1);
          }
        }

        if (matchingRows.length > 0) {
          const isOrderan = sheetName.startsWith("Orderan");
          const statusCol = isOrderan ? "M" : "K";
          const firstRow = matchingRows[0];
          const lastRow = matchingRows[matchingRows.length - 1];
          const statusValues = Array.from(
            { length: lastRow - firstRow + 1 },
            (_, idx) => (matchingRows.includes(firstRow + idx) ? [status] : [rows[firstRow + idx - 1]?.[isOrderan ? 12 : 10] || status])
          );
          await sheets.spreadsheets.values.update({
            spreadsheetId: this.spreadsheetId,
            range: `${sheetName}!${statusCol}${firstRow}:${statusCol}${lastRow}`,
            valueInputOption: "USER_ENTERED",
            requestBody: {
              values: statusValues,
            },
          });
          return;
        }
      } catch {
        // Lanjutkan pencarian
      }
    }

    throw new Error(`Transaksi dengan noDokumen ${noDokumen} tidak ditemukan di Google Sheets`);
  }
}
