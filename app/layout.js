import "./globals.css";

export const metadata = {
  title: "Sentinel — Risk verification for X Layer",
  description: "An AI agent that flags manipulation and risk signals on X Layer before you trade.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
