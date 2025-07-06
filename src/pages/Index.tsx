import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Edge, 
  Node, 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  Connection, 
  MarkerType,
  ReactFlowInstance,
  OnNodesChange,
  OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import NodePalette from '@/components/sidebar/NodePalette';
import VersionHistoryItem from '@/components/sidebar/VersionHistoryItem';
import TechStackFlow from '@/components/TechStackFlow';
import ChatPanel from '@/components/ChatPanel';
import Docs from './Docs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from "@/components/ui/sonner"
import TechNode from '@/components/nodes/TechNode';
import ResetGraphButton from '@/components/ResetGraphButton';
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  ImperativePanelGroupHandle,
} from "react-resizable-panels";
import { MessageCircle, PanelLeftClose, PanelRightClose, X } from 'lucide-react';
import { calculateLayout } from '@/lib/graphLayout'; // Import the layout function
import { supabase } from '@/lib/supabaseClient'; // NEW IMPORT

const LOCAL_STORAGE_KEY = 'techStackGraphHistory';
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';


// Type for version history items
interface VersionHistoryEntry {
  id: string;
  timestamp: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
}

interface GraphFromSupabase {
  id: string;
  created_at: string;
  user_id: string;
  name: string;
  data: { nodes: Node[]; edges: Edge[] };
  updated_at: string;
}

// Define node types used in the flow
const nodeTypes = {
  techNode: TechNode,
};

// Define message structure
interface ChatMessage {
  id?: string;
  sender: 'user' | 'ai' | 'system';
  content: string | object; // Main display content
  timestamp: string;
  type?: 'builder-prompt'; // Optional type for special messages
  fullContent?: string; // Optional field to store full prompt content
}

