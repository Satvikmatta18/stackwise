import React, { memo, useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Trash2, Pen, Save, MoreHorizontal, Edit } from 'lucide-react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface TechNodeProps {
  data: {
    label: string;
    details?: string;
    type: 'frontend' | 'backend' | 'database' | 'api' | 'deployment' | 'custom';
    icon?: React.ReactNode;
    onDelete?: (id: string) => void;
    onLabelChange?: (id: string, label: string) => void;
    onDetailsChange?: (id: string, details: string) => void;
  };
  id: string;
}

const TechNode = ({ data, id }: TechNodeProps) => {
  const [editingLabel, setEditingLabel] = useState(false);
  const [nodeLabel, setNodeLabel] = useState(data.label);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [currentDetails, setCurrentDetails] = useState(data.details || '');
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  
  useEffect(() => {
    if (isDetailsOpen) {
        setCurrentDetails(data.details || '');
        setIsEditingDetails(false);
    }
  }, [isDetailsOpen, data.details]);

  const nodeTypeColors = {
    frontend: 'bg-blue-500 text-white',
    backend: 'bg-green-500 text-white',
    database: 'bg-yellow-500 text-white',
    api: 'bg-purple-500 text-white',
    deployment: 'bg-red-500 text-white',
    custom: 'bg-gray-500 text-white',
  };

  const dialogTypeColors = {
    frontend: 'bg-blue-100 border-blue-300 text-blue-900',
    backend: 'bg-green-100 border-green-300 text-green-900',
    database: 'bg-yellow-100 border-yellow-300 text-yellow-900',
    api: 'bg-purple-100 border-purple-300 text-purple-900',
    deployment: 'bg-red-100 border-red-300 text-red-900',
    custom: 'bg-gray-100 border-gray-300 text-gray-900',
  };

  const getComponentInfo = (type: string) => {
    const componentInfo = {
      frontend: {
        title: "Frontend Component",
        sections: [
          {
            title: "Framework",
            subtitle: "react | vue | angular | svelte",
            description: "The primary frontend framework or library used for building the user interface."
          },
          {
            title: "Styling",
            subtitle: "tailwind | css | styled-components | sass",
            description: "CSS framework or styling approach used for component styling."
          },
          {
            title: "State Management",
            subtitle: "redux | zustand | context | recoil",
            description: "How application state is managed and shared across components."
          }
        ]
      },
      backend: {
        title: "Backend Service",
        sections: [
          {
            title: "Runtime",
            subtitle: "nodejs | python | java | go | rust",
            description: "The programming language and runtime environment for server-side logic."
          },
          {
            title: "Framework",
            subtitle: "express | fastapi | spring | gin | actix",
            description: "Web framework used for building the API and server logic."
          },
          {
            title: "Architecture",
            subtitle: "rest | graphql | grpc | microservices",
            description: "API architecture pattern and communication protocol."
          }
        ]
      },
      database: {
        title: "Database System",
        sections: [
          {
            title: "Type",
            subtitle: "postgresql | mysql | mongodb | redis | sqlite",
            description: "Database management system and data storage type."
          },
          {
            title: "Schema",
            subtitle: "relational | document | key-value | graph",
            description: "Data model and structure approach used."
          },
          {
            title: "Operations",
            subtitle: "crud | migrations | indexing | replication",
            description: "Primary database operations and management tasks."
          }
        ]
      },
      api: {
        title: "API Integration",
        sections: [
          {
            title: "Protocol",
            subtitle: "http | websocket | grpc | graphql",
            description: "Communication protocol used for API interactions."
          },
          {
            title: "Authentication",
            subtitle: "jwt | oauth | api-key | session",
            description: "Method used for securing API endpoints and user authentication."
          },
          {
            title: "Rate Limiting",
            subtitle: "throttling | quotas | caching | cdn",
            description: "API performance and usage control mechanisms."
          }
        ]
      },
      deployment: {
        title: "Deployment Platform",
        sections: [
          {
            title: "Environment",
            subtitle: "aws | gcp | azure | vercel | netlify",
            description: "Cloud platform or hosting service for application deployment."
          },
          {
            title: "Containerization",
            subtitle: "docker | kubernetes | serverless | vm",
            description: "Deployment and containerization strategy used."
          },
          {
            title: "CI/CD",
            subtitle: "github-actions | jenkins | gitlab-ci | circleci",
            description: "Continuous integration and deployment pipeline tools."
          }
        ]
      },
      custom: {
        title: "Custom Component",
        sections: [
          {
            title: "Purpose",
            subtitle: "utility | service | middleware | plugin",
            description: "The specific role and purpose of this custom component."
          },
          {
            title: "Integration",
            subtitle: "webhook | sdk | library | api",
            description: "How this component integrates with other system parts."
          },
          {
            title: "Configuration",
            subtitle: "env-vars | config-files | cli | gui",
            description: "Configuration and setup approach for this component."
          }
        ]
      }
    };
    
    return componentInfo[type as keyof typeof componentInfo] || componentInfo.custom;
  };

  const handleLabelChange = () => {
    if (data.onLabelChange && nodeLabel.trim()) {
      data.onLabelChange(id, nodeLabel);
      setEditingLabel(false);
    }
  };

  const handleDelete = () => {
    if (data.onDelete) {
      data.onDelete(id);
    }
  };

  const handleDetailsSave = () => {
    if (data.onDetailsChange) {
      data.onDetailsChange(id, currentDetails);
    }
    setIsEditingDetails(false);
    setIsDetailsOpen(false);
  };

  const handleDetailsCancel = () => {
      setCurrentDetails(data.details || '');
      setIsEditingDetails(false);
      setIsDetailsOpen(false);
  };

  return (
    <>
      <div className={`relative px-3 py-2 shadow-md rounded-md w-40 h-24 ${nodeTypeColors[data.type] || nodeTypeColors.custom} flex flex-col justify-between`}>
        {/* Top Section: Label/Input and Details Button */}
        <div className="flex justify-between items-start">
          {!editingLabel ? (
            <div className="text-sm font-bold pt-1">{data.label}</div>
          ) : (
            <input
              type="text"
              value={nodeLabel}
              onChange={(e) => setNodeLabel(e.target.value)}
              className="w-full text-sm bg-white/20 border border-white/30 rounded px-1 text-white mt-1 mr-6"
              autoFocus
            />
          )}
          {/* Details Button (Top Right) - Only shown when NOT editing label */}
          {!editingLabel && (
            <button
              onClick={() => setIsDetailsOpen(true)}
              className="absolute top-1 right-1 p-1 hover:bg-white/20 rounded"
              title="Details"
            >
              <MoreHorizontal size={16} />
            </button>
          )}
        </div>

        {/* Bottom Section: Type and Buttons */}
        <div className="flex justify-between items-end">
          {/* Type (Bottom Left) */}
          <div className="text-xs opacity-80 pb-1">{data.type}</div>
          
          {/* Buttons (Bottom Right) */}
          <div className="flex gap-1">
            {editingLabel ? (
              // Save Button - Only shown when editing label
              <button
                onClick={handleLabelChange}
                className="p-1 hover:bg-white/20 rounded"
                title="Save Label"
              >
                <Save size={16} />
              </button>
            ) : (
              // Edit Label and Delete Buttons - Only shown when NOT editing label
              <>
                <button
                  onClick={() => setEditingLabel(true)}
                  className="p-1 hover:bg-white/20 rounded"
                  title="Edit Label"
                >
                  <Pen size={16} />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1 hover:bg-white/20 rounded text-red-200"
                  title="Delete Node"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* --- Remove gray background from Handles --- */}
        <Handle type="target" position={Position.Top} className="w-2 h-2" />
        <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
        {/* --------------------------------------- */}
      </div>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className={`max-w-2xl w-[80vw] h-[70vh] flex flex-col p-4 ${dialogTypeColors[data.type] || dialogTypeColors.custom}`}>
          <h2 className="text-lg font-semibold mb-4">{getComponentInfo(data.type).title} - {data.label}</h2>
          
          <div className="flex-1 flex flex-col min-h-0 gap-4">
            {/* Component Information Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {getComponentInfo(data.type).sections.map((section, index) => (
                <div key={index} className="bg-white/40 rounded-lg p-3 border border-white/30">
                  <h3 className="font-semibold text-sm mb-1">{section.title}</h3>
                  <code className="text-xs bg-black/10 px-2 py-1 rounded font-mono block mb-2">
                    {section.subtitle}
                  </code>
                  <p className="text-xs opacity-80">{section.description}</p>
                </div>
              ))}
            </div>

            {/* Custom Details Section */}
            <div className="flex-1 flex flex-col min-h-0">
              <h3 className="font-semibold text-sm mb-2">Custom Details</h3>
              {isEditingDetails ? (
                <Textarea
                  value={currentDetails}
                  onChange={(e) => setCurrentDetails(e.target.value)}
                  placeholder="Enter node specifications, version, sub-components..."
                  className="flex-1 resize-none mb-4 font-mono text-sm bg-white/80 border-0 focus:bg-white"
                  autoFocus
                />
              ) : (
                <div className="flex-1 p-2 border rounded bg-white/60 overflow-auto mb-4 whitespace-pre-wrap font-mono text-sm">
                  {currentDetails || <span className="text-muted-foreground">No details provided.</span>}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" size="sm" onClick={handleDetailsCancel}>Cancel</Button>
            {!isEditingDetails ? (
              <Button size="sm" onClick={() => setIsEditingDetails(true)}>
                <Edit className="mr-1 h-4 w-4" /> Edit
              </Button>
            ) : (
              <Button size="sm" onClick={handleDetailsSave}>
                 <Save className="mr-1 h-4 w-4" /> Save Details
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default memo(TechNode);
