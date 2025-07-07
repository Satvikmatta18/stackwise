import os
import json
import textwrap
import requests # NEW IMPORT
import asyncio # NEW IMPORT
from flask import Flask, request, jsonify, session, redirect, url_for
from flask_cors import CORS
from dotenv import load_dotenv # Keep import
import google.generativeai as genai
import traceback # Import traceback for better error logging
import secrets # NEW IMPORT
from google.generativeai.types import HarmCategory, HarmBlockThreshold
from llm_prompt_builder import generate_llm_builder_prompt
from multi_agent_codegen import multi_agent_generate_backend
from repo_builder import generate_repo_builder_script_with_gemini # Corrected to import function directly

# --- Import generator functions ---
# from prompt_generator import format_prompt_from_data # Keep if still used
# from repo_builder import generate_repo_builder_script_with_gemini # This line is redundant now, removed
# ----------------------------------

# Load environment variables
load_dotenv()

api_key = "AIzaSyA-IwMGX27O_eKKB9klqbiBbOMgh8WEPDo"
app = Flask(__name__)
app.secret_key = os.urandom(24) # Set a secret key for session management
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax' # Adjust for cross-site cookie handling
app.config['SESSION_COOKIE_SECURE'] = False # Set to False for HTTP (localhost) development
# Allow requests from frontend (adjust origin if your frontend runs elsewhere)
# More explicit CORS setup
frontend_url = "http://localhost:8080" # Explicitly set for consistency with frontend

CORS(
    app,
    resources={ r"/api/*": { "origins": [frontend_url, "http://localhost:8080"] } },
    supports_credentials=True,
    allow_headers=["Content-Type"],
    methods=["GET", "POST", "OPTIONS"]
)

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") # Ensure this is loaded from .env
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables")

# Configure GitHub OAuth
FLASK_GITHUB_CLIENT_ID = os.getenv("FLASK_GITHUB_CLIENT_ID")
FLASK_GITHUB_CLIENT_SECRET = os.getenv("FLASK_GITHUB_CLIENT_SECRET")

if not FLASK_GITHUB_CLIENT_ID or not FLASK_GITHUB_CLIENT_SECRET:
    print("WARNING: Flask GitHub Client ID or Secret not found in environment variables. GitHub integration will not work.")


# In-memory storage for simplicity (replace with a database for production)
user_sessions = {}

# --- Gemini API Setup ---
def setup_gemini_api():
    """Configure and initialize the Gemini API model.
    Explicitly loads .env inside the function with override=True.
    """
    try:
        # --- Explicitly load .env from the script's directory --- 
        script_dir = os.path.dirname(__file__)
        dotenv_path = os.path.join(script_dir, '.env')
        # print(f"--- DEBUG: Explicitly loading .env from: {dotenv_path} with override=True ---")
        loaded = load_dotenv(dotenv_path=dotenv_path, override=True)
        # if not loaded:
            # print(f"--- WARNING: load_dotenv did not find file at: {dotenv_path} ---")
        # --------------------------------------------------------

        # Retrieve the key AFTER the explicit load_dotenv call
        api_key = "AIzaSyA-IwMGX27O_eKKB9klqbiBbOMgh8WEPDo"
        genai.configure(api_key=api_key)

        # Initialize the model exactly as in detail-generator.py
        model_name = 'gemini-1.5-flash-latest'
        model = genai.GenerativeModel(model_name)
        
        print(f"Using {model_name} model") 
        print(f"Gemini API configured successfully with model: {model.model_name} (using key from environment)")
        return model
        
    except Exception as e:
        print(f"Error configuring Gemini API: {e}")
        return None

gemini_model = setup_gemini_api()

# --- Fallback Mock Function --- (Adapted from json-generator.py)
def create_mock_tech_stack(description):
    """Create a simple mock tech stack graph when API fails."""
    print(f"Creating mock tech stack as fallback for description: {description[:50]}...")
    # Basic structure compatible with React Flow
    nodes = [
        {
            "id": "mock_node_react",
            "type": "techNode",
            "position": {"x": 100, "y": 100},
            "data": {"label": "React", "type": "frontend", "details": ""}
        },
        {
            "id": "mock_node_flask",
            "type": "techNode",
            "position": {"x": 100, "y": 300},
            "data": {"label": "Flask", "type": "backend", "details": "PORT=5001"}
        },
        {
            "id": "mock_node_postgres",
            "type": "techNode",
            "position": {"x": 400, "y": 300},
            "data": {"label": "PostgreSQL", "type": "database", "details": "DB_URL=..."}
        }
    ]
    edges = [
        {
            "id": "mock_edge_react_flask",
            "source": "mock_node_react",
            "target": "mock_node_flask",
            "type": "default",
            "markerEnd": {"type": "arrowclosed"}
        },
        {
            "id": "mock_edge_flask_postgres",
            "source": "mock_node_flask",
            "target": "mock_node_postgres",
            "type": "default",
            "markerEnd": {"type": "arrowclosed"}
        }
    ]
    return {"nodes": nodes, "edges": edges, "mocked": True} # Add flag to indicate mock data

