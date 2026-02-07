"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type StateName = "Georgia" | "Tennessee";

interface StateConfig {
  name: StateName;
  abbreviation: string;
  cities: string[];
  center: { lat: number; lng: number };
  zoom: number;
}

export const STATE_CONFIGS: Record<StateName, StateConfig> = {
  Georgia: {
    name: "Georgia",
    abbreviation: "GA",
    cities: ["Atlanta", "Augusta", "Columbus", "Macon", "Savannah", "Athens"],
    center: { lat: 32.7, lng: -83.2 },
    zoom: 7,
  },
  Tennessee: {
    name: "Tennessee",
    abbreviation: "TN",
    cities: ["Nashville", "Memphis", "Knoxville", "Chattanooga", "Clarksville"],
    center: { lat: 35.86, lng: -86.35 },
    zoom: 7,
  },
};

interface StateContextType {
  selectedState: StateName;
  setSelectedState: (state: StateName) => void;
  stateConfig: StateConfig;
  allStates: StateName[];
}

const StateContext = createContext<StateContextType | undefined>(undefined);

export function StateProvider({ children }: { children: ReactNode }) {
  const [selectedState, setSelectedState] = useState<StateName>("Georgia");

  return (
    <StateContext.Provider
      value={{
        selectedState,
        setSelectedState,
        stateConfig: STATE_CONFIGS[selectedState],
        allStates: Object.keys(STATE_CONFIGS) as StateName[],
      }}
    >
      {children}
    </StateContext.Provider>
  );
}

export function useStateSelection() {
  const context = useContext(StateContext);
  if (!context) throw new Error("useStateSelection must be used within a StateProvider");
  return context;
}
