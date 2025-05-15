"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, Smile } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (messageText: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t bg-card">
      <div className="flex items-center space-x-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 resize-none min-h-[40px] max-h-[120px] focus-visible:ring-1 focus-visible:ring-primary"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          rows={1}
          disabled={disabled}
        />
         <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" disabled={disabled}>
          <Paperclip className="h-5 w-5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" disabled={disabled}>
          <Smile className="h-5 w-5" />
        </Button>
        <Button type="submit" size="icon" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={disabled || !message.trim()}>
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </form>
  );
}
