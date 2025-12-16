import './globals.css';
import { Providers } from './providers';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="zh-TW">
            <body className="m-full">
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}