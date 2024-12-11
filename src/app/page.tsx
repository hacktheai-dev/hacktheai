// frontend/src/app/page.tsx
'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black">
      <div className="relative flex place-items-center">
        <h1 className="text-6xl font-bold text-white mb-8">
          Hack<span className="text-blue-500">The</span>AI
        </h1>
      </div>
      
      <button
        onClick={() => router.push('/chat')}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors duration-200"
      >
        Join Current Challenge
      </button>
      
      <p className="mt-4 text-sm text-gray-400">
        Connect your wallet to participate in the AI hacking challenge
      </p>
    </main>
  );
}