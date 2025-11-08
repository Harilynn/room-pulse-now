import { useState, useEffect, useRef } from "react";
import { supabase, Branch } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Send, MessageSquare } from "lucide-react";

interface Message {
  id: string;
  sender_id: string;
  sender_branch: Branch;
  message: string;
  created_at: string;
  sender?: {
    name: string;
  };
}

interface Props {
  userBranch: Branch;
  userId: string;
  userName: string;
}

const CRChat = ({ userBranch, userId, userName }: Props) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();

    // Subscribe to realtime messages
    const channel = supabase
      .channel("cr-chat")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "cr_chat_messages",
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("cr_chat_messages")
      .select(`
        *,
        sender:profiles!sender_id(name)
      `)
      .order("created_at", { ascending: true })
      .limit(100);

    if (!error && data) {
      setMessages(data as any);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
      const { error } = await supabase.from("cr_chat_messages").insert({
        sender_id: userId,
        sender_branch: userBranch,
        message: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage("");
    } catch (error: any) {
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="glass p-4 sm:p-6 hover-lift flex flex-col h-[calc(100vh-12rem)]">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        <h2 className="text-xl sm:text-2xl font-bold gradient-text">CR Chat</h2>
      </div>

      <ScrollArea className="flex-1 pr-2 sm:pr-4 mb-4">
        <div className="space-y-3 sm:space-y-4">
          {messages.map((msg) => {
            const isOwn = msg.sender_id === userId;
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 py-2 sm:px-4 sm:py-2 ${
                    isOwn
                      ? "bg-primary text-primary-foreground"
                      : "glass"
                  }`}
                >
                  {!isOwn && (
                    <p className="text-xs font-semibold mb-1">
                      {msg.sender?.name || "Unknown"} • {msg.sender_branch}
                    </p>
                  )}
                  <p className="break-words text-sm sm:text-base">{msg.message}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}
                  >
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSend} className="flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="glass flex-1 text-sm sm:text-base"
          disabled={isSending}
        />
        <Button type="submit" disabled={isSending || !newMessage.trim()} className="hover-glow" size="sm">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </Card>
  );
};

export default CRChat;