# --- Helper: Generate Graph from Scratch ---
def generate_graph_from_scratch(description):
    """Uses Gemini to generate a NEW tech stack graph JSON from a description."""
    if not gemini_model:
        print("Gemini model not initialized, using mock fallback.")
        return create_mock_tech_stack(description)

    # --- PROMPT FOR NEW GRAPH --- 
    prompt = textwrap.dedent(f"""
    You are a senior software architect designing a tech stack diagram for a web application.
    Based *only* on the project description below, generate a *complete* tech stack graph.

    Project description: {description}

    Return ONLY a valid JSON object with this exact structure compatible with React Flow:
    {{
      "nodes": [
        {{
          "id": "node_unique_string_id_1",  // Unique STRING ID (e.g., "node_react", "node_postgres")
          "type": "techNode",              // Default node type for React Flow
          "position": {{ "x": 100, "y": 200 }}, // REQUIRED x/y position
          "data": {{                    // Data payload for the node
            "label": "Component Name",   // The display name (e.g., "React", "PostgreSQL")
            "type": "frontend|backend|database|api|deployment|custom", // Categorical type
            "details": "Detailed description of this component..." // DETAILED DESCRIPTION HERE
          }}
        }}
        // ... more nodes
      ],
      "edges": [
        {{
          "id": "edge_unique_string_id_1", // Unique STRING ID (e.g., "edge_react_to_api")
          "source": "node_react_id",           // Source node STRING ID
          "target": "node_api_id",             // Target node STRING ID
          "type": "default",                 // Optional: React Flow edge type
          "markerEnd": {{ "type": "arrowclosed" }} // Add arrowheads
        }}
        // ... more edges
      ]
    }}

    Instructions for Generation:
    1. Include logical components: Frontend, Backend, Databases, APIs/Services, Deployment.
    2. Assign relevant categorical `type`.
    3. Position nodes logically (0-1000 units).
    4. Create edges between related components.
    5. Use descriptive, unique STRING `id`s.
    6. **IMPORTANT for `data.details`**: Provide key technical specifications (versions, configurations, sub-components). Avoid generic descriptions. (Examples as before)
    7. Ensure the final output is ONLY the valid JSON object.
    """)
    # --- END PROMPT --- 

    try:
        print(f"Sending prompt to Gemini for NEW graph generation: {description[:50]}...")
        response = gemini_model.generate_content(prompt)

        # Handle potential safety blocks or empty responses
        if not response.parts:
            feedback = response.prompt_feedback
            print(f"Warning: Gemini response blocked or empty. Feedback: {feedback}")
            # Fallback to mock if blocked/empty
            print("Gemini response blocked/empty, using mock fallback.")
            return create_mock_tech_stack(description)

        response_text = response.text
        print("Received response text from Gemini (React Flow format expected).")

        # Attempt to extract JSON cleanly
        tech_stack = None
        try:
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            if json_start != -1 and json_end != 0:
                json_str = response_text[json_start:json_end]
                tech_stack = json.loads(json_str)
            else:
                 raise ValueError("No JSON object structure found in response.")
        except (json.JSONDecodeError, ValueError) as json_e:
            print(f"JSON Decode Error (React Flow format): {json_e}")
            print(f"Response Text causing error:\n---\n{response_text}\n---")
            # Fallback to mock if JSON is invalid
            print(f"Invalid JSON from Gemini ({json_e}), using mock fallback.")
            return create_mock_tech_stack(description)

        # Basic validation of the parsed structure
        if not isinstance(tech_stack.get('nodes'), list) or not isinstance(tech_stack.get('edges'), list):
             print("Generated JSON has incorrect structure, using mock fallback.")
             return create_mock_tech_stack(description)

        print(f"Successfully generated NEW graph for: {description[:50]}...")
        return tech_stack # Return the data directly
        
    except Exception as e:
        # Catch-all for other Gemini/network errors
        print(f"Error during Gemini call or processing: {e}, using mock fallback.")
        return create_mock_tech_stack(description) # Use mock for other errors

