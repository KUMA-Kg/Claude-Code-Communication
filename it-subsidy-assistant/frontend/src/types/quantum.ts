export interface MatchingCandidate {
  id: string;
  name: string;
  description: string;
  score: number;
  attributes: Record<string, any>;
}

export interface QuantumState {
  candidateId: string;
  candidate: MatchingCandidate;
  amplitude: number;
  phase: number;
  spin: number;
  position: [number, number, number];
  entangled: boolean;
  collapsed: boolean;
}

export interface QuantumMatchingResult {
  candidateId: string;
  probability: number;
  confidence: number;
  dimensions: number[];
}

export interface EntanglementPair {
  id1: string;
  id2: string;
  strength: number;
}

export interface UniverseState {
  id: number;
  states: QuantumState[];
  probability: number;
  divergence: number;
}