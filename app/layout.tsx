import { AuthProvider } from '@/contexts/AuthContext'
import { LoginModal } from '@/components/LoginModal'
import MixpanelProvider from '@/components/MixpanelProvider'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" style={{ background: '#08090F' }}>
      <head>
        <script type="text/javascript" dangerouslySetInnerHTML={{ __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "wsdruf81ub");` }} />
        <script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer></script>
        <script dangerouslySetInnerHTML={{ __html: `window.OneSignalDeferred = window.OneSignalDeferred || []; OneSignalDeferred.push(async function(OneSignal) { await OneSignal.init({ appId: "9c3de50e-e4e1-4667-b3a1-f254def319c2" }); });` }} />
      </head>
      <body className="font-sans antialiased" style={{ background: '#08090F' }}>
        <AuthProvider>
          <MixpanelProvider />
          {children}
          <LoginModal />
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </AuthProvider>
      </body>
    </html>
  )
}