# --- Helper: Modify or Replace Graph ---
def modify_or_replace_graph(existing_graph_json, user_request):
    """Uses Gemini to modify an existing graph based on a user request, 
       OR generates a new graph if the request is fundamentally different."""
    if not gemini_model:
        print("Gemini model not initialized, using mock fallback.")
        # Maybe return the existing graph instead of mock? Or mock?
        return create_mock_tech_stack(user_request) # Or return existing_graph_json?

    try:
        existing_graph_str = json.dumps(existing_graph_json, indent=2)
    except TypeError:
        existing_graph_str = str(existing_graph_json) 
        print("Warning: Could not serialize existing graph to JSON for modification prompt.")

    # --- PROMPT FOR MODIFICATION/REPLACEMENT --- 
    prompt = textwrap.dedent(f"""
    You are a senior software architect updating a tech stack diagram.
    You are given an existing tech stack graph and a user request.

    Existing Graph: {existing_graph_str}

    User Request: {user_request}

    Return ONLY a valid JSON object with this exact structure compatible with React Flow, representing the *updated* graph. If the request implies a completely different graph, generate a new one. Provide a `nodes` and `edges` array. If no change is needed, return the original JSON. The `id`s for nodes and edges should remain unique.

    **Critical Instructions:**
    - If adding new nodes, ensure they have unique string `id`s, `type: "techNode"`, `position` (x,y), and `data` with `label`, `type`, and `details`.
    - If adding new edges, ensure they have unique string `id`s, `source`, `target`, `type: "default"`, and `markerEnd`.
    - Preserve existing node and edge IDs unless they are being fundamentally replaced.
    - Ensure the JSON is well-formed.
    """)
    # --- END PROMPT --- 

    try:
        print(f"Sending prompt to Gemini for graph modification: {user_request[:50]}...")
        response = gemini_model.generate_content(prompt)

        if not response.parts:
            feedback = response.prompt_feedback
            print(f"Warning: Gemini response blocked or empty. Feedback: {feedback}")
            return existing_graph_json # Return original if blocked
        
        response_text = response.text
        print("Received response text from Gemini (React Flow format expected for modification).")

        updated_graph = None
        try:
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            if json_start != -1 and json_end != 0:
                json_str = response_text[json_start:json_end]
                updated_graph = json.loads(json_str)
            else:
                 raise ValueError("No JSON object structure found in response.")
        except (json.JSONDecodeError, ValueError) as json_e:
            print(f"JSON Decode Error (Modification): {json_e}")
            print(f"Response Text causing error:\n---\n{response_text}\n---")
            return existing_graph_json # Return original if invalid JSON

        if not isinstance(updated_graph.get('nodes'), list) or not isinstance(updated_graph.get('edges'), list):
             print("Generated JSON for modification has incorrect structure, returning original.")
             return existing_graph_json

        print(f"Successfully modified graph for: {user_request[:50]}...")
        return updated_graph

    except Exception as e:
        print(f"Error during Gemini call for graph modification: {e}, returning original graph.")
        return existing_graph_json

# --- Helper: Generate Graph Explanation ---
def generate_graph_explanation(graph_json, original_prompt):
    """Uses Gemini to generate an explanation for a given tech stack graph."""
    if not gemini_model:
        print("Gemini model not initialized, cannot generate explanation.")
        return "# Error: AI model not available for explanation."

    try:
        graph_str = json.dumps(graph_json, indent=2)
    except TypeError:
        graph_str = str(graph_json)
        print("Warning: Could not serialize graph to JSON for explanation prompt.")

    # --- PROMPT FOR EXPLANATION --- 
    prompt = textwrap.dedent(f"""
    You are an expert technical writer. Given the following tech stack graph and the original user prompt for its creation, generate a comprehensive explanation in markdown format.

    Tech Stack Graph: {graph_str}

    Original User Prompt: {original_prompt}

    Your explanation should:
    1. Start with a concise summary of the overall project or system being described by the graph.
    2. Detail each major component (node), explaining its role and key technologies (from `details`).
    3. Describe the relationships and data flows (edges) between components.
    4. Discuss how the architecture addresses the original user prompt, if applicable.
    5. Conclude with potential next steps or considerations for this architecture.
    6. Use clear, professional, and accessible language.
    7. Format using Markdown (e.g., # Headings, - Lists, **Bold**, `code`).
    """)
    # --- END PROMPT --- 

    try:
        print(f"Sending prompt to Gemini for graph explanation: {original_prompt[:50]}...")
        response = gemini_model.generate_content(prompt)

        if not response.parts:
            feedback = response.prompt_feedback
            print(f"Warning: Gemini explanation response blocked or empty. Feedback: {feedback}")
            return f"# Error: AI explanation response was blocked or empty. Feedback: {feedback}"

        explanation_text = response.text
        print("Received explanation text from Gemini.")
        return explanation_text

    except Exception as e:
        print(f"Error during Gemini call for explanation: {e}")
        return f"# Error: An exception occurred during explanation generation: {e}"

