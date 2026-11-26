import { useLocation } from 'react-router-dom';
import { auth } from '@/api/auth';
import { useQuery } from '@tanstack/react-query';
import { House } from 'lucide-react';
import { Button, Card } from '@/components/pathways/ui';
import { Amio } from '@/components/pathways/Amio';
import useTranslatedLines from '@/components/persona/useTranslatedLines';
import useAppLanguage, { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { ERROR_PAGE_LINES } from '@/components/shell/leftoverStrings';

// Page not found (Amio v2, amio-v2/leftovers): a paper page with Amio, the
// title, the address that wasn't found and the way back to Today. Admins
// also see a short note. Wording in ERROR_PAGE_LINES (pack set "error-pages").
export default function PageNotFound() {
    const location = useLocation();
    const pageName = location.pathname.substring(1);
    const [language] = useAppLanguage();
    const tr = useTranslatedLines(ERROR_PAGE_LINES, language, { cacheKey: 'error_pages_v1' });
    const t = (key) => (language !== 'en' && tr(key)) || ERROR_PAGE_LINES[key] || key;

    const { data: authData, isFetched } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            try {
                const user = await auth.me();
                return { user, isAuthenticated: true };
            } catch (error) {
                return { user: null, isAuthenticated: false };
            }
        }
    });

    const [before, after = ''] = t('not_found_body').split('{page}');
    return (
        <div dir={RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr'} className="min-h-screen bg-paper text-navy">
            <main id="main" className="mx-auto max-w-md px-4 pt-10 pb-8 flex flex-col gap-5">
                <Amio mood="thinking" size={64} />
                <h1 className="font-display text-[2rem] leading-tight" dir="auto">{t('not_found')}</h1>
                <p className="text-lg text-muted leading-relaxed" dir="auto">
                    {before}<bdi className="font-semibold text-navy">{pageName}</bdi>{after}
                </p>
                {isFetched && authData.isAuthenticated && authData.user?.role === 'admin' && (
                    <Card padding="p-4" className="space-y-1">
                        <p className="text-base font-semibold" dir="auto">{t('admin_note')}</p>
                        <p className="text-base text-muted leading-relaxed" dir="auto">{t('admin_note_body')}</p>
                    </Card>
                )}
                <Button variant="main" className="w-full" onClick={() => { window.location.href = '/'; }}>
                    <House className="w-5 h-5" aria-hidden="true" /> {t('go_home')}
                </Button>
            </main>
        </div>
    );
}
