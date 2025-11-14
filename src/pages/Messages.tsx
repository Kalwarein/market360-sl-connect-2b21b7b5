import { MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import BottomNav from '@/components/BottomNav';

const Messages = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-gradient-to-r from-primary to-secondary text-white p-6">
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-sm opacity-90">Chat with sellers</p>
      </div>

      <div className="p-4">
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No messages yet</p>
            <p className="text-sm mt-2">
              Start a conversation with a seller to see your messages here
            </p>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default Messages;