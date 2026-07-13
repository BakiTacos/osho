// app/invoicing/services/CustomerInvoicePdfService.ts
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface CustomerInvoiceItem {
  sku: string;
  productName: string;
  qty: number;
  price: number;
  commission?: number; // Kustom khusus Suparta
  supplier?: string; // Kustom khusus Suparta
}

export interface CustomerInvoice {
  id?: string;
  invoiceNumber: string;
  recipient: string;
  recipientAddress?: string; // Alamat pelanggan kustom
  recipientPhone?: string; // No telp pelanggan kustom
  date: string;
  dueDate: string;
  items: CustomerInvoiceItem[];
  discount: number; // Nominal discount
  tax: number; // Percentage tax
  subtotal: number;
  total: number;
  notes?: string;
  bankInfo?: string;
  logoBase64?: string; // Logo Base64 kustom
  sellerName?: string; // Nama Penjual kustom
  sellerAddress?: string; // Alamat Penjual kustom
  sellerContact?: string; // Kontak Penjual kustom
  sellerPhone?: string; // Nomor telepon pengirim kustom
  themeColor?: string; // Warna tema hex kustom (misal: #0047AB)
  sellerPic?: string; // Nama Penanggung Jawab kustom
  signatureBase64?: string; // Foto tanda tangan Base64 kustom
  totalCommission?: number; // Komisi total untuk rekap
  paymentHistory?: string; // Riwayat pembayaran termin untuk rekap WA
  hpp?: number;
  profit?: number;
}

// Fungsi pembantu mengeja nominal angka ke teks Bahasa Indonesia
function kekata(n: number): string {
  const prima = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
  if (n < 12) return prima[n];
  if (n < 20) return kekata(n - 10) + " Belas";
  if (n < 100) return kekata(Math.floor(n / 10)) + " Puluh " + kekata(n % 10);
  if (n < 200) return "Seratus " + kekata(n - 100);
  if (n < 1000) return kekata(Math.floor(n / 100)) + " Ratus " + kekata(n % 100);
  if (n < 2000) return "Seribu " + kekata(n - 1000);
  if (n < 1000000) return kekata(Math.floor(n / 1000)) + " Ribu " + kekata(n % 1000);
  if (n < 1000000000) return kekata(Math.floor(n / 1000000)) + " Juta " + kekata(n % 1000000);
  return "";
}

export function formatTerbilang(amount: number): string {
  if (amount === 0) return "Nol Rupiah";
  const words = kekata(Math.floor(amount));
  return (words.trim() + " Rupiah").replace(/\s+/g, " ");
}

