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
  Settings,
  Download
} from 'lucide-react';
import { toast } from "@/components/ui/sonner";

interface DocsProps {
  onBack: () => void;
  nodes: any[];
  edges: any[];
}

const Docs: React.FC<DocsProps> = ({ onBack, nodes, edges }) => {
  const [content, setContent] = useState(`# Project Name

A brief description of what this project does and who it's for.

## 🚀 Tech Stack

This project is built with the following technologies:

${nodes.map(node => `### ${node.data.label}
- **Type:** ${node.data.type}
- **Description:** ${node.data.details || 'No additional details provided'}

`).join('')}

## 🔗 Architecture

### Component Relationships
${edges.map(edge => {
  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);
  return `- ${sourceNode?.data.label || edge.source} → ${targetNode?.data.label || edge.target}`;
}).join('\n')}

## 📋 Prerequisites

Before running this project, make sure you have the following installed:
- Node.js (version 18 or higher)
- Python (version 3.8 or higher)
- Any other dependencies specific to your tech stack

## 🛠️ Installation

1. Clone the repository
\`\`\`bash
git clone <repository-url>
cd <project-name>
\`\`\`

2. Install dependencies
\`\`\`bash
# Frontend dependencies
npm install

# Backend dependencies
pip install -r requirements.txt
\`\`\`

3. Set up environment variables
\`\`\`bash
cp .env.example .env
# Edit .env with your configuration
\`\`\`

## 🚀 Getting Started

1. Start the backend server
\`\`\`bash
cd backend
python app.py
\`\`\`

2. Start the frontend development server
\`\`\`bash
npm run dev
\`\`\`

3. Open your browser and navigate to \`http://localhost:8080\`

## 📁 Project Structure

\`\`\`
project-root/
├── frontend/          # React frontend application
├── backend/           # Python backend API
├── docs/             # Documentation
└── README.md         # This file
\`\`\`

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| \`API_URL\` | Backend API URL | \`http://localhost:5001\` |
| \`NODE_ENV\` | Environment | \`development\` |

## 🧪 Testing

\`\`\`bash
# Run frontend tests
npm test

# Run backend tests
python -m pytest
\`\`\`

## 📦 Deployment

### Production Build

\`\`\`bash
# Build frontend
npm run build

# Deploy backend
gunicorn app:app
\`\`\`

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit your changes (\`git commit -m 'Add some AmazingFeature'\`)
4. Push to the branch (\`git push origin feature/AmazingFeature\`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you have any questions or need help, please open an issue on GitHub.

---

*This document was auto-generated based on the current tech stack configuration.*`);

  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    // In the future, this will save to backend
    toast.success("Document saved", { description: "Your changes have been saved." });
  };

  const handleGenerateWithAI = async () => {
    try {
      // Show loading state
      toast.loading("AI is enhancing your README...", { duration: 3000 });
      
      // Analyze current content and identify areas that need filling
      let enhancedContent = content;
      
      // Replace generic project name
      if (enhancedContent.includes('# Project Name')) {
        enhancedContent = enhancedContent.replace(
          '# Project Name\n\nA brief description of what this project does and who it\'s for.',
          `# ${nodes.length > 0 ? nodes[0].data.label + ' Stack' : 'Tech Stack'} Project\n\nA modern web application built with a comprehensive tech stack for optimal performance and scalability. This project demonstrates best practices in full-stack development with a focus on user experience and maintainable code architecture.`
        );
      }
      
      // Fill in missing tech stack descriptions
      const techStackSection = enhancedContent.match(/## 🚀 Tech Stack[\s\S]*?(?=## |$)/);
      if (techStackSection) {
        let techStackContent = techStackSection[0];
        
        // Replace generic descriptions for each tech component
        techStackContent = techStackContent.replace(
          /- \*\*Description:\*\* No additional details provided/g,
          (match, index) => {
            // Find the corresponding node
            const nodeIndex = Math.floor((index - techStackContent.indexOf('###')) / 100); // Rough estimation
            const node = nodes[nodeIndex];
            if (node) {
              const descriptions = {
                frontend: 'Modern user interface built with cutting-edge frontend technologies for responsive and interactive user experiences.',
                backend: 'Robust server-side application providing RESTful APIs and business logic with high performance and scalability.',
                database: 'Reliable data storage solution ensuring data integrity, performance, and seamless integration with the application stack.',
                api: 'Well-designed API layer facilitating communication between frontend and backend services with comprehensive documentation.',
                deployment: 'Streamlined deployment pipeline ensuring reliable, secure, and efficient application delivery to production environments.',
                custom: 'Custom solution tailored to specific project requirements with optimized performance and maintainability.'
              };
              return `- **Description:** ${descriptions[node.data.type] || descriptions.custom}`;
            }
            return match;
          }
        );
        
        enhancedContent = enhancedContent.replace(techStackSection[0], techStackContent);
      }
      
      // Add more detailed installation instructions if they're generic
      if (enhancedContent.includes('git clone <repository-url>')) {
        enhancedContent = enhancedContent.replace(
          'git clone <repository-url>\ncd <project-name>',
          `git clone https://github.com/yourusername/${nodes.length > 0 ? nodes[0].data.label.toLowerCase().replace(/\s+/g, '-') : 'tech-stack'}-project\ncd ${nodes.length > 0 ? nodes[0].data.label.toLowerCase().replace(/\s+/g, '-') : 'tech-stack'}-project`
        );
      }
      
      // Add specific environment variables based on tech stack
      if (enhancedContent.includes('| `API_URL` | Backend API URL | `http://localhost:5001` |')) {
        const envVars = [];
        
        // Add environment variables based on detected tech stack
        nodes.forEach(node => {
          if (node.data.type === 'database') {
            envVars.push('| `DATABASE_URL` | Database connection string | `postgresql://user:pass@localhost:5432/dbname` |');
          }
          if (node.data.type === 'backend') {
            envVars.push('| `SECRET_KEY` | Application secret key | `your-secret-key-here` |');
            envVars.push('| `DEBUG` | Debug mode flag | `True` |');
          }
          if (node.data.type === 'api') {
            envVars.push('| `API_VERSION` | API version number | `v1` |');
          }
        });
        
        if (envVars.length > 0) {
          enhancedContent = enhancedContent.replace(
            '| `NODE_ENV` | Environment | `development` |',
            `| \`NODE_ENV\` | Environment | \`development\` |\n${envVars.join('\n')}`
          );
        }
      }
      
      // Add specific testing commands based on tech stack
      if (enhancedContent.includes('npm test')) {
        let testingSection = enhancedContent.match(/## 🧪 Testing[\s\S]*?(?=## |$)/);
        if (testingSection) {
          let testingContent = testingSection[0];
          
          // Add specific testing commands based on detected technologies
          const testCommands = [];
          nodes.forEach(node => {
            if (node.data.label.toLowerCase().includes('react')) {
              testCommands.push('# Run React component tests\nnpm run test:components');
            }
            if (node.data.label.toLowerCase().includes('flask')) {
              testCommands.push('# Run Flask API tests\npython -m pytest tests/api/');
            }
            if (node.data.label.toLowerCase().includes('postgres')) {
              testCommands.push('# Run database tests\npython -m pytest tests/database/');
            }
          });
          
          if (testCommands.length > 0) {
            testingContent = testingContent.replace(
              'python -m pytest',
              `python -m pytest\n\n${testCommands.join('\n')}`
            );
            enhancedContent = enhancedContent.replace(testingSection[0], testingContent);
          }
        }
      }
      
      // Add deployment-specific instructions
      if (enhancedContent.includes('gunicorn app:app')) {
        let deploymentSection = enhancedContent.match(/## 📦 Deployment[\s\S]*?(?=## |$)/);
        if (deploymentSection) {
          let deploymentContent = deploymentSection[0];
          
          const deploymentSteps = [];
          nodes.forEach(node => {
            if (node.data.type === 'frontend') {
              deploymentSteps.push('# Deploy frontend to Vercel/Netlify\nnpm run build && vercel --prod');
            }
            if (node.data.type === 'database') {
              deploymentSteps.push('# Set up production database\n# Configure connection string in environment variables');
            }
          });
          
          if (deploymentSteps.length > 0) {
            deploymentContent = deploymentContent.replace(
              'gunicorn app:app',
              `gunicorn app:app\n\n${deploymentSteps.join('\n')}`
            );
            enhancedContent = enhancedContent.replace(deploymentSection[0], deploymentContent);
          }
        }
      }
      
      // Update the content state
      setContent(enhancedContent);
      
      // Show success message
      toast.success("README enhanced!", { 
        description: "AI has filled in missing descriptions and improved your documentation." 
      });
      
    } catch (error) {
      console.error('Error enhancing README with AI:', error);
      toast.error("Enhancement failed", { 
        description: "There was an error enhancing your README. Please try again." 
      });
    }
  };

  const handleExport = () => {
    // Create a blob with the markdown content
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = url;
    link.download = 'README.md';
    
    // Trigger the download
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("README exported", { description: "README.md has been downloaded successfully." });
  };

  const handlePreview = () => {
    // Create a blob with the markdown content
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    // Open in a new tab
    window.open(url, '_blank');
    
    // Clean up after a delay
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
    
    toast.info("Preview opened", { description: "README preview opened in a new tab." });
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
            <h1 className="text-lg font-semibold">README.md</h1>
            <Badge variant="secondary" className="ml-2">Auto-generated</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreview}
            className="flex items-center gap-2"
            title="Preview README"
          >
            <FileText className="h-4 w-4" />
            Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="flex items-center gap-2"
            title="Export README"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateWithAI}
            className="flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Fill with AI
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
      <div className="flex-1 overflow-auto bg-background">
        <div className="max-w-4xl mx-auto p-6">
          {isEditing ? (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[calc(100vh-300px)] resize-none border-0 focus:ring-0 text-sm leading-relaxed font-mono bg-background"
              placeholder="Start writing your README documentation..."
            />
          ) : (
            <div className="prose prose-sm max-w-none bg-background">
              <div 
                className="whitespace-pre-wrap font-mono text-sm leading-relaxed bg-background"
                dangerouslySetInnerHTML={{ 
                  __html: content
                    .replace(/# (.*)/g, '<h1 class="text-3xl font-bold mb-6 text-foreground">$1</h1>')
                    .replace(/## (.*)/g, '<h2 class="text-2xl font-semibold mb-4 mt-8 text-foreground">$1</h2>')
                    .replace(/### (.*)/g, '<h3 class="text-xl font-semibold mb-3 mt-6 text-foreground">$1</h3>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
                    .replace(/- (.*)/g, '<li class="ml-6 mb-1">• $1</li>')
                    .replace(/\n\n/g, '<br><br>')
                    .replace(/```(\w+)\n([\s\S]*?)```/g, '<pre class="bg-muted p-4 rounded-md overflow-x-auto my-4"><code class="text-sm">$2</code></pre>')
                    .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
                }}
              />
            </div>
          )}
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