"use client";

import { useState } from "react";

interface StoryNode {
  text: string;
  choices?: Array<{ id: string; text: string; next_node: string }>;
}

interface StoryConfig {
  start_node: string;
  branches: Record<string, StoryNode>;
}

interface BranchingStoryEditorProps {
  config: Record<string, unknown>;
  onUpdate: (updates: Record<string, unknown>) => void;
}

export function BranchingStoryEditor({ config, onUpdate }: BranchingStoryEditorProps) {
  const storyConfig: StoryConfig = {
    start_node: (config.start_node as string) || "node_1",
    branches: (config.branches as Record<string, StoryNode>) || {},
  };

  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [nodeIds, setNodeIds] = useState<string[]>(Object.keys(storyConfig.branches) || ["node_1"]);

  const ensureNodeExists = (nodeId: string) => {
    if (!storyConfig.branches[nodeId]) {
      storyConfig.branches[nodeId] = { text: "", choices: [] };
      if (!nodeIds.includes(nodeId)) {
        setNodeIds([...nodeIds, nodeId]);
      }
    }
  };

  const addNode = () => {
    const newId = `node_${Date.now()}`;
    ensureNodeExists(newId);
    updateConfig();
    setEditingNodeId(newId);
  };

  const deleteNode = (nodeId: string) => {
    if (nodeId === storyConfig.start_node) {
      alert("Cannot delete start node");
      return;
    }
    delete storyConfig.branches[nodeId];
    setNodeIds(nodeIds.filter((id) => id !== nodeId));
    updateConfig();
  };

  const updateNodeText = (nodeId: string, text: string) => {
    ensureNodeExists(nodeId);
    storyConfig.branches[nodeId].text = text;
    updateConfig();
  };

  const addChoice = (nodeId: string) => {
    ensureNodeExists(nodeId);
    const choices = storyConfig.branches[nodeId].choices || [];
    choices.push({ id: `choice_${Date.now()}`, text: "", next_node: "" });
    storyConfig.branches[nodeId].choices = choices;
    updateConfig();
  };

  const updateChoice = (
    nodeId: string,
    choiceIdx: number,
    field: "text" | "next_node",
    value: string
  ) => {
    ensureNodeExists(nodeId);
    if (storyConfig.branches[nodeId].choices?.[choiceIdx]) {
      (storyConfig.branches[nodeId].choices![choiceIdx] as any)[field] = value;
      updateConfig();
    }
  };

  const deleteChoice = (nodeId: string, choiceIdx: number) => {
    if (storyConfig.branches[nodeId].choices) {
      storyConfig.branches[nodeId].choices!.splice(choiceIdx, 1);
      updateConfig();
    }
  };

  const updateConfig = () => {
    onUpdate({
      start_node: storyConfig.start_node,
      branches: storyConfig.branches,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="start-node" className="block text-sm font-medium text-slate-300 mb-1">
          Start Node
        </label>
        <select
          id="start-node"
          value={storyConfig.start_node}
          onChange={(e) => {
            storyConfig.start_node = e.target.value;
            updateConfig();
          }}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
        >
          {nodeIds.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </div>

      <div className="border-t border-slate-600 pt-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-medium text-slate-200">Story Nodes</h4>
          <button
            onClick={addNode}
            className="text-sm bg-amber-500 hover:bg-amber-400 text-slate-900 px-3 py-1 rounded"
          >
            + Add Node
          </button>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {nodeIds.map((nodeId) => {
            const node = storyConfig.branches[nodeId];
            const isEditing = editingNodeId === nodeId;

            return (
              <div
                key={nodeId}
                className="bg-slate-700/50 border border-slate-600 rounded-lg p-3"
              >
                <div className="flex justify-between items-center mb-2">
                  <h5 className="font-semibold text-slate-200">{nodeId}</h5>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingNodeId(isEditing ? null : nodeId)}
                      className="text-xs bg-slate-600 hover:bg-slate-500 text-slate-300 px-2 py-1 rounded"
                    >
                      {isEditing ? "Done" : "Edit"}
                    </button>
                    {nodeId !== storyConfig.start_node && (
                      <button
                        onClick={() => deleteNode(nodeId)}
                        className="text-xs bg-red-900/30 hover:bg-red-900/50 text-red-400 px-2 py-1 rounded"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      value={node?.text || ""}
                      onChange={(e) => updateNodeText(nodeId, e.target.value)}
                      placeholder="Node text..."
                      rows={2}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-white text-xs resize-none"
                    />

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400">Choices:</span>
                        <button
                          onClick={() => addChoice(nodeId)}
                          className="text-xs text-amber-400 hover:text-amber-300"
                        >
                          + Add
                        </button>
                      </div>

                      {(node?.choices || []).map((choice, idx) => (
                        <div key={choice.id} className="flex gap-1">
                          <input
                            type="text"
                            value={choice.text}
                            onChange={(e) => updateChoice(nodeId, idx, "text", e.target.value)}
                            placeholder="Choice text"
                            className="flex-1 bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white text-xs"
                          />
                          <select
                            value={choice.next_node}
                            onChange={(e) => updateChoice(nodeId, idx, "next_node", e.target.value)}
                            className="flex-1 bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white text-xs"
                          >
                            <option value="">-- select --</option>
                            {nodeIds.map((n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => deleteChoice(nodeId, idx)}
                            className="text-red-400 hover:text-red-300 text-xs px-1"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 line-clamp-2">{node?.text || "(empty)"}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-4">
        💡 <strong>Tip:</strong> Create a node with no choices to end the story. Players complete
        when they reach an end node.
      </p>
    </div>
  );
}
