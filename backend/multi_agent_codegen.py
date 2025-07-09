import os
import json
import textwrap
from flask import request, jsonify, session
import requests # NEW: Import requests for HTTP calls to GitHub API

def build_plan_prompt(graph_data, chat_history, user_context):
    """Prompt Gemini to create a detailed, step-by-step build plan."""
    return textwrap.dedent(f"""
    You are a senior AI project manager. Given the following:

    - Tech stack graph (nodes/edges): {json.dumps(graph_data, indent=2)}
    - Recent chat history: {json.dumps(chat_history[-10:], indent=2)}
    - User context: {user_context}

    1. Break down the project into a detailed, ordered build plan.
    2. For each step, specify:
        - step number
        - description
        - agent name (e.g., 'backend-api', 'frontend-ui', etc.)
        - files to generate (list of relative paths)
    3. Output ONLY a JSON object:
    {{
      "plan": [
        {{
          "step": 1,
          "description": "...",
          "agent": "...",
          "files": ["..."]
        }},
        ...
      ]
    }}
    """)

def build_file_agent_prompt(step, plan, graph_data, chat_history, user_context):
    """Prompt Gemini to generate code for a specific step."""
    return textwrap.dedent(f"""
    You are Agent '{step['agent']}'. Your task is: {step['description']}
    Here is the overall project plan: {json.dumps(plan, indent=2)}
    Tech stack graph: {json.dumps(graph_data, indent=2)}
    Recent chat history: {json.dumps(chat_history[-10:], indent=2)}
    User context: {user_context}

    Generate the code for the following files: {step['files']}
    Output ONLY a JSON object:
    {{
      "files": [
        {{ "path": "...", "content": "..." }},
        ...
      ]
    }}
    """)

def call_gemini(prompt, model):
    """Call Gemini and parse JSON response."""
    response = model.generate_content(prompt)
    print(response)
    print(response.text)
    if not response.parts:
        return {"error": "No response from Gemini"}
    text = response.text.strip()
    try:
        json_start = text.find('{')
        json_end = text.rfind('}') + 1
        if json_start != -1 and json_end != 0:
            return json.loads(text[json_start:json_end])
        else:
            return {"error": "No JSON found in response"}
    except Exception as e:
        return {"error": f"Failed to parse JSON: {e}"}

def write_files_to_disk(files, base_dir="generated_project"):
    """Write generated files to disk, preserving directory structure."""
    for file in files:
        rel_path = file.get("path")
        content = file.get("content", "")
        if not rel_path:
            continue
        abs_path = os.path.join(base_dir, rel_path)
        os.makedirs(os.path.dirname(abs_path), exist_ok=True)
        with open(abs_path, "w", encoding="utf-8") as f:
            f.write(content)

# NEW: GitHub Integration Functions
async def get_repo_default_branch(owner, repo, access_token):
    headers = {
        'Authorization': f'token {access_token}',
        'Accept': 'application/vnd.github.v3+json'
    }
    url = f"https://api.github.com/repos/{owner}/{repo}"
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    repo_info = response.json()
    return repo_info['default_branch']

async def get_latest_commit_sha(owner, repo, branch, access_token):
    headers = {
        'Authorization': f'token {access_token}',
        'Accept': 'application/vnd.github.v3+json'
    }
    url = f"https://api.github.com/repos/{owner}/{repo}/git/refs/heads/{branch}"
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    ref_info = response.json()
    return ref_info['object']['sha']

async def get_tree_sha_from_commit(owner, repo, commit_sha, access_token):
    headers = {
        'Authorization': f'token {access_token}',
        'Accept': 'application/vnd.github.v3+json'
    }
    url = f"https://api.github.com/repos/{owner}/{repo}/git/commits/{commit_sha}"
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    commit_info = response.json()
    return commit_info['tree']['sha']

async def create_git_blob(owner, repo, content, access_token):
    headers = {
        'Authorization': f'token {access_token}',
        'Accept': 'application/vnd.github.v3+json'
    }
    payload = {
        'content': content,
        'encoding': 'utf-8'
    }
    url = f"https://api.github.com/repos/{owner}/{repo}/git/blobs"
    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()
    blob_info = response.json()
    return blob_info['sha']

async def create_git_tree(owner, repo, base_tree_sha, files, access_token):
    headers = {
        'Authorization': f'token {access_token}',
        'Accept': 'application/vnd.github.v3+json'
    }
    tree_entries = []
    for file_data in files:
        path = file_data['path']
        content = file_data['content']
        blob_sha = await create_git_blob(owner, repo, content, access_token)
        tree_entries.append({
            'path': path,
            'mode': '100644', # File (blob)
            'type': 'blob',
            'sha': blob_sha
        })
    
    payload = {
        'base_tree': base_tree_sha,
        'tree': tree_entries
    }
    url = f"https://api.github.com/repos/{owner}/{repo}/git/trees"
    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()
    tree_info = response.json()
    return tree_info['sha']

