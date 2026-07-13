// app/invoicing/services/CustomerInvoicePdfService.ts
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface CustomerInvoiceItem {
  sku: string;
  productName: string;
  qty: number;
  price: number;
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
  // Helper untuk mengonversi Hex Color (#RRGGBB) ke RGB array (Dipanggil via nama kelas langsung)
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

  public static generatePdf(invoice: CustomerInvoice) {
    if (!invoice) return alert("❌ Data invoice kosong, gagal memproses.");

    // Gunakan inisialisasi kelas secara langsung untuk menghindari error kehilangan scope "this" saat callback
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
    if (invoice.logoBase64 && typeof invoice.logoBase64 === "string" && invoice.logoBase64.startsWith("data:image/") && invoice.logoBase64.length > 50) {
      try {
        const imageFormat = CustomerInvoicePdfService.detectImageFormat(invoice.logoBase64);
        doc.addImage(invoice.logoBase64, imageFormat, 12, 11, 12, 12);
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

    // Label Column (X=12) | Colon (X=40) | Value (X=43)
    doc.text("Nama Pelanggan", 12, 39);
    doc.text(":", 40, 39);
    doc.setFont("Helvetica", "bold");
    doc.text(invoice.recipient || "-", 43, 39);
    doc.setFont("Helvetica", "normal");

    doc.text("Telp Pelanggan", 12, 43);
    doc.text(":", 40, 43);
    doc.text(invoice.recipientPhone || "-", 43, 43);

    doc.text("Alamat Pelanggan", 12, 47);
    doc.text(":", 40, 47);
    doc.text(invoice.recipientAddress || "-", 43, 47);

    doc.text("Tanggal Invoice", 12, 51);
    doc.text(":", 40, 51);
    doc.text(dateFormatted, 43, 51);

    doc.text("Jatuh Tempo", 12, 55);
    doc.text(":", 40, 55);
    doc.text(dueDateFormatted, 43, 55);

    // Ekstrak Referensi Keberapa Hari Ini dari invoiceNumber (Bagian ke-3: INV-TANGGAL-SEQ-RAND)
    const parts = invoice.invoiceNumber.split("-");
    const seqIndex = parts.length >= 3 ? parts[2] : "001";

    doc.text("Referensi Hari Ini", 12, 59);
    doc.text(":", 40, 59);
    doc.setFont("Helvetica", "bold");
    doc.text(seqIndex, 43, 59);
    doc.setFont("Helvetica", "normal");

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
      startY: 64, // Diturunkan agar tidak menimpa data metadata baru
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

    // --- RINGKASAN TOTAL AKHIR ---
    const finalY = ((doc as any).lastAutoTable?.finalY || 70) + 6;

    doc.setDrawColor(241, 245, 249);
    doc.line(12, finalY - 3, 136, finalY - 3);

    let currentY = finalY;

    // Subtotal
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text("Subtotal", 80, currentY);
    doc.text(`Rp ${Math.round(invoice.subtotal || 0).toLocaleString('id-ID')}`, 136, currentY, { align: "right" });

    // Discount (jika ada)
    if (invoice.discount > 0) {
      currentY += 4;
      doc.text("Diskon", 80, currentY);
      doc.text(`-Rp ${Math.round(invoice.discount).toLocaleString('id-ID')}`, 136, currentY, { align: "right" });
    }

    // Tax (jika ada)
    if (invoice.tax > 0) {
      currentY += 4;
      doc.text(`Pajak (${invoice.tax}%)`, 80, currentY);
      const taxAmount = ((invoice.subtotal || 0) - (invoice.discount || 0)) * (invoice.tax / 100);
      doc.text(`+Rp ${Math.round(taxAmount).toLocaleString('id-ID')}`, 136, currentY, { align: "right" });
    }

    // Grand Total
    currentY += 5;
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text("GRAND TOTAL", 80, currentY);
    doc.setTextColor(rgbColor[0], rgbColor[1], rgbColor[2]); // Warna tema
    doc.text(`IDR ${Math.round(invoice.total || 0).toLocaleString('id-ID')}`, 136, currentY, { align: "right" });

    // 🚀 TERBILANG NOMINAL AKHIR (Bahasa Indonesia)
    currentY += 4.5;
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    const terbilangText = `Terbilang: ${formatTerbilang(invoice.total)}`;
    const terbilangSplit = doc.splitTextToSize(terbilangText, 58);
    doc.text(terbilangSplit, 136, currentY, { align: "right" });

    // --- CATATAN & DETAIL REKENING TRANSFER ---
    let blockY = currentY + 12;
    if (invoice.notes || invoice.bankInfo) {
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text("INFORMASI PEMBAYARAN & CATATAN", 12, blockY);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);

      if (invoice.bankInfo) {
        blockY += 4.5;
        doc.setFont("Helvetica", "bold");
        doc.text("Transfer Bank:", 12, blockY);
        doc.setFont("Helvetica", "normal");
        const splitBank = doc.splitTextToSize(invoice.bankInfo, 60);
        doc.text(splitBank, 12, blockY + 3.5);
      }

      if (invoice.notes) {
        blockY += 4.5;
        doc.setFont("Helvetica", "bold");
        doc.text("Catatan:", 76, blockY);
        doc.setFont("Helvetica", "normal");
        const splitNotes = doc.splitTextToSize(invoice.notes, 60);
        doc.text(splitNotes, 76, blockY + 3.5);
      }
    }

    // --- FOOTER TANDA TANGAN (Digeser naik ke Y=168 agar tanda tangan tidak gepeng / terpotong halaman) ---
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
    
    // Tanda Tangan Gambar (Disesuaikan rasio agar tidak gepeng)
    let sigOffset = 0;
    if (invoice.signatureBase64 && typeof invoice.signatureBase64 === "string" && invoice.signatureBase64.startsWith("data:image/") && invoice.signatureBase64.length > 50) {
      try {
        const sigFormat = CustomerInvoicePdfService.detectImageFormat(invoice.signatureBase64);
        doc.addImage(invoice.signatureBase64, sigFormat, 118, footerY + 1.5, 16, 6);
        sigOffset = 7.5;
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
}
