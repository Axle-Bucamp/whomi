import { useEffect, useState } from 'react';
import { Persona, PrivacyWarning } from '@/types';
import { PrivacyAnalyzer, PrivacyGraph, calculatePrivacyScore, generateRecommendations } from './analyzer';

/**
 * Custom hook for privacy analysis functionality
 */
export function usePrivacyAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [warnings, setWarnings] = useState<PrivacyWarning[]>([]);
  const [privacyScore, setPrivacyScore] = useState<{
    score: number;
    grade: string;
    accountIsolation: number;
    usernameUniqueness: number;
    metadataSeparation: number;
  } | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  /**
   * Analyze personas for privacy issues
   */
  const analyzePersonas = (personas: Persona[]) => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Perform privacy analysis
      const detectedWarnings = PrivacyAnalyzer.analyzePrivacy(personas);
      setWarnings(detectedWarnings);
      
      // Calculate privacy score
      const score = PrivacyAnalyzer.calculatePrivacyScore(detectedWarnings);
      setPrivacyScore(score);
      
      // Generate recommendations
      const recs = PrivacyAnalyzer.generateRecommendations(detectedWarnings);
      setRecommendations(recs);
      
      return {
        warnings: detectedWarnings,
        score,
        recommendations: recs
      };
    } catch (err) {
      console.error('Error analyzing privacy:', err);
      setError('Failed to analyze privacy');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Render privacy graph visualization
   */
  const renderGraph = (containerId: string, personas: Persona[]) => {
    try {
      PrivacyGraph.renderGraph(containerId, personas, warnings);
    } catch (err) {
      console.error('Error rendering privacy graph:', err);
      setError('Failed to render privacy graph');
    }
  };

  /**
   * Get privacy risk level based on warnings
   */
  const getPrivacyRiskLevel = (): 'low' | 'medium' | 'high' | 'none' => {
    if (warnings.length === 0) return 'none';
    if (warnings.some(w => w.severity === 'high')) return 'high';
    if (warnings.some(w => w.severity === 'medium')) return 'medium';
    return 'low';
  };

  return {
    isAnalyzing,
    warnings,
    privacyScore,
    recommendations,
    error,
    analyzePersonas,
    renderGraph,
    getPrivacyRiskLevel
  };
}
