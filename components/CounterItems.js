"use client";

export default function CounterItem({ counter, onUpdate, onDelete }) {
  return (
    // MODIFIKASI: Layout internal diubah menjadi selalu vertikal (sm:flex-row dihapus)
    // dan tinggi minimum ditambahkan agar kartu sejajar
    <div
      className="flex h-full flex-col items-center justify-between gap-4 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800"
    >
      {/* Nama Counter dan Tombol Hapus */}
      {/* MODIFIKASI: Teks selalu di tengah (sm:text-left dihapus) */}
      <div className="flex-grow text-center">
        <h3 className="text-2xl font-semibold dark:text-white">
          {counter.name}
        </h3>
        <button
          onClick={() => onDelete(counter.id)}
          className="text-sm text-red-500 hover:underline dark:text-red-400"
        >
          Hapus Counter
        </button>
      </div>

      {/* Kontrol Counter */}
      {/* MODIFIKASI: Margin atas ditambahkan untuk memberi jarak */}
      <div className="mt-4 flex w-full items-center justify-center gap-4 sm:w-auto">
        <button
          onClick={() => onUpdate(counter.id, -1)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-2xl font-semibold text-white transition-colors hover:bg-red-600"
        >
          -
        </button>
        <p className="w-20 text-center text-5xl font-mono dark:text-white">
          {counter.count}
        </p>
        <button
          onClick={() => onUpdate(counter.id, 1)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-2xl font-semibold text-white transition-colors hover:bg-green-600"
        >
          +
        </button>
      </div>
    </div>
  );
}