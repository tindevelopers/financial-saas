"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

// Simplified WorkspaceProvider - stub for now
type Workspace = {
  id: string;
  name: string;
  tenantId: string;
};

interface WorkspaceContextType {
  workspace: Workspace | null;
  workspaceId: string | null;
  isLoading: boolean;
  error: string | null;
  setWorkspace: (workspace: Workspace | null) => void;
  refreshWorkspace: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWorkspace = async () => {
    // Stub - workspaces not implemented yet
    setWorkspace(null);
    setIsLoading(false);
  };

  useEffect(() => {
    loadWorkspace();
  }, []);

  const refreshWorkspace = async () => {
    await loadWorkspace();
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspace,
        workspaceId: workspace?.id || null,
        isLoading,
        error,
        setWorkspace,
        refreshWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