# --- API Endpoints ---

@app.route('/api/generate-graph', methods=['POST'])
def api_generate_graph():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    description = data.get('description', '')
    existing_graph = data.get('existingGraph')

    if not description and not existing_graph:
        return jsonify({"error": "Either 'description' or 'existingGraph' must be provided."}), 400

    if existing_graph: # User wants to modify or replace existing graph
        # Ensure existing_graph is parsed correctly if it came as a string
        if isinstance(existing_graph, str):
            try:
                existing_graph = json.loads(existing_graph)
            except json.JSONDecodeError:
                return jsonify({"error": "Invalid JSON for existingGraph"}), 400
        
        # Call the modification/replacement function
        generated_graph_data = modify_or_replace_graph(existing_graph, description)
        print("Graph modified or replaced.")
    else: # User wants to generate from scratch
        generated_graph_data = generate_graph_from_scratch(description)
        print("New graph generated from scratch.")

    return jsonify(generated_graph_data)

@app.route('/api/explain-graph', methods=['POST'])
def api_explain_graph():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400
    data = request.get_json()
    graph_data = data.get('graphData')
    original_prompt = data.get('originalPrompt', 'No specific prompt was given.')

    if not graph_data:
        return jsonify({"error": "Missing graphData"}), 400

    explanation_markdown = generate_graph_explanation(graph_data, original_prompt)

    return jsonify({"markdownExplanation": explanation_markdown})

@app.route('/api/build-prompt', methods=['POST'])
def build_prompt():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400
    data = request.get_json()
    graph_data = data.get('graphData')
    user_context = data.get('userContext', '')

    if not graph_data:
        return jsonify({"error": "Missing graphData"}), 400

    # Use the imported function directly
    markdown_prompt = generate_llm_builder_prompt(graph_data, user_context)

    return jsonify({"markdownPrompt": markdown_prompt})

@app.route('/api/generate-repo-script', methods=['POST'])
def generate_repo_script():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400
    data = request.get_json()
    graph_data = data.get('graphData')
    user_context = data.get('userContext', '')

    if not graph_data:
        return jsonify({"error": "Missing graphData"}), 400

    # Use the imported function directly and pass the gemini_model
    bash_script = generate_repo_builder_script_with_gemini(graph_data, user_context, gemini_model)

    return jsonify({"bashScript": bash_script})

@app.route('/api/multi-agent-generate', methods=['POST'])
def multi_agent_generate():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400
    data = request.get_json()

    # NEW: Inject GitHub access token and owner from session if available
    github_access_token = session.get('github_access_token')
    if github_access_token:
        data['githubAccessToken'] = github_access_token
    
    # If the frontend sent githubOwner (e.g., from githubUser.login),
    # we will use that. Otherwise, if you stored it in session during OAuth,
    # you could retrieve it here as well.
    # For now, assuming frontend sends it if it has it from `githubUser.login`.
    
    # Ensure gemini_model is available
    gemini_model = genai.GenerativeModel(
        'gemini-1.5-flash',
        safety_settings={
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARMS_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARMS_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
        },
        api_key=GEMINI_API_KEY
    )

    # NEW: Call the async multi_agent_generate_backend function
    result, status = asyncio.run(multi_agent_generate_backend(data, gemini_model))
    return jsonify(result), status

@app.route('/api/test-gemini', methods=['GET'])
def test_gemini_api():
    if not gemini_model:
        return jsonify({"error": "Gemini model not configured"}), 500
    try:
        # Simple test prompt
        response = gemini_model.generate_content("Say hi.")
        return jsonify({"status": "success", "message": response.text})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/')
def health_check():
    return jsonify({"status": "ok", "message": "Flask backend is running."})

# GitHub OAuth Endpoints
@app.route('/api/github/login')
def github_login():
    if not FLASK_GITHUB_CLIENT_ID:
        return jsonify({"message": "GitHub integration not configured"}), 500
    
    # Generate a random string for state parameter to prevent CSRF
    state = secrets.token_urlsafe(16)
    session['github_oauth_state'] = state
    # print(f"DEBUG: Stored GitHub OAuth state: {state}")

    # The scope 'repo' grants access to create and manage repositories
    # You might want to refine this based on your exact needs.
    github_auth_url = f"https://github.com/login/oauth/authorize?client_id={FLASK_GITHUB_CLIENT_ID}&scope=repo&state={state}"
    return redirect(github_auth_url)

