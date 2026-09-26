
import React from 'react';

const Header: React.FC = () => {
    return (
        <header className="text-center mb-10">
            <h1 className="text-4xl md:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500 pb-2">
                Kahani
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
                Turn your child's imagination and your loving lessons into a magical cartoon adventure.
            </p>
        </header>
    );
};

export default Header;
