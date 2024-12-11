'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import WalletIcon from '../components/WalletIcon';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Message {
    id?: string;
    sender: string;
    content: string;
    timestamp: Date;
    replyTo?: string;  // This will store the wallet address that AI is responding to
  }
  
type MessageFilter = 'all' | 'my-chat';
  
const MAX_CHARACTERS = 1000;
const MAX_AVG_CHARS_PER_WORD = 20;

export default function ChatPage() {
  const { connected, publicKey } = useWallet();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [messageFilter, setMessageFilter] = useState<MessageFilter>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filteredMessages = messages.filter(msg => {
    if (messageFilter === 'my-chat') {
      return msg.sender === publicKey?.toString() || 
             (msg.sender === 'EthicsBot' && msg.replyTo === publicKey?.toString());
    }
    return true;
  });  

  const FilterButtons = () => (
    <div className="flex gap-2 mb-4">
      <button
        onClick={() => setMessageFilter('all')}
        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors
          ${messageFilter === 'all' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
      >
        🌎 Global Chat
      </button>
      <button
        onClick={() => setMessageFilter('my-chat')}
        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors
          ${messageFilter === 'my-chat' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
      >
        👤 My Chat
      </button>
    </div>
  );  

  // Load message history
//   useEffect(() => {
//     const loadMessageHistory = async () => {
//       try {
//         // fetch recent messages from the backend
//         const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/messages/recent`);
//         if (!response.ok) throw new Error('Failed to fetch messages');
//         const data = await response.json();
//         setMessages(data.map((msg: any) => ({
//           ...msg,
//           timestamp: new Date(msg.timestamp)
//         })));
//       } catch (error) {
//         console.error('Error loading message history:', error);
//       }
//     };

//     if (connected) {
//       loadMessageHistory();
//     }
//   }, [connected]);

useEffect(() => {
    const loadMessageHistory = async () => {
      try {
        console.log('Loading message history...');
  
        // fetch recent messages from the backend
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/messages/recent`);
  
        // Check if the response is valid
        if (!response.ok) {
          console.error('Failed to fetch messages: HTTP error', response.status, response.statusText);
          throw new Error(`Failed to fetch messages: ${response.statusText}`);
        }
  
        const data = await response.json();
  
        // Check if the data is an array as expected
        if (!Array.isArray(data)) {
          console.error('Received data is not an array:', data);
          throw new Error('Received data is not an array');
        }
  
        // Process the messages
        setMessages(data.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
  
        console.log('Messages loaded successfully');
      } catch (error) {
        console.error('Error loading message history:', error);
  
        // You can add specific actions here if needed, like showing a user-friendly message or retrying.
        alert('There was an issue loading the message history. Please try again later.');
      }
    };
  
    // Only attempt to load message history if connected
    if (connected) {
      console.log('Connection established, loading message history...');
      loadMessageHistory();
    } else {
      console.log('Not connected. Skipping message history load.');
    }
  }, [connected]);

    useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setSocketConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setSocketConnected(false);
    });

    socketInstance.on('message', (newMessage: Message) => {
      console.log('Received message:', newMessage);
      setMessages(prev => [...prev, {
        ...newMessage,
        timestamp: new Date(newMessage.timestamp)
      }]);
    });

    socketInstance.on('error', (error: any) => {
      console.error('Socket error:', error);
      alert(`Error: ${error.message || 'Something went wrong'}`);
    });

    setSocket(socketInstance);

    return () => {
      console.log('Cleaning up socket connection');
      socketInstance.disconnect();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const validateMessage = (message: string): boolean => {
    const errorToastId = "error-toast"; // Unique ID for validation errors
  
    if (message.length > MAX_CHARACTERS) {
      if (!toast.isActive(errorToastId)) {
        toast.error(`Message exceeds the maximum allowed ${MAX_CHARACTERS} characters!`, { toastId: errorToastId });
      }
      return false;
    }
  
    const words = message.trim().split(/\s+/);
    const avgCharsPerWord = message.length / words.length;
    if (avgCharsPerWord > MAX_AVG_CHARS_PER_WORD) {
      if (!toast.isActive(errorToastId)) {
        toast.error(`Message has an average of more than ${MAX_AVG_CHARS_PER_WORD} characters per word.`, { toastId: errorToastId });
      }
      return false;
    }
  
    const alphanumericWithPunctuation = /^[a-zA-Z0-9\s.,!?'"-]+$/;
    if (!alphanumericWithPunctuation.test(message)) {
      if (!toast.isActive(errorToastId)) {
        toast.error('Message contains invalid characters. Only alphanumeric characters and standard punctuation are allowed.', { toastId: errorToastId });
      }
      return false;
    }
  
    return true;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateMessage(inputMessage)) return;

    if (!connected || !inputMessage.trim() || !socket || !publicKey) {
      console.log('Cannot send message:', {
        connected,
        hasInputMessage: !!inputMessage.trim(),
        hasSocket: !!socket,
        socketConnected,
        hasPublicKey: !!publicKey,
      });
      return;
    }

    setIsLoading(true);

    const messageData = {
      sender: publicKey.toString(),
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    console.log('Sending message:', messageData);

    socket.emit('send_message', messageData, (response: any) => {
      console.log('Message send response:', response);
    });

    setInputMessage('');
    setIsLoading(false);
  };

  const MessageBubble = ({ message }: { message: Message }) => {
    const isAI = message.sender === 'EthicsBot';
    const isCurrentUser = message.sender === publicKey?.toString();
  
    return (
      <div className={`flex items-start gap-2 ${isAI ? 'justify-start' : 'justify-end'}`}>
        {isAI && (
          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold">
            AI
          </div>
        )}
        
        <div
          className={`max-w-[70%] rounded-lg p-3 ${
            isAI 
              ? 'bg-gray-700' 
              : 'bg-blue-600'
          }`}
        >
          {!isAI && isCurrentUser && (
            <div className="text-xs opacity-75 mb-1">
              You
            </div>
          )}
          <p className="break-words">{message.content}</p>
          <div className="text-xs opacity-50 mt-2 pt-2 border-t border-gray-600 flex items-center justify-between">
            <span>
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
            {isAI && message.replyTo && (
              <div className="flex items-center gap-1">
                <span className="text-gray-400">replied to:</span>
                <WalletIcon address={message.replyTo} size={16} />
              </div>
            )}
          </div>
        </div>
  
        {!isAI && (
          <WalletIcon address={message.sender} size={32} />
        )}
      </div>
    );
  };

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black">
        <h2 className="text-2xl font-bold text-white mb-8">
          Connect your wallet to join the challenge
        </h2>
        <WalletMultiButton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <ToastContainer position="top-right" autoClose={3000} theme="dark" limit={1}/>
      
      <div className="max-w-4xl mx-auto h-screen flex flex-col p-4">
      <header className="flex justify-between items-center mb-4">
        <div>
            <h1 className="text-2xl font-bold">HackTheAI Challenge</h1>
            <p className="text-sm text-gray-400">
            {socketConnected ? (
                <span className="text-green-500">●</span>
            ) : (
                <span className="text-red-500">●</span>
            )}
            {' '}
            {socketConnected ? 'Connected' : 'Disconnected'}
            </p>
            <div className="text-sm text-gray-400 flex items-center gap-2">
            <WalletIcon address={publicKey?.toString() || ''} size={16} />
            <span>
                {publicKey?.toString().slice(0, 4)}...{publicKey?.toString().slice(-4)}
            </span>
            </div>
        </div>
        <WalletMultiButton />
        </header>
        <FilterButtons />

        <div className="flex-1 overflow-y-auto bg-gray-900 rounded-lg p-4 mb-4">
          {filteredMessages.length === 0 ? (
            <p className="text-gray-500 text-center">No messages yet. Start the conversation!</p>
          ) : (
            <div className="space-y-4">
              {filteredMessages.map((msg, index) => (
                <MessageBubble key={msg.id || index} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading || !socketConnected}
          />
          <button
            type="submit"
            disabled={isLoading || !socketConnected || !inputMessage.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold
              disabled:opacity-50 disabled:cursor-not-allowed
              hover:bg-blue-700 transition-colors"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}