@app.route('/api/github/callback')
def github_callback():
    code = request.args.get('code')
    state = request.args.get('state') # NEW: Get state from callback
    # print(f"DEBUG: Received state from GitHub callback: {state}")
    # print(f"DEBUG: Stored state in session: {session.get('github_oauth_state')}")

    # NEW: Verify state parameter
    if not state or state != session.get('github_oauth_state'):
        # Invalidate the state to prevent replay attacks
        session.pop('github_oauth_state', None)
        return jsonify({"message": "OAuth state parameter missing or mismatched", "error": "invalid_request", "error_code": "bad_oauth_callback"}), 400
    
    # Clean up the state from session after verification
    session.pop('github_oauth_state', None)

    if not code:
        return jsonify({"message": "Authorization code not received"}), 400

    if not FLASK_GITHUB_CLIENT_ID or not FLASK_GITHUB_CLIENT_SECRET:
        return jsonify({"message": "GitHub integration not configured"}), 500

    # Exchange code for access token
    token_url = "https://github.com/login/oauth/access_token"
    headers = {'Accept': 'application/json'}
    payload = {
        'client_id': FLASK_GITHUB_CLIENT_ID,
        'client_secret': FLASK_GITHUB_CLIENT_SECRET,
        'code': code
    }
    try:
        response = requests.post(token_url, headers=headers, json=payload)
        response.raise_for_status() # Raise an HTTPError for bad responses (4xx or 5xx)
        access_token_data = response.json()
        access_token = access_token_data.get('access_token')

        if not access_token:
            return jsonify({"message": "Failed to get access token", "details": access_token_data}), 500

        session['github_access_token'] = access_token
        print(f"DEBUG: github_callback - Stored access token in session: {access_token[:5]}...")
        print(f"DEBUG: github_callback - Full session after storing token: {session}")
        
        # Redirect to the frontend application's main page or a success page
        # You might want to pass a success/failure parameter here
        return redirect("http://localhost:8080") # Redirect to your frontend URL
    except requests.exceptions.RequestException as e:
        print(f"Error exchanging code for token: {e}")
        return jsonify({"message": "Error during GitHub OAuth callback", "details": str(e)}), 500

@app.route('/api/github/user')
def github_user():
    access_token = session.get('github_access_token')
    print(f"DEBUG: github_user endpoint - access_token from session: {access_token}")
    if not access_token:
        return jsonify({"message": "Not authenticated with GitHub"}), 401

    headers = {
        'Authorization': f'token {access_token}',
        'Accept': 'application/vnd.github.v3+json'
    }
    try:
        response = requests.get("https://api.github.com/user", headers=headers)
        response.raise_for_status()
        user_data = response.json()
        return jsonify(user_data)
    except requests.exceptions.RequestException as e:
        print(f"Error fetching GitHub user data: {e}")
        return jsonify({"message": "Failed to fetch GitHub user data", "details": str(e)}), 500

@app.route('/api/github/create_repository', methods=['POST'])
def create_github_repository():
    print(f"DEBUG: create_github_repository endpoint - Current session: {session}")
    access_token = session.get('github_access_token')
    print(f"DEBUG: create_github_repository endpoint - access_token from session: {access_token}")
    if not access_token:
        return jsonify({"message": "Not authenticated with GitHub"}), 401

    data = request.json
    repo_name = data.get('name')
    description = data.get('description', 'Tech stack graph generated by Stackwise')
    private = data.get('private', False)

    if not repo_name:
        return jsonify({"message": "Repository name is required"}), 400

    headers = {
        'Authorization': f'token {access_token}',
        'Accept': 'application/vnd.github.v3+json'
    }
    payload = {
        'name': repo_name,
        'description': description,
        'private': private,
        'auto_init': True # Initializes with a README.md
    }
    try:
        response = requests.post("https://api.github.com/user/repos", headers=headers, json=payload)
        response.raise_for_status()
        repo_data = response.json()
        return jsonify(repo_data)
    except requests.exceptions.RequestException as e:
        print(f"Error creating GitHub repository: {e}")
        # More detailed error for common cases
        if response.status_code == 422 and "name already exists" in response.text.lower():
            return jsonify({"message": "Repository with this name already exists.", "details": response.json()}), 409 # Conflict
        return jsonify({"message": "Failed to create repository", "details": str(e), "response": response.text}), 500

if __name__ == '__main__':
    app.run(host='localhost', port=5001, debug=True)
