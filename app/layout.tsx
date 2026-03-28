import { AuthProvider } from "../context/AuthContext"; // <-- Impor
import Sidebar from "@/components/Sidebar";
import "./globals.css";

export const metadata = {
  title: "Osho Tools",
  description: "A collection of useful tools",
};

export default function RootLayout({ 
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider> {/* <-- Bungkus di sini */}
          <Sidebar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}