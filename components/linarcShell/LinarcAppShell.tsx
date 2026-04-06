import React, { useState } from 'react';
import Header from './v2/Header';
import Sidebar from './v2/Sidebar';

export type LinarcBookmarksData = {
    bookmarks: Array<{
        categoryKey: string;
        itemKey: string;
        label: string;
        description: string;
        icon: React.ReactNode;
        navIcon: React.ReactNode;
    }>;
    toggleBookmark: (categoryKey: string, itemKey: string) => void;
    handleSelect: (categoryKey: string, subcategoryKey: string) => void;
};

/**
 * Linarc product chrome from mainnav/new/v2 (Linarc-Data-Sheet-Table):
 * top navigation + icon rail; main app content renders in the right column.
 */
export const LinarcAppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [bookmarksData, setBookmarksData] = useState<LinarcBookmarksData | null>(null);

    return (
        <div className="flex h-screen min-h-0 w-full flex-col overflow-hidden bg-white font-sans text-gray-800 dark:bg-[#1a1a1a] dark:text-gray-200">
            <Header
                version="v2"
                onSelectionChange={() => {}}
                onBookmarksDataChange={setBookmarksData}
            />
            <div className="flex flex-1 min-h-0 overflow-hidden">
                <Sidebar
                    version="v2"
                    bookmarks={bookmarksData?.bookmarks ?? []}
                    onSelect={bookmarksData?.handleSelect}
                    onToggleBookmark={bookmarksData?.toggleBookmark}
                />
                <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white dark:bg-zinc-900">
                    {children}
                </div>
            </div>
        </div>
    );
};