export class CustomerInvoicePdfService {
  // Helper untuk mengonversi Hex Color (#RRGGBB) ke RGB array
  public static hexToRgb(hex?: string): [number, number, number] {
    if (!hex) return [0, 71, 171]; // Default Cobalt Blue
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 71, 171];
  }

  // Helper untuk mendeteksi format gambar dari header Base64
  public static detectImageFormat(base64?: string): string {
    if (!base64) return "PNG";
    if (base64.startsWith("data:image/jpeg") || base64.startsWith("data:image/jpg")) {
      return "JPEG";
    }
    if (base64.startsWith("data:image/png")) {
      return "PNG";
    }
    if (base64.startsWith("data:image/webp")) {
      return "WEBP";
    }
    const match = base64.match(/^data:image\/([a-zA-Z+]+);base64,/);
    if (match && match[1]) {
      const ext = match[1].toUpperCase();
      if (ext === "JPG") return "JPEG";
      return ext;
    }
    return "PNG";
  }

  // Helper untuk memformat tanggal secara aman tanpa resiko crash
  public static formatDateSafely(dateVal: any): string {
    if (!dateVal) return "-";
    try {
      if (dateVal && typeof dateVal.toDate === 'function') {
        return dateVal.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      }
      if (dateVal && typeof dateVal.seconds === 'number') {
        return new Date(dateVal.seconds * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      }
      const parsed = new Date(dateVal);
      if (!isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      }
      return String(dateVal);
    } catch (e) {
      console.error("Gagal memformat tanggal invoice:", e);
      return String(dateVal);
    }
  }

  // Compressor Gambar berbasis Canvas dengan output PNG agar mempertahankan transparansi
  private static compressBase64Image(base64: string, maxDim = 150): Promise<string> {
    return new Promise((resolve) => {
      if (!base64 || base64.length < 25000) {
        // Jika file sudah kecil (< 25KB), tidak usah dikompres ulang
        return resolve(base64);
      }
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/png")); // Output PNG untuk mempertahankan alpha transparency
        } else {
          resolve(base64);
        }
      };
      img.onerror = () => resolve(base64);
    });
  }

  // DIUBAH MENJADI ASYNC AGAR DAPAT MELAKUKAN KOMPRESI ASYNC PADA GAMBAR
  public static async generatePdf(invoice: CustomerInvoice) {
    if (!invoice) return alert("❌ Data invoice kosong, gagal memproses.");

    // Kompresi aset Base64 secara asinkron agar ukuran file PDF tetap sangat kecil (<100KB)
    let logoBase64 = invoice.logoBase64 || "";
    let signatureBase64 = invoice.signatureBase64 || "";

    if (logoBase64) {
      logoBase64 = await CustomerInvoicePdfService.compressBase64Image(logoBase64, 150);
    }
    if (signatureBase64) {
      signatureBase64 = await CustomerInvoicePdfService.compressBase64Image(signatureBase64, 150);
    }

    const dateFormatted = CustomerInvoicePdfService.formatDateSafely(invoice.date);
    const dueDateFormatted = CustomerInvoicePdfService.formatDateSafely(invoice.dueDate);
    const rgbColor = CustomerInvoicePdfService.hexToRgb(invoice.themeColor);

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a5"
    });

    // Default Branding Values
    const sName = invoice.sellerName || "Simple and Yours";
    const sAddress = invoice.sellerAddress || "Tangerang, Banten, Indonesia";
    const sContact = (invoice.sellerContact || "Email: sny.osho@gmail.com") + (invoice.sellerPhone ? ` • Telp: ${invoice.sellerPhone}` : "");

    // --- LOGO & IDENTITAS PERUSAHAAN (Kiri Atas) ---
    let startX = 12;
    if (logoBase64 && logoBase64.startsWith("data:image/") && logoBase64.length > 50) {
      try {
        const imageFormat = CustomerInvoicePdfService.detectImageFormat(logoBase64);
        doc.addImage(logoBase64, imageFormat, 12, 11, 12, 12);
        startX = 27; // Geser teks identitas ke kanan jika ada logo
      } catch (err) {
        console.error("Gagal menggambar logo ke PDF:", err);
      }
    }

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(sName, startX, 15);

    doc.setFontSize(7.5);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(sAddress, startX, 19.5);
    
    doc.setTextColor(rgbColor[0], rgbColor[1], rgbColor[2]); // Aksen warna tema
    doc.setFont("Helvetica", "bold");
    doc.text(sContact, startX, 23.5);

    // --- JUDUL DOKUMEN & NOMOR INVOICE (Kanan Atas) ---
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(rgbColor[0], rgbColor[1], rgbColor[2]); 
    doc.text("INVOICE", 136, 15, { align: "right" });

    doc.setFontSize(8);
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(71, 85, 105); 
    doc.text(`#${invoice.invoiceNumber}`, 136, 20, { align: "right" });

    // Garis Pembatas
    doc.setDrawColor(241, 245, 249); 
    doc.setLineWidth(0.4);
    doc.line(12, 28, 136, 28);

    // --- METADATA TRANSAKSI & PENERIMA ---
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text("INFORMASI TAGIHAN", 12, 34);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);

    // DUA KOLOM SEJAJAR: Data Pembeli di kiri, Detail Tanggal di kanan (agar alamat panjang tidak bertabrakan)
    // --- KOLOM KIRI (X=12): DETAIL PELANGGAN ---
    doc.text("Nama Pelanggan", 12, 39);
    doc.text(":", 34, 39);
    doc.setFont("Helvetica", "bold");
    doc.text(invoice.recipient || "-", 37, 39);
    doc.setFont("Helvetica", "normal");

    doc.text("Telp Pelanggan", 12, 43);
    doc.text(":", 34, 43);
    doc.text(invoice.recipientPhone || "-", 37, 43);

    doc.text("Alamat", 12, 47);
    doc.text(":", 34, 47);
    const addressSplit = doc.splitTextToSize(invoice.recipientAddress || "-", 40); // Batasi lebar 40mm agar rapi dan wrap kebawah
    doc.text(addressSplit, 37, 47);

    // --- KOLOM KANAN (X=80): DETAIL TANGGAL & TRANSAKSI ---
    doc.text("Tanggal Invoice", 80, 39);
    doc.text(":", 104, 39);
    doc.text(dateFormatted, 107, 39);

    doc.text("Jatuh Tempo", 80, 43);
    doc.text(":", 104, 43);
    doc.text(dueDateFormatted, 107, 43);

    // --- METADATA TABEL ITEM BARANG ---
    const items = invoice.items || [];
    const tableBody = items.map((item, index) => [
      index + 1,
      String(item.sku || "").toUpperCase(),
      item.productName || "Produk",
      `${item.qty || 0} Pcs`,
      `Rp ${Math.round(item.price || 0).toLocaleString('id-ID')}`,
      `Rp ${Math.round((item.price || 0) * (item.qty || 0)).toLocaleString('id-ID')}`
    ]);

    autoTable(doc, {
      startY: 58, // Y disesuaikan agar alamat wrap kebawah dengan rapi
      margin: { left: 12, right: 12 },
      head: [["NO", "SKU", "DESKRIPSI PRODUK", "QTY", "HARGA SATUAN", "SUBTOTAL"]],
      body: tableBody,
      theme: "striped",
      headStyles: {
        fillColor: rgbColor,
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: "bold",
        halign: "left"
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [51, 65, 85],
        font: "Helvetica"
      },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" }, 
        1: { cellWidth: 20 },                  
        2: { cellWidth: "auto" },              
        3: { cellWidth: 12, halign: "center" }, 
        4: { cellWidth: 22, halign: "right" },  
        5: { cellWidth: 22, halign: "right" }   
      },
      styles: {
        cellPadding: 2
      }
    });

    // --- SIDE-BY-SIDE LAYOUT: Left (Payment & Notes) vs Right (Totals) ---
    const finalY = ((doc as any).lastAutoTable?.finalY || 70) + 6;

    // Draw horizontal separator line for the whole table bottom
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.4);
    doc.line(12, finalY - 3, 136, finalY - 3);

    // ==========================================
    // RIGHT SIDE: Totals (Subtotal, Tax, Discount, Grand Total)
    // ==========================================
    let rightY = finalY;
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text("Subtotal", 80, rightY);
    doc.text(`Rp ${Math.round(invoice.subtotal || 0).toLocaleString('id-ID')}`, 136, rightY, { align: "right" });

    if (invoice.discount > 0) {
      rightY += 4;
      doc.text("Diskon", 80, rightY);
      doc.text(`-Rp ${Math.round(invoice.discount).toLocaleString('id-ID')}`, 136, rightY, { align: "right" });
    }

    if (invoice.tax > 0) {
      rightY += 4;
      doc.text(`Pajak (${invoice.tax}%)`, 80, rightY);
      const taxAmount = ((invoice.subtotal || 0) - (invoice.discount || 0)) * (invoice.tax / 100);
      doc.text(`+Rp ${Math.round(taxAmount).toLocaleString('id-ID')}`, 136, rightY, { align: "right" });
    }

    rightY += 5;
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text("GRAND TOTAL", 80, rightY);
    doc.setTextColor(rgbColor[0], rgbColor[1], rgbColor[2]);
    doc.text(`IDR ${Math.round(invoice.total || 0).toLocaleString('id-ID')}`, 136, rightY, { align: "right" });

    // ==========================================
    // LEFT SIDE: Payment Info & Notes
    // ==========================================
    let leftY = finalY;
    if (invoice.notes || invoice.bankInfo) {
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text("INFORMASI PEMBAYARAN & CATATAN", 12, leftY);

      // Garis pemisah antara header dan isi
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.line(12, leftY + 1.2, 74, leftY + 1.2);

      leftY += 4.5;
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(6.8);
      doc.setTextColor(71, 85, 105);

      if (invoice.bankInfo) {
        doc.setFont("Helvetica", "bold");
        doc.text("Transfer Bank:", 12, leftY);
        doc.setFont("Helvetica", "normal");
        const splitBank = doc.splitTextToSize(invoice.bankInfo, 60);
        doc.text(splitBank, 12, leftY + 3);
        leftY += 3 + (splitBank.length * 3);
      }

      if (invoice.notes) {
        doc.setFont("Helvetica", "bold");
        doc.text("Catatan:", 12, leftY);
        doc.setFont("Helvetica", "normal");
        const splitNotes = doc.splitTextToSize(invoice.notes, 60);
        doc.text(splitNotes, 12, leftY + 3);
        leftY += 3 + (splitNotes.length * 3);
      }
    }

    // ==========================================
    // TERBILANG NOMINAL AKHIR
    // ==========================================
    const terbilangY = Math.max(leftY, rightY) + 5;
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    const terbilangText = `Terbilang: ${formatTerbilang(invoice.total)}`;
    const terbilangSplit = doc.splitTextToSize(terbilangText, 124); // Spans full width
    doc.text(terbilangSplit, 12, terbilangY);

    // --- FOOTER TANDA TANGAN ---
    const footerY = 168;
    doc.setDrawColor(241, 245, 249);
    doc.line(12, footerY - 4, 136, footerY - 4);

    doc.setFont("Helvetica", "italic");
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text("Terima kasih atas kerja sama dan kepercayaan Anda.", 12, footerY);
    doc.text(`Halaman ini sah diterbitkan secara digital oleh ${sName}.`, 12, footerY + 2.5);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text("Hormat Kami,", 136, footerY, { align: "right" });
    
    // Tanda Tangan Gambar (Dihitung rasio dynamic aspek rasionya secara matang agar ANTI-GEPENG)
    let sigOffset = 0;
    if (signatureBase64 && signatureBase64.startsWith("data:image/") && signatureBase64.length > 50) {
      try {
        const sigFormat = CustomerInvoicePdfService.detectImageFormat(signatureBase64);
        const props = doc.getImageProperties(signatureBase64);
        const ratio = props.width / props.height;
        let sigWidth = 18;
        let sigHeight = 18 / ratio;
        
        // Batasi tinggi maksimum agar tanda tangan rapi
        if (sigHeight > 8) {
          sigHeight = 8;
          sigWidth = 8 * ratio;
        }

        // Tepi kanan sejajar dengan X=136
        const sigX = 136 - sigWidth;
        doc.addImage(signatureBase64, sigFormat, sigX, footerY + 1.5, sigWidth, sigHeight);
        sigOffset = sigHeight + 1.5;
      } catch (err) {
        console.error("Gagal menggambar tanda tangan ke PDF:", err);
      }
    }

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(sName, 136, footerY + 5.5 + sigOffset, { align: "right" });

    // Nama Penanggung Jawab (PIC) - Tanpa tanda kurung ()
    if (invoice.sellerPic) {
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(invoice.sellerPic, 136, footerY + 9 + sigOffset, { align: "right" });
    }

    doc.save(`INVOICE-${invoice.invoiceNumber}.pdf`);
  }

  // 🚀 FITUR KHUSUS REKAP SUPPLIER (Untuk Suparta Technica)
  public static generateSupplierRecapPdf(
    supplierName: string,
    startDateStr: string,
    endDateStr: string,
    recapItems: any[],
    totalCommission: number
  ) {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a5"
    });

    const sName = "SUPARTA TECHNICA";
    
    // Header Laporan
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("LAPORAN REKAP PENJUALAN SUPPLIER", 12, 15);
    
    doc.setFontSize(7.5);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`Supplier: ${supplierName.toUpperCase()}`, 12, 19.5);
    doc.text(`Periode: ${CustomerInvoicePdfService.formatDateSafely(startDateStr)} s.d. ${CustomerInvoicePdfService.formatDateSafely(endDateStr)}`, 12, 23.5);

    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.4);
    doc.line(12, 27, 136, 27);

    // Table Data mapping - Tanpa kolom komisi / setor per row
    const tableBody = recapItems.map((item, index) => [
      index + 1,
      item.invoiceNumber,
      CustomerInvoicePdfService.formatDateSafely(item.date),
      item.recipient,
      item.productName,
      `${item.qty} Pcs`,
      `Rp ${Math.round(item.price).toLocaleString('id-ID')}`,
      `Rp ${Math.round(item.price * item.qty).toLocaleString('id-ID')}`
    ]);

    autoTable(doc, {
      startY: 30,
      margin: { left: 12, right: 12 },
      head: [["NO", "INV", "TGL", "PELANGGAN", "PRODUK", "QTY", "HARGA", "SUBTOTAL"]],
      body: tableBody,
      theme: "striped",
      headStyles: {
        fillColor: [16, 185, 129], // Emerald Green aksen supplier
        textColor: [255, 255, 255],
        fontSize: 6.8,
        fontStyle: "bold",
        halign: "left"
      },
      bodyStyles: {
        fontSize: 6.2,
        textColor: [51, 65, 85]
      },
      columnStyles: {
        0: { cellWidth: 6, halign: "center" },
        1: { cellWidth: 16 },
        2: { cellWidth: 16 },
        3: { cellWidth: 20 },
        4: { cellWidth: "auto" },
        5: { cellWidth: 10, halign: "center" },
        6: { cellWidth: 18, halign: "right" },
        7: { cellWidth: 20, halign: "right" }
      },
      styles: {
        cellPadding: 1.5
      }
    });

    const finalY = ((doc as any).lastAutoTable?.finalY || 40) + 6;
    doc.line(12, finalY - 3, 136, finalY - 3);

    // Summary calculations
    const totalJual = recapItems.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);
    const totalSetor = totalJual - totalCommission;

    let sumY = finalY;
    doc.setFontSize(7.5);
    doc.setFont("Helvetica", "normal");
    doc.text("Total Penjualan Kotor:", 65, sumY);
    doc.text(`Rp ${Math.round(totalJual).toLocaleString('id-ID')}`, 136, sumY, { align: "right" });

    sumY += 4;
    doc.text("Total Komisi (Hak Ruko):", 65, sumY);
    doc.setTextColor(16, 185, 129); // emerald-600
    doc.text(`Rp ${Math.round(totalCommission).toLocaleString('id-ID')}`, 136, sumY, { align: "right" });

    sumY += 5;
    doc.setTextColor(15, 23, 42);
    doc.setFont("Helvetica", "bold");
    doc.text("TOTAL SETOR (SUPPLIER):", 65, sumY);
    doc.text(`Rp ${Math.round(totalSetor).toLocaleString('id-ID')}`, 136, sumY, { align: "right" });

    // Footer info
    const footerY = 180;
    doc.line(12, footerY - 4, 136, footerY - 4);
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text("Laporan ini diterbitkan secara digital oleh sistem.", 12, footerY);
    doc.text("Harap dicocokkan dengan catatan fisik supplier masing-masing.", 12, footerY + 2.5);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text("Dibuat Oleh,", 136, footerY, { align: "right" });

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(sName, 136, footerY + 12, { align: "right" });

    doc.save(`REKAP-SUPPLIER-${supplierName.toUpperCase().replace(/\s+/g, "_")}-${startDateStr}_to_${endDateStr}.pdf`);
  }
}