const Index = () => {
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [initialLayoutApplied, setInitialLayoutApplied] = useState(false); // Track initial layout
  const panelGroupRef = useRef<ImperativePanelGroupHandle>(null);
  const [session, setSession] = useState<any>(null); // NEW STATE FOR SUPABASE SESSION
  const [supaGraphs, setSupaGraphs] = useState<GraphFromSupabase[]>([]); // NEW STATE FOR SUPABASE GRAPHS
  const [githubUser, setGithubUser] = useState<any>(null); // NEW STATE FOR GITHUB USER

  // Load initial state from localStorage or set default
  const loadInitialHistory = (): VersionHistoryEntry[] => {
    if (typeof window !== 'undefined') { // Ensure localStorage is available
      const savedHistory = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedHistory) {
        try {
          const parsedHistory = JSON.parse(savedHistory);
          // Basic validation to ensure it's an array
          if (Array.isArray(parsedHistory)) {
            return parsedHistory;
          }
        } catch (e) {
          console.error("Failed to parse version history from localStorage", e);
        }
      }
    }
    // Default initial version if nothing in localStorage or parsing failed
    return [
    {
      id: 'initial',
      timestamp: new Date().toLocaleString(),
      description: 'Initial Version',
      nodes: [],
      edges: [],
    }
    ];
  };

  const [versionHistory, setVersionHistory] = useState<VersionHistoryEntry[]>(loadInitialHistory);
  const [activeVersionId, setActiveVersionId] = useState<string>(() => versionHistory[versionHistory.length - 1]?.id || 'initial');

  // Initialize nodes/edges state based on the active version
  const initialActiveVersion = versionHistory.find(v => v.id === activeVersionId) || versionHistory[0];
  const [nodes, setNodes, onNodesChange] = useNodesState(initialActiveVersion.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialActiveVersion.edges);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isChatPanelCollapsed, setIsChatPanelCollapsed] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);

  // Function to apply automatic layout
  const handleAutoLayout = useCallback(() => {
    if (nodes.length === 0) return; // Don't layout if no nodes
    const layoutedNodes = calculateLayout(nodes, edges);
    setNodes(layoutedNodes);
    // Fit view after layout (optional, requires reactFlowInstance)
    setTimeout(() => {
      reactFlowInstance?.fitView({ padding: 0.2 });
    }, 0); 
  }, [nodes, edges, setNodes, reactFlowInstance]);

  // Effect to mark initial load as complete after first render
  useEffect(() => {
    setInitialLoadComplete(true);
    // NEW AUTH EFFECT - Fetch initial session and set up listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
      }
    );
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []); // Dependencies include initialLoadComplete, but session update is independent

  // NEW EFFECT: Fetch Supabase graphs when session changes
  useEffect(() => {
    const fetchSupabaseGraphs = async () => {
      if (session) {
        try {
          const { data, error } = await supabase
            .from('graphs')
            .select('id, created_at, user_id, name, data, updated_at')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;
          setSupaGraphs(data as GraphFromSupabase[]);
        } catch (error: any) {
          console.error("Error fetching Supabase graphs:", error.message);
          toast.error("Failed to load cloud graphs.", { description: error.message, duration: 5000 });
          setSupaGraphs([]); // Clear any old graphs on error
        }
      } else {
        setSupaGraphs([]); // Clear Supabase graphs when logged out
      }
    };
    fetchSupabaseGraphs();
  }, [session]);

  // NEW EFFECT: Fetch GitHub user data if session is active
  useEffect(() => {
    const fetchGithubUser = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/github/user`, {
          credentials: 'include' // Ensure cookies are sent for authentication
        });
        if (response.ok) {
          const userData = await response.json();
          setGithubUser(userData);
        } else if (response.status === 401) {
          setGithubUser(null); // Not authenticated with GitHub
        } else {
          console.error("Failed to fetch GitHub user:", await response.text());
          setGithubUser(null);
        }
      } catch (error) {
        console.error("Error fetching GitHub user:", error);
        setGithubUser(null);
      }
    };

    // Only try to fetch GitHub user if a Supabase session exists, suggesting potential GitHub auth
    if (session) {
      fetchGithubUser();
    } else {
      setGithubUser(null); // Clear GitHub user if Supabase session ends
    }
  }, [session]); // Re-run when Supabase session changes

  // Apply initial layout once nodes/edges/instance are ready and layout hasn't been applied yet
  useEffect(() => {
    if (initialLoadComplete && reactFlowInstance && !initialLayoutApplied && (nodes.length > 0 || edges.length > 0)) {
      handleAutoLayout();
      setInitialLayoutApplied(true);
    }
  }, [nodes, edges, reactFlowInstance, initialLoadComplete, initialLayoutApplied, handleAutoLayout]);

  // Save history to localStorage whenever it changes (after initial load)
  useEffect(() => {
    // Only save to local storage if no session exists
    if (initialLoadComplete && !session) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(versionHistory));
    }
  }, [activeVersionId, versionHistory, initialLoadComplete, session]); // Add session to dependencies

  // Get current active version data
  const getCurrentVersionData = (): VersionHistoryEntry => {
    // This function might need to be re-evaluated or split if we load from Supabase
    return versionHistory.find(v => v.id === activeVersionId) || versionHistory[0];
  };

  // Handle node drag from palette
  const onDragStart = (event: React.DragEvent, nodeType: {type: string, label: string}) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeType));
    event.dataTransfer.effectAllowed = 'move';
  };

  // React Flow Handlers
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
      toast.success("Edge created!", { duration: 1500 });
    },
    [setEdges, toast]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!reactFlowBounds) {
        toast.error("Error: Could not get flow bounds.");
        return;
      }

      const nodeTypeString = event.dataTransfer.getData('application/reactflow');
      if (!nodeTypeString) {
        toast.error("Error: No node data found in drag event.");
        return;
      }

      try {
        const nodeType = JSON.parse(nodeTypeString);
        const position = reactFlowInstance?.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        if (!position) {
          toast.error("Error: Could not project position.");
          return;
        }

        const newNode: Node = {
          id: `${nodeType.type}_${Date.now()}`,
          type: nodeType.type,
          position,
          data: { label: nodeType.label, details: '' },
        };

        setNodes((nds) => nds.concat(newNode));
        toast.success(`${nodeType.label} node added!`, { duration: 2000 });

        // Automatically update the layout after adding a node if desired
        // handleAutoLayout(); // Re-enable if you want instant layout on drop
      } catch (error) {
        console.error("Failed to parse node data on drop:", error);
        toast.error("Failed to add node: Invalid data.");
      }
    },
    [reactFlowInstance, nodes, setNodes, toast, onNodesChange] // Add onNodesChange to dependencies if not already there
  );

  // Node Data Change Handlers
  const handleNodeLabelChange = useCallback((nodeId: string, newLabel: string) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, label: newLabel } } : node
      )
    );
  }, [setNodes]);

  const handleNodeDelete = useCallback((nodeId: string) => {
    setNodes((prevNodes) => prevNodes.filter((node) => node.id !== nodeId));
    setEdges((prevEdges) => prevEdges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    toast.info("Node deleted.", { duration: 2000 });
  }, [setNodes, setEdges]);

  const handleNodeDetailsChange = useCallback((nodeId: string, newDetails: string) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, details: newDetails } } : node
      )
    );
  }, [setNodes]);

  // Versioning Handlers
  const handleSave = async () => { // Make it async
    const currentNodes = reactFlowInstance?.getNodes() || [];
    const currentEdges = reactFlowInstance?.getEdges() || [];

    if (session) {
      // User is logged in, save to Supabase
      const graphName = prompt('Enter a name for your graph:', `My Tech Stack ${new Date().toLocaleDateString()}`);

      if (graphName === null || graphName.trim() === '') {
        toast.info("Graph save cancelled.", { duration: 2000 });
        return;
      }

      const graphDataToSave = {
        user_id: session.user.id,
        name: graphName.trim(),
        data: { nodes: currentNodes, edges: currentEdges },
      };

      toast.loading("Saving graph to cloud...", { id: "saveGraphToast" });
      try {
        // For new graphs. For updates, you'd need a mechanism to get the existing graph ID.
        const { data, error } = await supabase
          .from('graphs')
          .insert([graphDataToSave])
          .select(); // Select the inserted data to confirm

        if (error) {
          throw error;
        }

        console.log("Graph saved to Supabase:", data);
        toast.success("Graph saved to cloud successfully!", { id: "saveGraphToast", duration: 3000 });
        // After saving, re-fetch graphs to update the list
        const { data: updatedGraphs, error: fetchError } = await supabase
          .from('graphs')
          .select('id, created_at, user_id, name, data, updated_at')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
        if (!fetchError) {
          setSupaGraphs(updatedGraphs as GraphFromSupabase[]);
        }
      } catch (error: any) {
        console.error("Error saving graph to Supabase:", error);
        toast.error("Failed to save graph to cloud.", { id: "saveGraphToast", description: error.message, duration: 5000 });
      }
    } else {
      // User is NOT logged in, save to local storage (existing logic)
      const description = prompt('Enter a brief description for this graph version (e.g., "Initial layout", "Added user auth"): ', `Manual Save - ${new Date().toLocaleString()}`);

      if (description === null) {
        toast.info("Save cancelled.", { duration: 2000 });
        return;
      }

      const newVersion: VersionHistoryEntry = {
        id: `version_${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        description: description || `Manual Save - ${new Date().toLocaleString()}`,
        nodes: currentNodes,
        edges: currentEdges,
      };

      setVersionHistory((prev) => {
        const updated = [...prev, newVersion];
        // Keep only the last 10 versions for brevity in history
        return updated.slice(Math.max(0, updated.length - 10));
      });

      setActiveVersionId(newVersion.id);
      toast.success("Graph saved to local history!", { duration: 3000 });
    }
  };

  // MODIFIED handleRestoreVersion to handle Supabase graphs
  const handleRestoreVersion = useCallback((versionId: string, isSupabaseGraph: boolean = false) => {
    let versionToRestore: VersionHistoryEntry | undefined;

    if (isSupabaseGraph) {
      const supaGraph = supaGraphs.find(g => g.id === versionId);
      if (supaGraph) {
        versionToRestore = {
          id: supaGraph.id,
          timestamp: new Date(supaGraph.created_at).toLocaleString(),
          description: supaGraph.name,
          nodes: supaGraph.data.nodes,
          edges: supaGraph.data.edges,
        };
      }
    } else {
      versionToRestore = versionHistory.find((version) => version.id === versionId);
    }

    if (versionToRestore) {
      setNodes(versionToRestore.nodes);
      setEdges(versionToRestore.edges);
      setActiveVersionId(versionToRestore.id);
      setInitialLayoutApplied(false); // Recalculate layout if needed
      toast.info("Graph restored!", { duration: 2000 });
    } else {
      toast.error("Version not found.", { duration: 2000 });
    }
  }, [setNodes, setEdges, setActiveVersionId, setInitialLayoutApplied, versionHistory, supaGraphs]);

  // Effect to scroll chat down on new message
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Handle AI graph generation
  const handleGenerateGraph = useCallback(async (prompt: string) => {
    if (!prompt.trim()) {
      toast.error("Input Error", { description: "Please enter a description.", duration: 3000 }); 
      return;
    }
    console.log(`Generating/Modifying graph for prompt: \"${prompt}\"`);
    const userMessage: ChatMessage = { sender: 'user', content: prompt, timestamp: new Date().toISOString() };
    const thinkingMessageId = `thinking-${Date.now()}`;
    const thinkingMessage: ChatMessage = { id: thinkingMessageId, sender: 'ai', content: 'Thinking...', timestamp: new Date().toISOString() };
    setChatMessages(prev => [...prev, userMessage, thinkingMessage]);
    setIsGenerating(true); 
    const graphLoadingToastId = toast.loading(
        "Generating/Modifying Graph...", // Updated toast title
        { description: "Asking AI to create or update your tech stack..." } // Updated description
    );
    
    let generatedData: any = null; 
    let graphError: Error | null = null;

    // --- Determine payload based on existing graph --- 
    let requestBody: any = { prompt };
    if (nodes.length > 0) {
       requestBody.existingGraph = { nodes, edges }; // Add existing graph if nodes exist
       console.log("Sending existing graph for modification...");
    } else {
       console.log("No existing graph, generating from scratch...");
    }

    try {
      // --- Call Generate/Modify Graph API --- 
      // TEMP: Force an error for testing - REVERTED
      const response = await fetch(`${apiUrl}/api/generate-graph`, { // Reverted back to original endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody), // Send the determined payload
      });

      if (!response.ok) {
         let errorMsg = `HTTP error! status: ${response.status}`;
         try { const errorData = await response.json(); errorMsg = errorData.error || errorMsg; }
         catch (jsonError) { errorMsg = response.statusText || errorMsg; }
         throw new Error(errorMsg);
      }
      generatedData = await response.json();
      if (!generatedData || !Array.isArray(generatedData.nodes) || !Array.isArray(generatedData.edges)) {
        throw new Error("Invalid data structure received from AI backend.");
      }
      // --- Update Graph and Version History --- 
      const graphAction = nodes.length > 0 ? "Modified" : "Generated";
      const newVersionId = `ai_version_${Date.now()}`;
      const newNodes = Array.isArray(generatedData.nodes) ? [...generatedData.nodes] : [];
      const newEdges = Array.isArray(generatedData.edges) ? [...generatedData.edges] : [];
    const newVersion: VersionHistoryEntry = {
        id: newVersionId,
        timestamp: new Date().toISOString(),
        description: `AI ${graphAction}: ${prompt.substring(0, 30)}...`,
        nodes: newNodes, 
        edges: newEdges, 
      };
      // ... (localStorage saving logic) ...
      setVersionHistory((prevHistory) => [...prevHistory, newVersion]);
      setActiveVersionId(newVersionId);
      setNodes(newNodes);
      setEdges(newEdges);
      setInitialLayoutApplied(false); // Reset layout flag to trigger auto-layout
      toast.success(`AI Graph ${graphAction}`, { description: "New graph loaded and saved.", duration: 3000 });

    } catch (error) {
      console.error("Error generating graph via backend:", error);
      graphError = error; 
      toast.error("Graph Generation Failed", { 
        description: "Please try modifying your prompt or rerunning the request.", 
        duration: 5000, // Increased duration slightly
      });
      setChatMessages(prev => prev.filter(m => m.id !== thinkingMessageId));
      setChatMessages(prev => [...prev, { sender: 'system', content: `Graph generation/modification failed: ${error.message}`, timestamp: new Date().toISOString() }]);
      generatedData = null; 
    } finally {
       // ... (finally block as before) ...
       toast.dismiss(graphLoadingToastId); 
       if (graphError) { setIsGenerating(false); }
    }
    
    // --- Step 2: Call Explain Graph API (using the result and the triggering prompt) --- 
    if (generatedData && !graphError) {
      const explanationLoadingToastId = toast.loading("Generating Explanation...", { description: "Asking AI to explain the stack..." });
      let explanationError: Error | null = null;
      try {
          const explainResponse = await fetch(`${apiUrl}/api/explain-graph`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                graphData: generatedData, // Send the final graph (new or modified)
                originalPrompt: prompt // Send the prompt that generated/modified this version
              })
          });
          if (!explainResponse.ok) {
              let errorMsg = `Explanation error: ${explainResponse.status}`;
              try { const errorData = await explainResponse.json(); errorMsg = errorData.error || errorMsg; }
              catch (e) { errorMsg = explainResponse.statusText || errorMsg; }
              throw new Error(errorMsg);
          }
          const explanationData = await explainResponse.json();
          const explanationText = explanationData.explanation;
          if (explanationText) {
              setChatMessages(prev => prev.filter(m => m.id !== thinkingMessageId));
              setChatMessages(prev => [...prev, { sender: 'ai', content: explanationText, timestamp: new Date().toISOString() }]);
          } else {
              throw new Error("Empty explanation received from backend.");
          }
      } catch (explainError) {
          explanationError = explainError; 
          toast.error("Explanation Error", { description: explainError.message || "Failed to get explanation.", duration: 3000 });
          setChatMessages(prev => prev.filter(m => m.id !== thinkingMessageId));
          setChatMessages(prev => [...prev, { sender: 'system', content: `Failed to get explanation: ${explainError.message}`, timestamp: new Date().toISOString() }]);
      } finally {
          toast.dismiss(explanationLoadingToastId);
          setIsGenerating(false); 
      }
    }

  }, [nodes, edges, versionHistory, setNodes, setEdges, setActiveVersionId, setVersionHistory]); // Ensure all dependencies are correct

  // --- Add handler to imperatively expand chat --- 
  const handleExpandChatPanel = () => {
    setIsChatPanelCollapsed(false);
    // Set layout: Flow panel takes remaining space, Chat panel takes 25%
    panelGroupRef.current?.setLayout([75, 25]); 
  };
  // ---------------------------------------------

  return (
    <div className="flex h-screen w-full bg-background text-foreground">
      {/* Sidebar (Fixed Width) - Reverted from Panel */}
      <div className={`bg-card border-r transition-all flex-shrink-0 ${isSidebarOpen ? 'w-72' : 'w-0 overflow-hidden border-none'}`}>
        {/* Conditionally render sidebar content only if not collapsed */} 
        {isSidebarOpen && (
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
            <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="text-muted-foreground hover:text-foreground"
                title="Close Sidebar"
                style={{ marginTop: '2px', marginBottom: '2px'}}
            >
                <PanelLeftClose size={16} /> {/* Use appropriate icon */} 
            </button>
          </div>
          {/* Node Palette */}
            <div className="border-b flex-shrink-0 overflow-y-auto max-h-[50%]">
            <NodePalette onDragStart={onDragStart} />
          </div>
          {/* Version History */}
            <div className="flex-grow overflow-y-auto p-4 flex flex-col min-h-0">
              <h3 className="text-sm font-medium mb-3 flex-shrink-0">Version History</h3>
               <div className="space-y-1 flex-grow overflow-y-auto">
                 {/* Conditional rendering for version history */}
                {session ? (
                  supaGraphs.length > 0 ? (
                    supaGraphs.map((graph) => (
                      <VersionHistoryItem
                        key={graph.id}
                        version={{
                          id: graph.id,
                          timestamp: new Date(graph.created_at).toLocaleString(),
                          description: graph.name,
                          nodes: graph.data.nodes,
                          edges: graph.data.edges,
                        }}
                        onRestore={(id) => handleRestoreVersion(id, true)} // Pass true for Supabase graph
                        isActive={graph.id === activeVersionId}
                      />
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">No cloud graphs found. Save one to see it here!</p>
                  )
                ) : (
                  versionHistory.length > 0 ? (
                    versionHistory.map((version) => (
                      <VersionHistoryItem
                        key={version.id}
                        version={version}
                        onRestore={handleRestoreVersion}
                        isActive={version.id === activeVersionId}
                      />
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">No local history found. Save your graph to create history!</p>
                  )
                )}
            </div>
          </div>
        </div>
        )}
      </div>
      
      {/* Resizable Area (Main Content + Chat) */}
      <PanelGroup 
        direction="horizontal" 
        className="flex-grow" 
        ref={panelGroupRef} 
      > 
        {/* Main Content Panel (Flow Editor or Docs) */}
        <Panel defaultSize={75} minSize={40} className="flex-grow relative"> {/* Occupies flexible space */} 
          {isDocsOpen ? (
            <Docs 
              onBack={() => setIsDocsOpen(false)}
              nodes={nodes}
              edges={edges}
            />
          ) : (
            <div className="flex flex-col h-full" ref={reactFlowWrapper}> 
              {/* Flow Editor takes full space */}
              <div className="flex-grow h-full">
                 {(() => { 
                   const nodesWithHandlers = nodes.map((node) => ({
                    ...node,
                    data: {
                      ...node.data,
                      onLabelChange: handleNodeLabelChange,
                      onDelete: handleNodeDelete,
                      onDetailsChange: handleNodeDetailsChange,
                    },
                   }));
                   return (
            <TechStackFlow 
                       nodes={nodesWithHandlers} 
                       edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
                       onConnect={onConnect}
                       onInit={(instance: ReactFlowInstance) => setReactFlowInstance(instance)}
                       onDrop={onDrop}
                       onDragOver={onDragOver}
                       nodeTypes={nodeTypes}
              onSave={handleSave} 
                       onReset={() => {
                         setNodes([]);
                         setEdges([]);
                         setActiveVersionId('initial');
                         setInitialLayoutApplied(false); 
                         toast.info("Graph Reset", { description: "Canvas cleared.", duration: 3000 });
                       }}
                       onAutoLayout={handleAutoLayout} 
                       onOpenDocs={() => setIsDocsOpen(true)}
                       isSidebarCollapsed={!isSidebarOpen}
                     />
                   );
                 })()}
              </div>
          </div>
          )}
        </Panel>
        {/* --- Expand Sidebar Button (Bottom Left) --- */}
        {!isSidebarOpen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(true)}
            className="absolute bottom-4 left-4 z-10 bg-background/80 hover:bg-background border shadow-md h-8 w-8"
            title="Open Sidebar"
          >
            <PanelRightClose size={16} />
          </Button>
        )}
        {/* --- End Expand Sidebar Button --- */}
        <PanelResizeHandle className="w-1 bg-border/50 hover:bg-border transition-colors" />

        {/* Chat Panel (Right, Resizable & Collapsible) */}
        <Panel 
          id="chat-panel"
          defaultSize={25} 
          minSize={10} 
          maxSize={50}
          collapsible={true} 
          collapsedSize={0} 
          onCollapse={() => setIsChatPanelCollapsed(true)}
          onExpand={() => setIsChatPanelCollapsed(false)}
          className={`flex-shrink-0 bg-card flex flex-col border-l ${isChatPanelCollapsed ? '!min-w-0 !max-w-0 !w-0 border-none overflow-hidden' : ''}`}
        >
           {!isChatPanelCollapsed && (
             <ChatPanel 
               messages={chatMessages} 
               chatContainerRef={chatContainerRef}
               onGenerateGraph={handleGenerateGraph} 
               isGenerating={isGenerating} 
               onCollapse={() => setIsChatPanelCollapsed(true)} 
               nodes={nodes}
               edges={edges}
               setChatMessages={setChatMessages}
               githubUser={githubUser}
             />
           )}
        </Panel>
      </PanelGroup>

      {/* Floating Expand Chat Button */}
      {isChatPanelCollapsed && (
        <button
          onClick={handleExpandChatPanel}
          className="fixed bottom-4 right-4 z-50 bg-primary text-primary-foreground rounded-full p-3 shadow-lg hover:bg-primary/90 transition-all"
          title="Open Chat"
        >
          <MessageCircle size={24} />
        </button>
      )}
    </div>
  );
};

export default Index;