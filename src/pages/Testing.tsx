import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ActivityIcon as Function,
  Database,
  Zap,
  Settings,
  Play,
  Code,
  TestTube,
  GitBranch,
  Eye,
  Edit3,
  Route,
  Globe,
  Github,
  MessageSquare,
  Send,
  Save,
  RotateCcw,
  LayoutGrid,
  User,
  Bot,
} from "lucide-react";

const Testing = () => {
  const [selectedLayer, setSelectedLayer] = useState("logic");
  const [chatInput, setChatInput] = useState("");
  const [showChat, setShowChat] = useState(false);

  const handleSendMessage = () => {
    if (chatInput.trim()) {
      console.log("Sending message:", chatInput);
      setChatInput("");
    }
  };

  return (
    <div className="w-full h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <img src="/stackwiseLogo.png" alt="StackWise" className="w-8 h-8" />
            <span className="font-semibold text-lg">stackwise</span>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm">
              <Save className="w-4 h-4 mr-2" />
              Save Graph
            </Button>
            <Button variant="outline" size="sm">
              <RotateCcw className="w-4 h-4 mr-2" />
            </Button>
            <Button variant="outline" size="sm">
              <LayoutGrid className="w-4 h-4 mr-2" />
              Layout
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm">
            <Github className="w-4 h-4 mr-2" />
            Connect GitHub
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowChat(!showChat)}
            className={showChat ? "bg-blue-50 border-blue-200" : ""}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Chat
          </Button>
          <span className="text-sm text-gray-600">user@example.com</span>
          <Button variant="destructive" size="sm">
            Logout
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 bg-gray-50 border-r p-4 overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Logic Builder</h2>
            <p className="text-sm text-gray-600">Build your app's logic flow</p>
          </div>

          <Tabs value={selectedLayer} onValueChange={setSelectedLayer} className="mb-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="logic">Logic</TabsTrigger>
              <TabsTrigger value="state">State</TabsTrigger>
              <TabsTrigger value="interaction">UI</TabsTrigger>
            </TabsList>

            <TabsContent value="logic" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Node Types</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded cursor-pointer hover:bg-blue-100">
                    <Function className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">Function</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded cursor-pointer hover:bg-green-100">
                    <Zap className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Trigger</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-purple-50 rounded cursor-pointer hover:bg-purple-100">
                    <Database className="w-4 h-4 text-purple-600" />
                    <span className="text-sm">System</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-orange-50 rounded cursor-pointer hover:bg-orange-100">
                    <Settings className="w-4 h-4 text-orange-600" />
                    <span className="text-sm">Module</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                    <Eye className="w-4 h-4 mr-2" />
                    Trace Path
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                    <GitBranch className="w-4 h-4 mr-2" />
                    Refactor
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                    <TestTube className="w-4 h-4 mr-2" />
                    Test Coverage
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                    <Code className="w-4 h-4 mr-2" />
                    Generate Code
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                    <Route className="w-4 h-4 mr-2" />
                    Generate Docs
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="state" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Shared State</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="p-2 bg-gray-100 rounded">
                    <div className="text-sm font-medium">userSession</div>
                    <div className="text-xs text-gray-600">Used in: checkAuth, getProfile, logAccess</div>
                  </div>
                  <div className="p-2 bg-gray-100 rounded">
                    <div className="text-sm font-medium">reviewCache</div>
                    <div className="text-xs text-gray-600">Used in: getReviews, saveReview</div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="interaction" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">UI Triggers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="p-2 bg-green-50 rounded">
                    <div className="text-sm font-medium">onClickSubmit</div>
                    <div className="text-xs text-gray-600">→ validateReview → saveReview</div>
                  </div>
                  <div className="p-2 bg-green-50 rounded">
                    <div className="text-sm font-medium">onPageLoad</div>
                    <div className="text-xs text-gray-600">→ checkAuth → getReviews</div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Version History</CardTitle>
            </CardHeader>
            <CardContent className="text-xs">
              <p className="text-gray-600">No cloud graphs found. Save one to see it here!</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex">
          {/* Graph Area */}
          <div className="flex-1 relative">
            <div className="absolute top-4 left-4 z-10 flex gap-2">
              <Button size="sm" variant="outline">
                <Play className="w-4 h-4 mr-2" />
                Simulate Flow
              </Button>
              <Button size="sm" variant="outline">
                <Globe className="w-4 h-4 mr-2" />
                Add Feature
              </Button>
            </div>

            <div className="w-full h-full bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-600 mb-2">Logic Flow Canvas</h2>
                <p className="text-gray-500">Drag nodes from the sidebar to build your logic flow</p>
              </div>
            </div>
          </div>

          {/* Chat Panel */}
          {showChat && (
            <div className="w-80 bg-white border-l flex flex-col">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-sm">Build with AI</h3>
                <p className="text-xs text-gray-600">Describe what you want to build</p>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  <div className="flex gap-3 justify-start">
                    <div className="flex gap-2 max-w-[80%] flex-row">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-600">
                        <Bot className="w-3 h-3 text-white" />
                      </div>
                      <div className="rounded-lg p-3 bg-gray-100 text-gray-900">
                        <p className="text-sm">Hello! I'm here to help you build your logic flow. What would you like to create?</p>
                        <p className="text-xs mt-1 text-gray-500">2:34 PM</p>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Describe your feature..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={handleSendMessage}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Try: "Add user authentication" or "Create a payment flow"</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Testing; 