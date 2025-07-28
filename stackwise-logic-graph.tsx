"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import ReactFlow, {
  type Node,
  type Edge,
  addEdge,
  Background,
  type Connection,
  Controls,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  useReactFlow,
} from "reactflow"
import "reactflow/dist/style.css"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
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
  LayoutGrid,
  User,
  Bot,
  Download,
  Trash2,
} from "lucide-react"

// Types
interface ChatMessage {
  id: number
  type: "user" | "bot"
  message: string
  timestamp: string
}

interface NodeData {
  label: string
  description: string
  inputType?: string
  outputType?: string
  triggerType?: string
  systemType?: string
  functions?: string[]
}

// Custom Node Components
const FunctionNode = ({ data, id }: { data: NodeData; id: string }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState(data)
  const { setNodes } = useReactFlow()

  const handleSave = () => {
    setNodes((nodes) => nodes.map((node) => (node.id === id ? { ...node, data: editData } : node)))
    setIsEditing(false)
  }

  const handleDelete = () => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id))
  }

  return (
    <>
      <div className="bg-white border-2 border-blue-200 rounded-lg p-3 min-w-[160px] shadow-sm hover:shadow-md transition-shadow">
        <Handle type="target" position={Position.Top} className="w-2 h-2" />
        <div className="flex items-center gap-2 mb-2">
          <Function className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-sm">{data.label}</span>
        </div>
        <div className="text-xs text-gray-600 mb-2">{data.description}</div>
        {data.inputType && data.outputType && (
          <div className="flex gap-1 mb-2">
            <Badge variant="outline" className="text-xs px-1 py-0">
              {data.inputType}
            </Badge>
            <span className="text-xs text-gray-400">→</span>
            <Badge variant="outline" className="text-xs px-1 py-0">
              {data.outputType}
            </Badge>
          </div>
        )}
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
            <Code className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setIsEditing(true)}>
            <Edit3 className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
            <TestTube className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={handleDelete}>
            <Trash2 className="w-3 h-3 text-red-500" />
          </Button>
        </div>
        <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
      </div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Function</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Function Name</label>
              <Input value={editData.label} onChange={(e) => setEditData({ ...editData, label: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Input Type</label>
                <Input
                  value={editData.inputType || ""}
                  onChange={(e) => setEditData({ ...editData, inputType: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Output Type</label>
                <Input
                  value={editData.outputType || ""}
                  onChange={(e) => setEditData({ ...editData, outputType: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave}>Save</Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

const TriggerNode = ({ data, id }: { data: NodeData; id: string }) => {
  const { setNodes } = useReactFlow()

  const handleDelete = () => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id))
  }

  return (
    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 min-w-[140px] shadow-sm">
      <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-4 h-4 text-green-600" />
        <span className="font-medium text-sm">{data.label}</span>
        <Button size="sm" variant="ghost" className="h-4 w-4 p-0 ml-auto" onClick={handleDelete}>
          <Trash2 className="w-3 h-3 text-red-500" />
        </Button>
      </div>
      <div className="text-xs text-gray-600">{data.description}</div>
      {data.triggerType && (
        <Badge variant="secondary" className="text-xs mt-2">
          {data.triggerType}
        </Badge>
      )}
    </div>
  )
}

const SystemNode = ({ data, id }: { data: NodeData; id: string }) => {
  const { setNodes } = useReactFlow()

  const handleDelete = () => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id))
  }

  return (
    <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-3 min-w-[140px] shadow-sm">
      <Handle type="target" position={Position.Top} className="w-2 h-2" />
      <div className="flex items-center gap-2 mb-2">
        <Database className="w-4 h-4 text-purple-600" />
        <span className="font-medium text-sm">{data.label}</span>
        <Button size="sm" variant="ghost" className="h-4 w-4 p-0 ml-auto" onClick={handleDelete}>
          <Trash2 className="w-3 h-3 text-red-500" />
        </Button>
      </div>
      <div className="text-xs text-gray-600">{data.description}</div>
      {data.systemType && (
        <Badge variant="outline" className="text-xs mt-2">
          {data.systemType}
        </Badge>
      )}
    </div>
  )
}

const ModuleGroupNode = ({ data, id }: { data: NodeData; id: string }) => {
  const { setNodes } = useReactFlow()

  const handleDelete = () => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id))
  }

  return (
    <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 min-w-[200px] shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <Settings className="w-4 h-4 text-orange-600" />
        <span className="font-medium text-sm">{data.label}</span>
        <Button size="sm" variant="ghost" className="h-4 w-4 p-0 ml-auto" onClick={handleDelete}>
          <Trash2 className="w-3 h-3 text-red-500" />
        </Button>
      </div>
      <div className="text-xs text-gray-600 mb-3">{data.description}</div>
      <div className="space-y-2">
        {data.functions?.map((func: string, idx: number) => (
          <div key={idx} className="bg-white rounded px-2 py-1 text-xs border">
            {func}
          </div>
        ))}
      </div>
      <Handle type="target" position={Position.Top} className="w-2 h-2" />
      <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
    </div>
  )
}

