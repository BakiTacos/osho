import { AuthProvider } from "../context/AuthContext"; // <-- Impor
import Navbar from "../components/Navbar";
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
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}