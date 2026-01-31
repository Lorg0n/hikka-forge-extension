import React from 'react';

const SimilarPageComponent: React.FC = () => {
    return (
        <main className="container mx-auto mt-8 px-4 lg:mt-16 max-w-3xl">
            <div className="flex flex-col gap-12">
                <div className="relative flex flex-col gap-4 rounded-lg border border-slate-200 p-4 bg-slate-100/50 backdrop-blur-sm">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-1 items-center gap-4">

                            <div className="group relative flex flex-col gap-2 w-12 shrink-0">
                                <div className="relative w-full aspect-[0.7] overflow-hidden rounded-md bg-slate-300">
                                    <img src="https://placehold.co/150x225" alt="Poster" className="size-full object-cover" />
                                </div>
                            </div>

                            <div className="flex flex-1 flex-col">
                                <div className="flex items-center gap-4">
                                    <a href="#" className="hover:underline text-left">
                                        <h4 className="font-bold text-base text-slate-900">Anime Title Goes Here</h4>
                                    </a>
                                </div>
                                <p className="text-sm text-slate-500">Anime Type</p>
                            </div>
                        </div>

                        <a href="#" className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16.15 13H5q-.425 0-.712-.288T4 12t.288-.712T5 11h11.15L13.3 8.15q-.3-.3-.288-.7t.288-.7q.3-.3.713-.312t.712.287L19.3 11.3q.15.15.213.325t.062.375t-.062.375t-.213.325l-4.575 4.575q-.3.3-.712.288t-.713-.313q-.275-.3-.288-.7t.288-.7z" /></svg>
                        </a>
                    </div>
                </div>

                <section className="flex flex-col gap-8">
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-lg">Media</h3>
                        <button className="px-3 py-0.5 text-xs font-medium rounded-sm bg-slate-200 text-slate-700">Music</button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">

                        <div className="flex flex-col gap-2">
                            <div className="aspect-square w-full rounded-md bg-slate-200 flex items-center justify-center text-slate-400">
                                <span>🎵</span>
                            </div>
                            <div className="mt-1">
                                <p className="text-xs text-slate-500 truncate">Opening</p>
                                <p className="text-sm font-medium line-clamp-2">Song Title Name</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="aspect-square w-full rounded-md bg-slate-200 flex items-center justify-center text-slate-400">
                                <span>🎵</span>
                            </div>
                            <div className="mt-1">
                                <p className="text-xs text-slate-500 truncate">Ending</p>
                                <p className="text-sm font-medium line-clamp-2">Another Song Title</p>
                            </div>
                        </div>

                    </div>
                </section>

            </div>
        </main>
    );
};

export default SimilarPageComponent;