async def create_git_commit(owner, repo, tree_sha, parent_commit_sha, message, access_token):
    headers = {
        'Authorization': f'token {access_token}',
        'Accept': 'application/vnd.github.v3+json'
    }
    payload = {
        'message': message,
        'tree': tree_sha,
        'parents': [parent_commit_sha]
    }
    url = f"https://api.github.com/repos/{owner}/{repo}/git/commits"
    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()
    commit_info = response.json()
    return commit_info['sha']

async def update_git_ref(owner, repo, branch, commit_sha, access_token):
    headers = {
        'Authorization': f'token {access_token}',
        'Accept': 'application/vnd.github.v3+json'
    }
    payload = {
        'sha': commit_sha,
        'force': False # Set to True to force update, use with caution
    }
    url = f"https://api.github.com/repos/{owner}/{repo}/git/refs/heads/{branch}"
    response = requests.patch(url, headers=headers, json=payload)
    response.raise_for_status()
    return response.json()

async def push_files_to_github(owner, repo, files, commit_message, access_token):
    try:
        # 1. Get default branch name (e.g., 'main' or 'master')
        branch = await get_repo_default_branch(owner, repo, access_token)

        # 2. Get the SHA of the latest commit on the branch
        latest_commit_sha = await get_latest_commit_sha(owner, repo, branch, access_token)

        # 3. Get the SHA of the tree from the latest commit
        base_tree_sha = await get_tree_sha_from_commit(owner, repo, latest_commit_sha, access_token)

        # 4. Create a new tree with the generated files
        new_tree_sha = await create_git_tree(owner, repo, base_tree_sha, files, access_token)

        # 5. Create a new commit referencing the new tree and the previous commit
        new_commit_sha = await create_git_commit(owner, repo, new_tree_sha, latest_commit_sha, commit_message, access_token)

        # 6. Update the branch reference to the new commit
        await update_git_ref(owner, repo, branch, new_commit_sha, access_token)

        return {"success": True, "message": f"Files pushed to {owner}/{repo}/{branch}"}
    except requests.exceptions.RequestException as e:
        error_message = f"GitHub API error: {e.response.status_code} - {e.response.text}" if e.response else str(e)
        print(f"Error pushing to GitHub: {error_message}")
        return {"success": False, "error": error_message}
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return {"success": False, "error": str(e)}

async def create_github_repository_if_not_exists(owner, repo_name, access_token, description="Generated by Stackwise", private=False):
    headers = {
        'Authorization': f'token {access_token}',
        'Accept': 'application/vnd.github.v3+json'
    }
    payload = {
        'name': repo_name,
        'description': description,
        'private': private,
        'auto_init': True  # Initializes with a README.md
    }
    url = f"https://api.github.com/user/repos"
    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        return {"success": True, "message": "Repository created successfully."}
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 422 and "name already exists" in e.response.text.lower():
            return {"success": True, "message": "Repository already exists, proceeding."}
        else:
            error_message = f"GitHub API error creating repo: {e.response.status_code} - {e.response.text}"
            print(error_message)
            return {"success": False, "error": error_message}
    except Exception as e:
        print(f"An unexpected error occurred during repo creation: {e}")
        return {"success": False, "error": str(e)}

