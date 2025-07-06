import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Bold, 
  Italic, 
  List, 
  ListOrdered,
  Code,
  Image,
  Sparkles,
  FileText,
  Settings
} from 'lucide-react';
import { toast } from "@/components/ui/sonner";

interface DocsProps {
  onBack: () => void;
  nodes: any[];
  edges: any[];
}

const Docs: React.FC<DocsProps> = ({ onBack, nodes, edges }) => {
  const [content, setContent] = useState(`# Technical Design Document

## System Overview

This document outlines the technical architecture and design decisions for the current tech stack.

## Architecture Components

${nodes.map(node => `### ${node.data.label}
**Type:** ${node.data.type}
**Details:** ${node.data.details || 'No additional details provided'}

`).join('')}

## Component Relationships

${edges.map(edge => {
  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);
  return `- ${sourceNode?.data.label || edge.source} → ${targetNode?.data.label || edge.target}`;
}).join('\n')}

## Development Guidelines

### Best Practices
- Follow clean code principles
- Implement proper error handling
- Use type safety where applicable
- Document APIs and interfaces

### Security Considerations
- Implement proper authentication and authorization
- Use HTTPS for all communications
- Validate and sanitize all inputs
- Follow OWASP security guidelines

### Performance Optimization
- Implement caching strategies
- Optimize database queries
- Use CDN for static assets
- Monitor and profile application performance

## Deployment Strategy

### Environment Setup
- Development environment for local development
- Staging environment for testing
- Production environment for live deployment

### CI/CD Pipeline
- Automated testing on code changes
- Automated deployment to staging
- Manual approval for production deployment

## Monitoring and Observability

### Logging
- Structured logging across all components
- Centralized log aggregation
- Log level management

### Metrics
- Application performance metrics
- Infrastructure monitoring
- Business metrics tracking

### Alerting
- Proactive alerting for issues
- Escalation procedures
- On-call rotation

## Future Considerations

### Scalability
- Horizontal scaling strategies
- Database sharding considerations
- Microservices architecture evolution

### Technology Updates
- Regular dependency updates
- Security patch management
- Technology stack evolution

---

*This document was auto-generated based on the current tech stack configuration.*`);

  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    // In the future, this will save to backend
    toast.success("Document saved", { description: "Your changes have been saved." });
  };

  const handleGenerateWithAI = () => {
    // In the future, this will call AI to enhance the document
    toast.info("AI Enhancement", { description: "AI enhancement feature coming soon!" });
  };

  const toolbarButtons = [
    { icon: Bold, label: "Bold", action: () => {} },
    { icon: Italic, label: "Italic", action: () => {} },
    { icon: List, label: "Bullet List", action: () => {} },
    { icon: ListOrdered, label: "Numbered List", action: () => {} },
    { icon: Code, label: "Code Block", action: () => {} },
    { icon: Image, label: "Image", action: () => {} },
  ];

  return (
    <div className="h-full w-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-card">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Graph
          </Button>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h1 className="text-lg font-semibold">Technical Documentation</h1>
            <Badge variant="secondary" className="ml-2">Auto-generated</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateWithAI}
            className="flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Enhance with AI
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            {isEditing ? 'Preview' : 'Edit'}
          </Button>
          <Button
            onClick={handleSave}
            size="sm"
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      {isEditing && (
        <div className="flex items-center gap-1 p-2 border-b bg-muted/30">
          {toolbarButtons.map((button, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={button.action}
              className="h-7 w-7 p-0"
              title={button.label}
            >
              <button.icon className="h-3 w-3" />
            </Button>
          ))}
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6 relative">
          {/* Dotted Background Pattern */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                radial-gradient(circle, #e5e7eb 1px, transparent 1px)
              `,
              backgroundSize: '12px 12px',
              opacity: 0.5
            }}
          />
          
          {/* Content with relative positioning to appear above background */}
          <div className="relative z-10">
            {isEditing ? (
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[calc(100vh-300px)] resize-none border-0 focus:ring-0 text-sm leading-relaxed font-mono bg-transparent"
                placeholder="Start writing your technical documentation..."
              />
            ) : (
              <div className="prose prose-sm max-w-none">
                <div 
                  className="whitespace-pre-wrap font-mono text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: content
                      .replace(/# (.*)/g, '<h1 class="text-2xl font-bold mb-3">$1</h1>')
                      .replace(/## (.*)/g, '<h2 class="text-xl font-semibold mb-2 mt-4">$1</h2>')
                      .replace(/### (.*)/g, '<h3 class="text-lg font-semibold mb-2 mt-3">$1</h3>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      .replace(/- (.*)/g, '<li class="ml-4">$1</li>')
                      .replace(/\n\n/g, '<br><br>')
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-3 border-t bg-muted/30 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span>Last saved: Just now</span>
          <span>•</span>
          <span>{content.length} characters</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Draft</Badge>
        </div>
      </div>
    </div>
  );
};

export default Docs; 