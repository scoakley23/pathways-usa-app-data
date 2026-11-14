import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { House } from 'lucide-react';
import { Button, CreamSheet, NavyTop } from '@/components/pathways/ui';


export default function PageNotFound({}) {
    const location = useLocation();
    const pageName = location.pathname.substring(1);

    const { data: authData, isFetched } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            try {
                const user = await base44.auth.me();
                return { user, isAuthenticated: true };
            } catch (error) {
                return { user: null, isAuthenticated: false };
            }
        }
    });
    
    // The Road: a navy top says where you are (404, Page Not Found); the
    // cream sheet holds the message and the way home.
    return (
        <div className="min-h-screen bg-cream text-ink">
            <NavyTop className="pb-14 pt-12">
                <div className="mx-auto max-w-md space-y-2">
                    <p className="text-label uppercase text-on-navy">404</p>
                    <h1 className="font-display text-[34px] leading-[1.1]">Page Not Found</h1>
                </div>
            </NavyTop>
            <CreamSheet>
                <div className="mx-auto max-w-md space-y-6 pb-8">
                    <p className="text-lg text-ink-2 leading-relaxed">
                        The page <span className="font-semibold text-ink">&quot;{pageName}&quot;</span> could not be found in this application.
                    </p>
                    {isFetched && authData.isAuthenticated && authData.user?.role === 'admin' && (
                        <div className="p-4 bg-white rounded-card border border-card-line space-y-1">
                            <p className="text-base font-semibold">Admin Note</p>
                            <p className="text-base text-ink-2 leading-relaxed">
                                This could mean that the AI hasn&apos;t implemented this page yet. Ask it to implement it in the chat.
                            </p>
                        </div>
                    )}
                    <Button variant="next" className="min-h-[52px]" onClick={() => { window.location.href = '/'; }}>
                        <House className="w-5 h-5" aria-hidden="true" /> Go Home
                    </Button>
                </div>
            </CreamSheet>
        </div>
    );
}