async def multi_agent_generate_backend(data, gemini_model):
    """
    Multi-agent code generation: 
    1. Get a build plan from Gemini.
    2. For each step, call Gemini to generate code for the files in that step.
    3. Aggregate and return all files.
    4. Optionally, write files to disk if 'saveToDisk' is True in data.
    """
    graph_data = data.get('graphData')
    chat_history = data.get('chatHistory', [])
    user_context = data.get('userContext', "")
    save_to_disk = data.get('saveToDisk', False)
    
    # NEW: GitHub related parameters
    push_to_github = data.get('pushToGithub', False)
    github_owner = data.get('githubOwner')
    github_repo_name = data.get('githubRepoName')
    github_commit_message = data.get('githubCommitMessage', 'Generated code from Stackwise')

    # Generate GitHub access token at runtime
    github_access_token = None
    
    # First try to get from data (if passed from frontend)
    github_access_token = data.get('githubAccessToken', None)
    print(f"DEBUG: multi_agent_generate_backend - github_access_token from data: {github_access_token}")
    
    # If no token in data, try to generate one
    if not github_access_token:
        print(f"DEBUG: multi_agent_generate_backend - No token in data, attempting to generate one")
        
        # Import required modules for token generation
        import os
        from flask import session
        
        # Option 1: Try to get from session (if called from Flask context)
        try:
            if hasattr(session, 'get'):
                github_access_token = session.get('github_access_token')
                print(f"DEBUG: multi_agent_generate_backend - Token from session: {github_access_token}")
        except Exception as e:
            print(f"DEBUG: multi_agent_generate_backend - Could not access session: {e}")
        
        # Option 2: Use personal access token from environment
        if not github_access_token:
            github_access_token = os.getenv("GITHUB_PERSONAL_ACCESS_TOKEN")
            if github_access_token:
                print(f"DEBUG: multi_agent_generate_backend - Using personal access token from environment")
        
        # Option 3: Use GitHub App installation token (if configured)
        if not github_access_token:
            github_access_token = os.getenv("GITHUB_APP_INSTALLATION_TOKEN")
            if github_access_token:
                print(f"DEBUG: multi_agent_generate_backend - Using GitHub App installation token")
        
        # If still no token, we can't proceed with GitHub operations
        if not github_access_token:
            print(f"DEBUG: multi_agent_generate_backend - No GitHub access token available")
            if push_to_github:
                return {"error": "GitHub access token required for push operation. Please authenticate with GitHub or provide a token."}, 401

    # print(f"DEBUG: multi_agent_generate_backend received: push_to_github={push_to_github}, owner={github_owner}, repo={github_repo_name}")

    if not graph_data:
        return {"error": "Missing 'graphData' in request body"}, 400
    if not gemini_model:
        return {"error": "Gemini API not configured on server."}, 503

    github_push_result = {}
    print("push_to_github", push_to_github)
    print("github_owner", github_owner)
    print("github_repo_name", github_repo_name)
    print("github_access_token", github_access_token)
    if push_to_github and github_owner and github_repo_name and github_access_token:
        print("WOOF WOOF CREATED A REPO (NOT YET)")
        # print(f"DEBUG: Attempting to create/verify GitHub repository: {github_owner}/{github_repo_name}")
        # Step 1: Create repository if it doesn't exist
        repo_creation_result = await create_github_repository_if_not_exists(
            github_owner, github_repo_name, github_access_token
        )
        # print(f"DEBUG: Repository creation result: {repo_creation_result}")
        if not repo_creation_result["success"]:
            github_push_result = {"success": False, "error": repo_creation_result["error"]}
            # Optionally, you might want to stop here or proceed without GitHub push
            # For now, we'll continue to generate code, but report the GitHub error
        else:
            # Continue with code generation and then push
            print("SIKE WE GOOD")
            pass # This pass is just for readability; actual code continues below

    # 1. Get the plan
    plan_prompt = build_plan_prompt(graph_data, chat_history, user_context)
    plan_result = call_gemini(plan_prompt, gemini_model)
    if "error" in plan_result:
        return {"error": f"Plan generation failed: {plan_result['error']}"}, 500
    plan = plan_result.get("plan", [])
    if not plan:
        return {"error": "No plan steps returned from Gemini."}, 500

    # 2. For each step, generate files
    all_files = []
    for step in plan:
        file_prompt = build_file_agent_prompt(step, plan, graph_data, chat_history, user_context)
        file_result = call_gemini(file_prompt, gemini_model)
        if "files" in file_result:
            all_files.extend(file_result["files"])
        else:
            all_files.append({"path": f"ERROR_in_step_{step.get('step', '?')}.txt", "content": file_result.get("error", "Unknown error")})

    # 3. Optionally write files to disk or push to GitHub
    if save_to_disk:
        write_files_to_disk(all_files)
    
    # Optionally, push to GitHub
    if push_to_github and github_owner and github_repo_name and github_access_token and repo_creation_result["success"]:
        print("PUSHING TO GITHUB")
        push_result = await push_files_to_github(
            github_owner,
            github_repo_name,
            all_files,
            github_commit_message,
            github_access_token
        )
        # print(f"DEBUG: GitHub push result: {push_result}")
        github_push_result = push_result

    # 4. Aggregate and return
    response_data = {
        "plan": plan,
        "files": all_files,
        "savedToDisk": save_to_disk,
    }
    if push_to_github:
        response_data["githubPushResult"] = github_push_result

    return response_data, 200

# Example Flask endpoint (register in app.py):
# @app.route('/api/multi-agent-generate', methods=['POST'])
# def multi_agent_generate():
#     if not request.is_json:
#         return jsonify({"error": "Request must be JSON"}), 400
#     data = request.get_json()
#     result, status = multi_agent_generate_backend(data, gemini_model)
#     return jsonify(result), status 