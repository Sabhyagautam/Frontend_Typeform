import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import KeepAlive from "@/components/KeepAlive";

export const metadata: Metadata = {
  title: "Typeform",
  description: "Create beautiful forms and surveys",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        {/* Pings the backend every 10 minutes to prevent Render cold starts */}
        <KeepAlive />
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: "#1a1a1a",
              color: "#fff",
              borderRadius: "8px",
              fontSize: "13.5px",
              padding: "12px 16px",
              fontFamily: "'Inter', sans-serif",
            },
            duration: 3000,
          }}
        />
      </body>
    </html>
  );
}
