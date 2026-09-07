'use client';

import { Spinner } from '@/components/Spinner';

export default function SpinnerPage() {
    return (
        <div className="fixed top-0 left-0 w-full h-[100dvh] z-[999999] flex items-center justify-center bg-[#ebebeb]">
            <Spinner />
        </div>
    );
}
