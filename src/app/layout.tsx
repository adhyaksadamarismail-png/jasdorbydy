import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Jasdorbydy | Jasa Order F&B",
  description: "JasDor / Jasa Order minuman dan makanan terpercaya. Order Kopi Kenangan cepat, mudah, dan langsung via WhatsApp.",
  keywords: ["Jasa Order", "JasDor", "Jasdorbydy", "Order Kopi Kenangan", "Order F&B"],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        <div className="mobile-container min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