const nodeTypes = {
  function: FunctionNode,
  trigger: TriggerNode,
  system: SystemNode,
  module: ModuleGroupNode,
}

const initialNodes: Node[] = [
  {
    id: "1",
    type: "trigger",
    position: { x: 100, y: 50 },
    data: {
      label: "User Click",
      description: "Submit review button",
      triggerType: "UI Event",
    },
  },
  {
    id: "2",
    type: "function",
    position: { x: 50, y: 180 },
    data: {
      label: "validateReview",
      description: "Check review data",
      inputType: "ReviewData",
      outputType: "boolean",
    },
  },
]

const initialEdges: Edge[] = [{ id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "#3b82f6" } }]

export default function StackWiseLogicGraph() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedLayer, setSelectedLayer] = useState("logic")
  const [chatInput, setChatInput] = useState("")
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      type: "bot",
      message:
        "Hi! I can help you build your app's logic. Try saying something like 'Add user authentication' or 'Create a payment flow'.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ])
  const [isGeneratingCode, setIsGeneratingCode] = useState(false)
  const [generatedCode, setGeneratedCode] = useState("")
  const [showCodeModal, setShowCodeModal] = useState(false)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { project } = useReactFlow()

  const onConnect = useCallback((params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges])

  const addNode = useCallback(
    (type: string, position: { x: number; y: number }) => {
      const id = `${Date.now()}`
      let newNode: Node

      switch (type) {
        case "function":
          newNode = {
            id,
            type: "function",
            position,
            data: {
              label: "newFunction",
              description: "Add description",
              inputType: "any",
              outputType: "any",
            },
          }
          break
        case "trigger":
          newNode = {
            id,
            type: "trigger",
            position,
            data: {
              label: "New Trigger",
              description: "Add description",
              triggerType: "Event",
            },
          }
          break
        case "system":
          newNode = {
            id,
            type: "system",
            position,
            data: {
              label: "New System",
              description: "External service",
              systemType: "API",
            },
          }
          break
        case "module":
          newNode = {
            id,
            type: "module",
            position,
            data: {
              label: "New Module",
              description: "Group of functions",
              functions: ["function1", "function2"],
            },
          }
          break
        default:
          return
      }

      setNodes((nds) => nds.concat(newNode))
    },
    [setNodes],
  )

  const handleDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType)
    event.dataTransfer.effectAllowed = "move"
  }

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect()
      const type = event.dataTransfer.getData("application/reactflow")

      if (typeof type === "undefined" || !type || !reactFlowBounds) {
        return
      }

      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      })

      addNode(type, position)
    },
    [project, addNode],
  )

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now(),
      type: "user",
      message: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setChatMessages((prev) => [...prev, userMessage])
    setChatInput("")

    // Simulate AI processing
    setTimeout(() => {
      let botResponse = ""
      let shouldAddNode = false
      let nodeToAdd: { type: string; data: NodeData } | null = null

      const input = chatInput.toLowerCase()

      if (input.includes("auth") || input.includes("login")) {
        botResponse = "I've added an authentication module with login, logout, and session management functions."
        shouldAddNode = true
        nodeToAdd = {
          type: "module",
          data: {
            label: "Auth Module",
            description: "User authentication system",
            functions: ["login", "logout", "checkSession", "validateToken"],
          },
        }
      } else if (input.includes("payment") || input.includes("stripe")) {
        botResponse = "I've added a payment processing function that integrates with Stripe."
        shouldAddNode = true
        nodeToAdd = {
          type: "function",
          data: {
            label: "processPayment",
            description: "Handle payment processing",
            inputType: "PaymentData",
            outputType: "PaymentResult",
          },
        }
      } else if (input.includes("email") || input.includes("notification")) {
        botResponse = "I've added an email notification system."
        shouldAddNode = true
        nodeToAdd = {
          type: "system",
          data: {
            label: "Email Service",
            description: "Send email notifications",
            systemType: "External API",
          },
        }
      } else if (input.includes("database") || input.includes("save") || input.includes("store")) {
        botResponse = "I've added a database function to store your data."
        shouldAddNode = true
        nodeToAdd = {
          type: "function",
          data: {
            label: "saveToDatabase",
            description: "Store data in database",
            inputType: "any",
            outputType: "DatabaseResult",
          },
        }
      } else {
        botResponse =
          "I understand you want to add that feature. Could you be more specific? For example, try 'Add user authentication' or 'Create a payment system'."
      }

      if (shouldAddNode && nodeToAdd) {
        const position = { x: Math.random() * 400 + 100, y: Math.random() * 300 + 200 }
        addNode(nodeToAdd.type, position)

        // Update the last added node with proper data
        setTimeout(() => {
          setNodes((nds) => {
            const lastNode = nds[nds.length - 1]
            return nds.map((node) => (node.id === lastNode.id ? { ...node, data: nodeToAdd!.data } : node))
          })
        }, 100)
      }

      const botMessage: ChatMessage = {
        id: Date.now() + 1,
        type: "bot",
        message: botResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }

      setChatMessages((prev) => [...prev, botMessage])
    }, 1000)
  }

  const handleGenerateCode = async () => {
    setIsGeneratingCode(true)

    // Simulate code generation
    setTimeout(() => {
      const code = `// Generated from StackWise Logic Graph
import React from 'react';

${nodes
  .map((node) => {
    if (node.type === "function") {
      return `
// ${node.data.description}
function ${node.data.label}(input: ${node.data.inputType || "any"}): ${node.data.outputType || "any"} {
  // TODO: Implement ${node.data.label}
  console.log('Executing ${node.data.label}');
  return {} as ${node.data.outputType || "any"};
}`
    }
    return ""
  })
  .join("\n")}

export default function App() {
  return (
    <div>
      <h1>Generated App</h1>
      {/* Your app logic here */}
    </div>
  );
}
`
      setGeneratedCode(code)
      setIsGeneratingCode(false)
      setShowCodeModal(true)
    }, 2000)
  }

  const handleSaveGraph = () => {
    const graphData = { nodes, edges }
    localStorage.setItem("stackwise-graph", JSON.stringify(graphData))
    alert("Graph saved successfully!")
  }

  const handleLoadGraph = () => {
    const saved = localStorage.getItem("stackwise-graph")
    if (saved) {
      const { nodes: savedNodes, edges: savedEdges } = JSON.parse(saved)
      setNodes(savedNodes)
      setEdges(savedEdges)
      alert("Graph loaded successfully!")
    }
  }

  return (
    <div className="w-full h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <img src="/stackwise-logo.png" alt="StackWise" className="w-8 h-8" />
            <span className="font-semibold text-lg">stackwise</span>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="outline" size="xs" onClick={handleSaveGraph}>
              <Save className="w-4 h-4 mr-2" />
              Save Graph
            </Button>
            <Button variant="outline" size="xs" onClick={handleLoadGraph}>
              <Download className="w-4 h-4 mr-2" />
              Load
            </Button>
            <Button variant="outline" size="xs">
              <LayoutGrid className="w-4 h-4 mr-2" />
              Layout
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="outline" size="xs">
            <Github className="w-4 h-4 mr-2" />
            Connect GitHub
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={() => setShowChat(!showChat)}
            className={showChat ? "bg-blue-50 border-blue-200" : ""}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Chat
          </Button>
          <span className="text-sm text-gray-600">satvikmattal18@gmail.com</span>
          <Button variant="destructive" size="xs">
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
                  <div
                    className="flex items-center gap-2 p-2 bg-blue-50 rounded cursor-pointer hover:bg-blue-100"
                    draggable
                    onDragStart={(e) => handleDragStart(e, "function")}
                  >
                    <Function className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">Function</span>
                  </div>
                  <div
                    className="flex items-center gap-2 p-2 bg-green-50 rounded cursor-pointer hover:bg-green-100"
                    draggable
                    onDragStart={(e) => handleDragStart(e, "trigger")}
                  >
                    <Zap className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Trigger</span>
                  </div>
                  <div
                    className="flex items-center gap-2 p-2 bg-purple-50 rounded cursor-pointer hover:bg-purple-100"
                    draggable
                    onDragStart={(e) => handleDragStart(e, "system")}
                  >
                    <Database className="w-4 h-4 text-purple-600" />
                    <span className="text-sm">System</span>
                  </div>
                  <div
                    className="flex items-center gap-2 p-2 bg-orange-50 rounded cursor-pointer hover:bg-orange-100"
                    draggable
                    onDragStart={(e) => handleDragStart(e, "module")}
                  >
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start bg-transparent"
                    onClick={handleGenerateCode}
                    disabled={isGeneratingCode}
                  >
                    <Code className="w-4 h-4 mr-2" />
                    {isGeneratingCode ? "Generating..." : "Generate Code"}
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
                  {nodes
                    .filter((node) => node.type === "function")
                    .map((node) => (
                      <div key={node.id} className="p-2 bg-gray-100 rounded">
                        <div className="text-sm font-medium">{node.data.label}</div>
                        <div className="text-xs text-gray-600">
                          {node.data.inputType} → {node.data.outputType}
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="interaction" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">UI Triggers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {nodes
                    .filter((node) => node.type === "trigger")
                    .map((node) => (
                      <div key={node.id} className="p-2 bg-green-50 rounded">
                        <div className="text-sm font-medium">{node.data.label}</div>
                        <div className="text-xs text-gray-600">{node.data.description}</div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Graph Stats</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>Functions:</span>
                <span>{nodes.filter((n) => n.type === "function").length}</span>
              </div>
              <div className="flex justify-between">
                <span>Modules:</span>
                <span>{nodes.filter((n) => n.type === "module").length}</span>
              </div>
              <div className="flex justify-between">
                <span>Triggers:</span>
                <span>{nodes.filter((n) => n.type === "trigger").length}</span>
              </div>
              <div className="flex justify-between">
                <span>Systems:</span>
                <span>{nodes.filter((n) => n.type === "system").length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex">
          {/* Graph Area */}
          <div className="flex-1 relative" ref={reactFlowWrapper}>
            <div className="absolute top-4 left-4 z-10 flex gap-2">
              <Button size="xs" variant="outline">
                <Play className="w-4 h-4 mr-2" />
                Simulate Flow
              </Button>
              <Button size="xs" variant="outline">
                <Globe className="w-4 h-4 mr-2" />
                Add Feature
              </Button>
            </div>

            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              fitView
              className="bg-gray-50"
            >
              <Controls />
              <Background variant="dots" gap={20} size={1} />
            </ReactFlow>
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
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className={`flex gap-3 ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`flex gap-2 max-w-[80%] ${msg.type === "user" ? "flex-row-reverse" : "flex-row"}`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                            msg.type === "user" ? "bg-blue-600" : "bg-gray-600"
                          }`}
                        >
                          {msg.type === "user" ? (
                            <User className="w-3 h-3 text-white" />
                          ) : (
                            <Bot className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div
                          className={`rounded-lg p-3 ${
                            msg.type === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <p className="text-sm">{msg.message}</p>
                          <p className={`text-xs mt-1 ${msg.type === "user" ? "text-blue-100" : "text-gray-500"}`}>
                            {msg.timestamp}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
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
                  <Button size="xs" onClick={handleSendMessage}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Try: "Add user authentication" or "Create a payment flow"</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Code Generation Modal */}
      <Dialog open={showCodeModal} onOpenChange={setShowCodeModal}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Generated Code</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
              <code>{generatedCode}</code>
            </pre>
          </ScrollArea>
          <div className="flex gap-2">
            <Button onClick={() => navigator.clipboard.writeText(generatedCode)}>Copy Code</Button>
            <Button variant="outline" onClick={() => setShowCodeModal(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
