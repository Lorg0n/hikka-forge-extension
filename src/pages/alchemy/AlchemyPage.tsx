import React from 'react';

function AlchemyPage() {
    return (
        <div className="container mx-auto p-8 bg-background text-foreground min-h-screen">
            <header className="text-center mb-12">
                <h1 className="font-display text-5xl font-bold">Hikka Alchemy</h1>
                <p className="text-muted-foreground mt-2">Змішуйте аніме та жанри, щоб відкривати нові!</p>
            </header>

            <main>
                <div className="flex justify-center items-center h-64 border-2 border-dashed border-secondary rounded-lg">
                    <p className="text-xl text-muted-foreground">Ігрове поле</p>
                </div>
            </main>
        </div>
    );
}

export default AlchemyPage;
