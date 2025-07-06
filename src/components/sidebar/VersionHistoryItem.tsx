import React from 'react';
import { Button } from '@/components/ui/button';
import { Node, Edge } from '@xyflow/react';

interface VersionHistoryItemProps {
  version: {
    id: string;
    timestamp: string;
    description: string;
    nodes: Node[];
    edges: Edge[];
  };
  onRestore: (id: string) => void;
  isActive: boolean;
}

const VersionHistoryItem = ({ version, onRestore, isActive }: VersionHistoryItemProps) => {
  return (
    <div className={`p-3 mb-1 rounded-md ${isActive ? 'bg-secondary' : 'hover:bg-secondary/50'}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium text-sm">{version.description}</div>
          <div className="text-xs text-muted-foreground">{version.timestamp}</div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onRestore(version.id)}
          className="text-xs"
        >
          Restore
        </Button>
      </div>
    </div>
  );
};

export default VersionHistoryItem;