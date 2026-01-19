import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Webhook, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface WebhookEvent {
  id: string;
  event_id: string;
  event_type: string;
  payload: any;
  created_at: string;
  processed_at: string;
}

const AdminWebhookStatus = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null);

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('admin_authenticated');
    if (!isAuthenticated) {
      navigate('/admin-auth');
      return;
    }
    loadEvents();
  }, [navigate]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('webhook_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading webhook events:', error);
      toast({
        title: 'Error',
        description: 'Failed to load webhook events',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getEventStatus = (eventType: string): 'success' | 'failed' | 'pending' => {
    if (eventType.includes('completed') || eventType.includes('processed')) {
      return 'success';
    }
    if (eventType.includes('failed') || eventType.includes('expired') || eventType.includes('cancelled')) {
      return 'failed';
    }
    return 'pending';
  };

  const getStatusBadge = (eventType: string) => {
    const status = getEventStatus(eventType);
    switch (status) {
      case 'success':
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Success
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const formatEventType = (eventType: string): string => {
    // Handle cases where event_type is a JSON object stringified
    if (eventType.startsWith('{')) {
      try {
        const parsed = JSON.parse(eventType);
        return parsed.name || eventType;
      } catch {
        return eventType;
      }
    }
    return eventType;
  };

  const getAmountFromPayload = (payload: any): string | null => {
    const amount = payload?.data?.amount?.value;
    if (amount) {
      // Monime webhook amounts are in cents, convert to whole Leones
      return `Le ${Math.round(amount / 100).toLocaleString()}`;
    }
    return null;
  };

  const getReferenceFromPayload = (payload: any): string | null => {
    return payload?.data?.metadata?.reference || payload?.data?.id || null;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin-dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Webhook className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-bold">Webhook Status</h1>
            <Button variant="outline" size="sm" className="ml-auto" onClick={loadEvents}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Webhook Endpoint
            </CardTitle>
          </CardHeader>
          <CardContent>
            <code className="text-xs bg-muted px-2 py-1 rounded break-all">
              https://rhtqsqpdvawlfqxlagxw.supabase.co/functions/v1/monime-webhook
            </code>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Recent Events ({events.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                Loading events...
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Webhook className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No webhook events received yet</p>
              </div>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedEvent(selectedEvent?.id === event.id ? null : event)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {formatEventType(event.event_type)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(event.created_at), 'MMM d, yyyy HH:mm:ss')}
                      </p>
                      {getAmountFromPayload(event.payload) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Amount: {getAmountFromPayload(event.payload)}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(formatEventType(event.event_type))}
                  </div>

                  {selectedEvent?.id === event.id && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs font-medium mb-2">Event Details</p>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p><span className="font-medium">Event ID:</span> {event.event_id}</p>
                        <p><span className="font-medium">Reference:</span> {getReferenceFromPayload(event.payload) || 'N/A'}</p>
                        <p><span className="font-medium">User ID:</span> {event.payload?.data?.metadata?.user_id || 'N/A'}</p>
                        <p><span className="font-medium">Status:</span> {event.payload?.data?.status || 'N/A'}</p>
                      </div>
                      <details className="mt-3">
                        <summary className="text-xs font-medium cursor-pointer text-primary">
                          View Full Payload
                        </summary>
                        <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-48">
                          {JSON.stringify(event.payload, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminWebhookStatus;
