import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import { LogoFull, LogoIcon } from "./components/logo";
import InstallButton from "./components/install-button";
import { CityProvider } from "./components/city-detector";
import Analytics from "./components/analytics";
import MobileBottomNav from "./components/mobile-bottom-nav";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-brand",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Chamei — Encontre profissionais de confiança",
  description:
    "Os melhores profissionais do Brasil em um só lugar! Compare avaliações e chame direto pelo WhatsApp.",
  keywords:
    "profissionais brasil, eletricista perto de mim, encanador, pedreiro, diarista, serviços residenciais, reformas",
  openGraph: {
    title: "Chamei — Profissionais de confiança",
    description:
      "Os melhores profissionais do Brasil em um só lugar! Compare avaliações e chame direto pelo WhatsApp.",
    url: "https://chamei.app",
    siteName: "Chamei",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-F25QH1T5FE" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-F25QH1T5FE');
            `,
          }}
        />
        <meta name="google-site-verification" content="ox7R7wPE7pzhpE4cLZR-Y4wWduJ7msFfFh0i2os9gjs" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563EB" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Chamei" />
        <link rel="apple-touch-icon" href="/logo.svg" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Chamei",
              url: "https://chamei.app",
              description:
                "Plataforma gratuita que conecta profissionais a clientes no Brasil",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://chamei.app/buscar?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${jakarta.variable} ${spaceGrotesk.variable} font-sans antialiased bg-gray-50 text-gray-900`}
      >
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <a href="/">
              <LogoFull />
            </a>
            <nav className="flex items-center gap-3">
              <a
                href="/para-profissionais"
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors hidden sm:block"
              >
                Para Profissionais
              </a>
              <a
                href="/blog"
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors hidden sm:block"
              >
                Blog
              </a>
              <a
                href="/para-profissionais"
                className="bg-gray-900 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Cadastre-se grátis
              </a>
            </nav>
          </div>
        </header>

        <main className="min-h-screen">
          <CityProvider>{children}</CityProvider>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-100 bg-white">
          <div className="max-w-5xl mx-auto px-4 py-10">
            <div className="flex flex-col sm:flex-row justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <LogoIcon size={22} />
                  <span className="font-semibold text-gray-900 text-sm font-display">chamei.app</span>
                </div>
                <p className="text-xs text-gray-400 max-w-xs">
                  Plataforma gratuita que conecta profissionais a clientes no Brasil.
                </p>
              </div>
              <div className="flex gap-8 text-xs text-gray-500">
                <div className="space-y-2">
                  <p className="font-medium text-gray-700 uppercase tracking-wider text-[10px]">Para você</p>
                  <a href="/categoria/eletricista" className="block hover:text-gray-700">Eletricistas</a>
                  <a href="/categoria/encanador" className="block hover:text-gray-700">Encanadores</a>
                  <a href="/categoria/pedreiro" className="block hover:text-gray-700">Pedreiros</a>
                  <a href="/categoria/diarista" className="block hover:text-gray-700">Diaristas</a>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-gray-700 uppercase tracking-wider text-[10px]">Chamei</p>
                  <a href="/para-profissionais" className="block hover:text-gray-700">Para Profissionais</a>
                  <a href="/para-profissionais#cadastro" className="block hover:text-gray-700">Cadastre-se</a>
                  <a href="/blog" className="block hover:text-gray-700">Blog</a>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-100 mt-8 pt-6 text-[11px] text-gray-400">
              Chamei.app — São Paulo, SP
            </div>
          </div>
        </footer>
        <InstallButton />
        <Analytics />
        <MobileBottomNav />
        {/* Bottom padding for mobile nav */}
        <div className="h-14 sm:hidden" aria-hidden="true" />
      </body>
    </html>
  );
}
