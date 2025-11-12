import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  responseTime?: number;
  rawResponse?: any;
  request?: any;
}

const Test = () => {
  const [message, setMessage] = useState("");
  const [useToolCalling, setUseToolCalling] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [availableModels, setAvailableModels] = useState<any>(null);
  const { toast } = useToast();

  const discoverModels = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("test-llm-chat", {
        body: { discoverModels: true },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || "Failed to discover models");
      }

      setAvailableModels(data.models);
      toast({
        title: "✅ Models Discovered",
        description: `Found ${data.models?.data?.length || 0} model(s)`,
      });
    } catch (error: any) {
      console.error("Error discovering models:", error);
      toast({
        title: "❌ Discovery Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = message;
    setMessage("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("test-llm-chat", {
        body: {
          message: userMessage,
          useToolCalling,
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || "Unknown error");
      }

      const assistantContent =
        data.data?.choices?.[0]?.message?.content ||
        JSON.stringify(data.data?.choices?.[0]?.message?.tool_calls || "No response");

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: assistantContent,
          responseTime: data.responseTime,
          rawResponse: data.data,
          request: data.request,
        },
      ]);

      toast({
        title: "✅ Success",
        description: `Response in ${data.responseTime}ms`,
      });
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "❌ Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>LLM Test Chat</CardTitle>
            <p className="text-sm text-muted-foreground">
              Test vLLM endpoint with simple chat and tool calling
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Chat Messages */}
            <ScrollArea className="h-96 border rounded-lg p-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Send a message to start testing
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, idx) => (
                    <div key={idx}>
                      <div
                        className={`p-3 rounded-lg ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground ml-12"
                            : "bg-muted mr-12"
                        }`}
                      >
                        <div className="font-semibold text-xs mb-1">
                          {msg.role === "user" ? "You" : "Assistant"}
                          {msg.responseTime && (
                            <span className="ml-2 text-muted-foreground">
                              ({msg.responseTime}ms)
                            </span>
                          )}
                        </div>
                        <div className="text-sm whitespace-pre-wrap">
                          {msg.content}
                        </div>
                      </div>

                      {/* Debug Info */}
                      {msg.rawResponse && showDebug && (
                        <details className="mt-2 text-xs">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            View Debug Info
                          </summary>
                          <div className="mt-2 space-y-2">
                            <div>
                              <strong>Request:</strong>
                              <pre className="bg-muted p-2 rounded mt-1 overflow-auto">
                                {JSON.stringify(msg.request, null, 2)}
                              </pre>
                            </div>
                            <div>
                              <strong>Response:</strong>
                              <pre className="bg-muted p-2 rounded mt-1 overflow-auto">
                                {JSON.stringify(msg.rawResponse, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <Separator />

            {/* Model Discovery */}
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold">Available Models</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={discoverModels}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Discover"}
                  </Button>
                </div>
                {availableModels && (
                  <pre className="text-xs bg-background p-2 rounded overflow-auto max-h-32">
                    {JSON.stringify(availableModels, null, 2)}
                  </pre>
                )}
              </CardContent>
            </Card>

            <Separator />

            {/* Controls */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tool-calling"
                  checked={useToolCalling}
                  onCheckedChange={(checked) =>
                    setUseToolCalling(checked === true)
                  }
                />
                <label
                  htmlFor="tool-calling"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Enable Tool Calling (calculate function)
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-debug"
                  checked={showDebug}
                  onCheckedChange={(checked) => setShowDebug(checked === true)}
                />
                <label
                  htmlFor="show-debug"
                  className="text-sm font-medium leading-none"
                >
                  Show Debug Info
                </label>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Type a message... (e.g., 'What's 5 + 3?')"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !isLoading && sendMessage()}
                  disabled={isLoading}
                />
                <Button onClick={sendMessage} disabled={isLoading || !message.trim()}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Test Suggestions */}
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <p className="text-sm font-semibold mb-2">Test Suggestions:</p>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• Without tool calling: "Hello, how are you?"</li>
                  <li>• With tool calling: "What's 15 + 27?"</li>
                  <li>• With tool calling: "Calculate 100 divided by 5"</li>
                </ul>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Test;
