import { ThemeProvider } from "@/components/theme-provider";
import Header from "./header/page";
import Footer from "./footer/page";
import LoadingProvider from "../loading-provider";
import ToastProvider from "@/components/toast-provider";

export default function UserLayout({ children }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <Header />

      <LoadingProvider>
        <main className="flex-1 w-full mt-[110px]">{children}</main>
      </LoadingProvider>

      <Footer />
      <ToastProvider />
    </ThemeProvider>
  );
}
