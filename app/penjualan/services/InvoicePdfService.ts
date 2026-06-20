// app/penjualan/services/InvoicePdfService.ts
import { jsPDF } from "jspdf";
// 🚀 PERBAIKAN IMPORT: Ambil fungsi inti autotable secara gamblang
import autoTable from "jspdf-autotable";

export class InvoicePdfService {
  /**
   * Fungsi Otomatisasi Cetak Nota PDF Profesional Sekali Klik
   * @param tx Data Objek Transaksi Tunggal dari Firestore Penjualan
   */
  public static generateInvoice(tx: any) {
    if (!tx) return alert("❌ Objek data transaksi kosong, gagal memproses nota.");

    // 1. Inisialisasi Kertas Ukuran A5
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a5"
    });

    // 🎯 PENYESUAIAN BRAND: Identitas utama dikunci ke Simple and Yours
    const brandName = "Simple and Yours";
    const dateStr = tx.createdAt?.toDate 
      ? tx.createdAt.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    // --- STYLING HEADER IDENTITAS BRAND ---
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42); 
    doc.text(brandName, 12, 16);

    doc.setFontSize(8);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(148, 163, 184); 
    doc.text("Perlengkapan Rumah Tangga & Hardware", 12, 21);
    doc.text("Kota Tangerang, Banten, Indonesia", 12, 25);
    
    // 🚀 PENAMBAHAN EMAIL: Menyisipkan email resmi SNY di baris metadata perusahaan
    doc.setTextColor(0, 71, 171); // Aksen biru elgant khusus tautan email
    doc.text("Email: sny.osho@gmail.com", 12, 29);

    // --- STRIP LABEL UTAMA "INVOICE" DI KANAN ATAS ---
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(0, 71, 171); 
    doc.text("INVOICES", 136, 16, { align: "right" });

    doc.setFontSize(8);
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(71, 85, 105); 
    doc.text(`ID: #${tx.orderId || "MANUAL"}`, 136, 21, { align: "right" });

    // Garis pembatas tebal pembuka dokumen (Diturunkan sedikit ke koordinat Y=33 karena ada email)
    doc.setDrawColor(241, 245, 249); 
    doc.setLineWidth(0.5);
    doc.line(12, 33, 136, 33);

    // --- BLOK METADATA TUJUAN & LOGISTIK ---
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text("INFORMASI INVOICE", 12, 40);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);

    // 🚀 TEKNIK AMAN ALIGNMENT TITIK DUA (:): 
    // Kolom Label (Sumbu X = 12) | Karakter Titik Dua (Sumbu X = 42 Tegak Lurus) | Isi Konten (Sumbu X = 45)
    
    // Baris 1: Tanggal Nota
    doc.text("Tanggal Invoice", 12, 46);
    doc.text(":", 42, 46);
    doc.text(`${dateStr}`, 45, 46);

    // Baris 2: Penerima
    doc.text("Penerima", 12, 50);
    doc.text(":", 42, 50);
    doc.text(`${tx.recipient || tx.customerName || tx.namaPenerima || "-"}`, 45, 50);

    // Baris 3: Nomor Pengiriman / Resi
    doc.text("Nomor Pengiriman", 12, 54);
    doc.text(":", 42, 54);
    doc.text(`${tx.resi || "-"}`, 45, 54);

    // Baris 4: Marketplace / Kanal Pasar
    doc.text("Marketplace", 12, 58);
    doc.text(":", 42, 58);
    doc.text(`${tx.marketplace || "-"}`, 45, 58);

    // --- MENYUSUN DAFTAR MATRIKS ITEM BARANG ---
    const tableBody: any[] = [];
    if (tx.items && tx.items.length > 0) {
      tx.items.forEach((item: any, index: number) => {
        const itemPrice = Number(item.manualPrice) || (Number(tx.total) / Number(tx.qty || 1));
        tableBody.push([
          index + 1,
          String(item.sku || tx.sku || "CUSTOM").toUpperCase(), 
          String(item.productName || tx.product || "Produk Retail"), 
          `${item.qty} Pcs`,
          `Rp ${Math.round(itemPrice).toLocaleString('id-ID')}`,
          `Rp ${Math.round(itemPrice * item.qty).toLocaleString('id-ID')}`
        ]);
      });
    } else {
      const fallbackPrice = Number(tx.total || 0) / Number(tx.qty || 1);
      tableBody.push([
        1,
        String(tx.sku || "CUSTOM").toUpperCase(),
        String(tx.product || "Produk Luar Katalog"),
        `${tx.qty || 1} Pcs`,
        `Rp ${Math.round(fallbackPrice).toLocaleString('id-ID')}`,
        `Rp ${Math.round(tx.total || 0).toLocaleString('id-ID')}`
      ]);
    }

    // 🚀 RENDERING AUTOTABLE 6 KOLOM (startY dinaikkan ke 63 menyesuaikan letak metadata baru)
    autoTable(doc, {
      startY: 63, 
      margin: { left: 12, right: 12 },
      head: [["NO", "SKU", "DESKRIPSI PRODUK", "QTY", "HARGA SATUAN", "SUBTOTAL"]],
      body: tableBody,
      theme: "striped",
      headStyles: {
        fillColor: [0, 71, 171], 
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: "bold",
        halign: "left"
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [51, 65, 85],
        font: "Helvetica"
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" }, 
        1: { cellWidth: 22 },                  
        2: { cellWidth: "auto" },              
        3: { cellWidth: 14, halign: "center" }, 
        4: { cellWidth: 24, halign: "right" },  
        5: { cellWidth: 24, halign: "right" }   
      },
      styles: {
        cellPadding: 2.5
      }
    });

    // --- BLOK PERHITUNGAN FOOTER KALKULASI TOTAL ---
    const finalY = ((doc as any).lastAutoTable?.finalY || 74) + 8;

    doc.setDrawColor(241, 245, 249);
    doc.line(12, finalY - 4, 136, finalY - 4);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text("TOTAL", 12, finalY);

    doc.setFontSize(11);
    doc.setTextColor(0, 71, 171);
    doc.text(`IDR ${Math.round(tx.total || 0).toLocaleString('id-ID')}`, 136, finalY, { align: "right" });

    // --- TANDA TANGAN & NOTA PENUTUP ---
    const footerY = finalY + 16;
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text("Terima kasih telah berbelanja dengan kami.", 12, footerY);
    doc.text("Dokumen ini sah diterbitkan otomatis oleh sistem invoice digital.", 12, footerY + 3);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text("Hormat Kami,", 136, footerY, { align: "right" });
    doc.text("Simple and Yours", 136, footerY + 12, { align: "right" });

    doc.save(`INVOICE-${String(tx.orderId || tx.id).toUpperCase()}.pdf`);
  }
}