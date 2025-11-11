"use client";

// Definisikan tipe untuk props agar lebih rapi
interface Counter {
  id: string;
  name: string;
  count: number;
}

interface CounterItemProps {
  counter: Counter;
  onUpdate: (id: string, amount: number) => void;
  onDelete: (id: string) => void;
  onReset: (id: string) => void; // <-- Tambahkan prop baru
}

// Tambahkan 'onReset' ke dekonstruksi props
export default function CounterItem({ counter, onUpdate, onDelete, onReset }: CounterItemProps) {
  return (
    <div
      className="flex h-full flex-col items-center justify-between gap-4 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800"
    >
      {/* Nama Counter dan Tombol Aksi */}
      <div className="flex-grow text-center">
        <h3 className="text-2xl font-semibold dark:text-white">
          {counter.name}
        </h3>
        
        {/* ========================================================== */}
        {/* --- PERUBAHAN 1: Tombol Reset Ditambahkan --- */}
        {/* ========================================================== */}
        <div className="mt-1 flex justify-center gap-4">
          <button
            onClick={() => onDelete(counter.id)}
            className="text-sm text-red-500 hover:underline dark:text-red-400"
          >
            Hapus
          </button>
          <button
            onClick={() => onReset(counter.id)} // <-- Tombol baru
            className="text-sm text-blue-500 hover:underline dark:text-blue-400"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Kontrol Counter */}
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