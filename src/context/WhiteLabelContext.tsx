"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
// Simplified WhiteLabelContext - stub for now
type BrandingSettings = {
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
};

type ThemeSettings = {
  primaryColor?: string;
  secondaryColor?: string;
};

interface WhiteLabelContextType {
  branding: BrandingSettings;
  theme: ThemeSettings;
  customCSS: string;
  loading: boolean;
  refresh: () => Promise<void>;
}

const WhiteLabelContext = createContext<WhiteLabelContextType | undefined>(undefined);

export function WhiteLabelProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<BrandingSettings>({});
  const [theme, setTheme] = useState<ThemeSettings>({});
  const [customCSS, setCustomCSS] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // Stub - return default values
      setBranding({});
      setTheme({});
      setCustomCSS("");
    } catch (error) {
      console.error("Error loading white label settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Apply custom CSS
  useEffect(() => {
    if (customCSS) {
      const styleId = "white-label-custom-css";
      let styleElement = document.getElementById(styleId);
      
      if (!styleElement) {
        styleElement = document.createElement("style");
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }
      
      styleElement.textContent = customCSS;
    }
  }, [customCSS]);

  // Apply CSS variables for branding colors
  useEffect(() => {
    if (branding.primaryColor || branding.secondaryColor) {
      const root = document.documentElement;
      if (branding.primaryColor) {
        root.style.setProperty("--brand-primary", branding.primaryColor);
      }
      if (branding.secondaryColor) {
        root.style.setProperty("--brand-secondary", branding.secondaryColor);
      }
    }
  }, [branding]);

  return (
    <WhiteLabelContext.Provider
      value={{
        branding,
        theme,
        customCSS,
        loading,
        refresh: loadSettings,
      }}
    >
      {children}
    </WhiteLabelContext.Provider>
  );
}

export function useWhiteLabel() {
  const context = useContext(WhiteLabelContext);
  if (context === undefined) {
    throw new Error("useWhiteLabel must be used within a WhiteLabelProvider");
  }
  return context;
}




