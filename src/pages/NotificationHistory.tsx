import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, BellOff, ExternalLink, Calendar, TrendingUp, CheckCircle2, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/hooks/use-toast";
import MobileNavBar from "@/components/MobileNavBar";

interface NotificationHistoryItem {
  id: string;
  job_id: string;
  match_score: number;
  title: string;
  body: string;
  sent_at: string;
  read_at: string | null;
  clicked_at: string | null;
  dismissed_at: string | null;
  jobs: {
    title: string;
    company: string;
    location: string | null;
    is_active: boolean;
  };
}

const NotificationHistory = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<NotificationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "clicked">("all");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("notification_history")
        .select(`
          *,
          jobs (
            title,
            company,
            location,
            is_active
          )
        `)
        .eq("user_id", user!.id)
        .order("sent_at", { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load notification history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsClicked = async (notificationId: string) => {
    try {
      await supabase
        .from("notification_history")
        .update({ clicked_at: new Date().toISOString() })
        .eq("id", notificationId);
    } catch (error) {
      console.error("Failed to mark notification as clicked:", error);
    }
  };

  const handleNavigateToJob = async (notification: NotificationHistoryItem) => {
    await markAsClicked(notification.id);
    navigate(`/swipe?jobId=${notification.job_id}`);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.read_at;
    if (filter === "clicked") return n.clicked_at;
    return true;
  });

  const stats = {
    total: notifications.length,
    unread: notifications.filter((n) => !n.read_at).length,
    clicked: notifications.filter((n) => n.clicked_at).length,
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8 md:pt-16">
      <TopBar />

      {/* Desktop header */}
      <div className="hidden md:block">
        <div className="container max-w-4xl mx-auto px-3 md:px-4 py-6 md:py-8">
          <div className="mb-4 md:mb-6">
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground mt-2">
              View and manage your notification history
            </p>
          </div>
        </div>
      </div>

      {/* Mobile header - simple title only */}
      <div className="md:hidden pt-4 pb-2 px-4">
        <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
          Notifications
        </h1>
      </div>

      <div className="container max-w-4xl mx-auto px-4 md:py-0 py-4">
        <div className="mb-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Bell className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Unread</p>
                    <p className="text-2xl font-bold">{stats.unread}</p>
                  </div>
                  <BellOff className="h-8 w-8 text-amber-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Clicked</p>
                    <p className="text-2xl font-bold">{stats.clicked}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="unread">Unread ({stats.unread})</TabsTrigger>
            <TabsTrigger value="clicked">Clicked ({stats.clicked})</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Notifications List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BellOff className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">No notifications yet</p>
              <p className="text-sm text-muted-foreground">
                {filter === "all"
                  ? "You'll see job match notifications here when you receive them"
                  : `No ${filter} notifications`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`transition-all hover:shadow-md ${
                  !notification.clicked_at ? "border-l-4 border-l-primary" : ""
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={notification.jobs.is_active ? "default" : "secondary"}>
                          {notification.match_score}% Match
                        </Badge>
                        {notification.clicked_at && (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Viewed
                          </Badge>
                        )}
                        {!notification.jobs.is_active && (
                          <Badge variant="secondary">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">{notification.jobs.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {notification.jobs.company}
                        {notification.jobs.location && ` • ${notification.jobs.location}`}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm">{notification.body}</p>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(notification.sent_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>

                    <Button
                      onClick={() => handleNavigateToJob(notification)}
                      className="w-full"
                      disabled={!notification.jobs.is_active}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {notification.jobs.is_active ? "View Job" : "Job No Longer Available"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <MobileNavBar />
    </div>
  );
};

export default NotificationHistory;
