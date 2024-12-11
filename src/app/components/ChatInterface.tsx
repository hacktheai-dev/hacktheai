'use client';

import { FC, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Socket } from 'socket.io-client';
import { WalletConnect } from './WalletConnect';

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  socket: Socket;
}

export const ChatInterface: FC<ChatInterfaceProps> = ({ socket }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const { connected, publicKey } = useWallet();

  useEffect(() => {
    if (!socket) return;

    socket.on('message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      socket.off('message');
    };
  }, [socket]);

  const handleSendMessage = async () => {
    if (!connected || !inputMessage.trim() || !publicKey) return;

    const message = {
      sender: publicKey.toString(),
      content: inputMessage,
      timestamp: new Date(),
    };

    socket.emit('send_message', message);
    setInputMessage('');
  };

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <WalletConnect />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 rounded-lg ${
              msg.sender === publicKey?.toString()
                ? 'bg-blue-500 text-white ml-auto'
                : 'bg-gray-200 mr-auto'
            } max-w-[70%]`}
          >
            <p className="text-sm opacity-75">
              {msg.sender.slice(0, 4)}...{msg.sender.slice(-4)}
            </p>
            <p>{msg.content}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          className="flex-1 p-2 border rounded-lg"
          placeholder="Type your message..."
        />
        <button
          onClick={handleSendMessage}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg"
        >
          Send
        </button>
      </div>
    </div>
  );
};