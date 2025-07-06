import React, { ReactNode, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  OnInit,
  NodeTypes,
  ReactFlowInstance,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import ResetGraphButton from './ResetGraphButton';
import { Layout, FileText, LogIn, LogOut, User2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

interface TechStackFlowProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onInit: OnInit<any>;
  onDrop: React.DragEventHandler<HTMLDivElement>;
  onDragOver: React.DragEventHandler<HTMLDivElement>;
  nodeTypes: NodeTypes;
  onSave: () => void;
  onReset: () => void;
  onAutoLayout: () => void;
  onOpenDocs: () => void;
  isSidebarCollapsed: boolean;
}

const TechStackFlow: React.FC<TechStackFlowProps> = ({ 
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onInit,
  onDrop,
  onDragOver,
  nodeTypes,
  onSave, 
  onReset,
  onAutoLayout,
  onOpenDocs,
  isSidebarCollapsed
}) => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (!session && event === 'SIGNED_OUT') {
          navigate('/auth');
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSave = () => {
    onSave();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleLogin = () => {
    navigate('/auth');
  };

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex justify-between items-center p-2 bg-background border-b">
        <h2 className="px-2 text-lg font-medium flex items-center">
          <img 
            src="/stackwiseLogo.png"
            alt="Stackwise logo" 
            className="h-5 w-5 mr-2"
          /> 
          <span>stackwise</span>
        </h2>
        <div className="flex gap-2">
          {session ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { /* Implement profile/dashboard link here if needed */ }}
                className="flex items-center gap-1"
              >
                <User2 className="h-4 w-4" />
                {session.user?.email || 'Profile'}
              </Button>
              <Button
                onClick={handleSave}
                variant="outline"
                size="sm"
              >
                Save Graph
              </Button>
              <Button
                onClick={onOpenDocs}
                variant="outline"
                size="sm"
              >
                <FileText className="h-4 w-4 mr-1" />
                Docs
              </Button>
              <ResetGraphButton onReset={onReset} size="sm" />
              <Button
                onClick={onAutoLayout}
                variant="outline"
                size="sm"
                title="Auto Layout"
              >
                <Layout className="h-4 w-4 mr-1" />
                Layout
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              onClick={handleLogin}
              variant="outline"
              size="sm"
              title="Login"
            >
              <LogIn className="h-4 w-4 mr-1" />
              Login
            </Button>
          )}
        </div>
      </div>
      <div className="flex-grow">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={onInit}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{
            type: 'default',
            animated: false,
            style: { stroke: '#000000', strokeWidth: 1.5 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 14,
              height: 14,
              color: '#000000',
            },
          }}
        >
          <Controls className={cn(isSidebarCollapsed && "mb-16")} />
          <MiniMap position="top-right" />
          <Background 
            variant={BackgroundVariant.Dots}
            gap={12} 
            size={1} 
          />
        </ReactFlow>
      </div>
    </div>
  );
};

export default TechStackFlow;
