import os
import json
import textwrap
from flask import request, jsonify

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

def multi_agent_generate_backend(data, gemini_model):
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

    if not graph_data:
        return {"error": "Missing 'graphData' in request body"}, 400
    if not gemini_model:
        return {"error": "Gemini API not configured on server."}, 503

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

    # 3. Optionally write files to disk
    if save_to_disk:
        write_files_to_disk(all_files)

    # 4. Aggregate and return
    return {
        "plan": plan,
        "files": all_files,
        "savedToDisk": save_to_disk
    }, 200

# Example Flask endpoint (register in app.py):
# @app.route('/api/multi-agent-generate', methods=['POST'])
# def multi_agent_generate():
#     if not request.is_json:
#         return jsonify({"error": "Request must be JSON"}), 400
#     data = request.get_json()
#     result, status = multi_agent_generate_backend(data, gemini_model)
#     return jsonify(result), status 