import * as d3 from 'd3';
import { Persona, PrivacyWarning } from '@/types';

/**
 * Enhanced privacy analyzer for detecting potential privacy leaks between personas
 */
export class PrivacyAnalyzer {
  /**
   * Analyzes personas for potential privacy leaks
   */
  static analyzePrivacy(personas: Persona[]): PrivacyWarning[] {
    const warnings: PrivacyWarning[] = [];
    
    // Skip analysis if there's only one persona
    if (personas.length <= 1) {
      return warnings;
    }
    
    // Check for account overlaps
    const accountOverlaps = this.detectAccountOverlaps(personas);
    warnings.push(...accountOverlaps);
    
    // Check for username patterns
    const usernameWarnings = this.detectUsernamePatterns(personas);
    warnings.push(...usernameWarnings);
    
    // Check for metadata similarities
    const metadataWarnings = this.detectMetadataSimilarities(personas);
    warnings.push(...metadataWarnings);
    
    return warnings;
  }

  /**
   * Detects if the same accounts are used across different personas
   */
  private static detectAccountOverlaps(personas: Persona[]): PrivacyWarning[] {
    const warnings: PrivacyWarning[] = [];
    const accountMap = new Map<string, string[]>();
    
    // Build a map of accounts to persona IDs
    personas.forEach(persona => {
      persona.privateData.accounts.forEach(account => {
        const personasWithAccount = accountMap.get(account) || [];
        accountMap.set(account, [...personasWithAccount, persona.id]);
      });
    });
    
    // Check for accounts used in multiple personas
    accountMap.forEach((personaIds, account) => {
      if (personaIds.length > 1) {
        warnings.push({
          type: 'account_overlap',
          description: `Account "${account}" is used in multiple personas`,
          severity: 'high',
          affectedPersonas: personaIds
        });
      }
    });
    
    return warnings;
  }

  /**
   * Detects patterns in usernames across personas
   */
  private static detectUsernamePatterns(personas: Persona[]): PrivacyWarning[] {
    const warnings: PrivacyWarning[] = [];
    const usernameMap = new Map<string, string[]>();
    
    // Extract usernames from accounts
    personas.forEach(persona => {
      persona.privateData.accounts.forEach(account => {
        const parts = account.split(':');
        if (parts.length === 2) {
          const username = parts[1].toLowerCase();
          const personasWithUsername = usernameMap.get(username) || [];
          usernameMap.set(username, [...personasWithUsername, persona.id]);
        }
      });
    });
    
    // Check for similar usernames
    const allUsernames = Array.from(usernameMap.keys());
    
    for (let i = 0; i < allUsernames.length; i++) {
      for (let j = i + 1; j < allUsernames.length; j++) {
        const similarity = this.calculateStringSimilarity(allUsernames[i], allUsernames[j]);
        
        if (similarity > 0.7) { // Threshold for similarity
          const affectedPersonas = [
            ...(usernameMap.get(allUsernames[i]) || []),
            ...(usernameMap.get(allUsernames[j]) || [])
          ];
          
          warnings.push({
            type: 'username_reuse',
            description: `Similar usernames detected: "${allUsernames[i]}" and "${allUsernames[j]}"`,
            severity: 'medium',
            affectedPersonas: [...new Set(affectedPersonas)] // Remove duplicates
          });
        }
      }
    }
    
    return warnings;
  }

  /**
   * Detects similarities in metadata across personas
   */
  private static detectMetadataSimilarities(personas: Persona[]): PrivacyWarning[] {
    const warnings: PrivacyWarning[] = [];
    
    // Compare notes and other metadata
    for (let i = 0; i < personas.length; i++) {
      for (let j = i + 1; j < personas.length; j++) {
        const notesA = personas[i].privateData.notes.toLowerCase();
        const notesB = personas[j].privateData.notes.toLowerCase();
        
        if (notesA && notesB) {
          const similarity = this.calculateStringSimilarity(notesA, notesB);
          
          if (similarity > 0.5) { // Threshold for similarity
            warnings.push({
              type: 'metadata_similarity',
              description: `Similar notes detected between personas`,
              severity: 'low',
              affectedPersonas: [personas[i].id, personas[j].id]
            });
          }
        }
      }
    }
    
    return warnings;
  }

  /**
   * Calculates similarity between two strings (using Levenshtein distance)
   */
  private static calculateStringSimilarity(a: string, b: string): number {
    if (a === b) return 1.0;
    if (a.length === 0 || b.length === 0) return 0.0;
    
    // Simple Levenshtein distance implementation
    const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));
    
    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
    
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }
    
    const distance = matrix[a.length][b.length];
    const maxLength = Math.max(a.length, b.length);
    
    return 1 - distance / maxLength;
  }

  /**
   * Calculates an overall privacy score based on warnings
   */
  static calculatePrivacyScore(warnings: PrivacyWarning[]): {
    score: number;
    grade: string;
    accountIsolation: number;
    usernameUniqueness: number;
    metadataSeparation: number;
  } {
    // Count warnings by type and severity
    const highSeverity = warnings.filter(w => w.severity === 'high').length;
    const mediumSeverity = warnings.filter(w => w.severity === 'medium').length;
    const lowSeverity = warnings.filter(w => w.severity === 'low').length;
    
    const accountOverlaps = warnings.filter(w => w.type === 'account_overlap').length;
    const usernameReuse = warnings.filter(w => w.type === 'username_reuse').length;
    const metadataSimilarity = warnings.filter(w => w.type === 'metadata_similarity').length;
    
    // Calculate component scores (0-100)
    const accountIsolation = Math.max(0, 100 - accountOverlaps * 50);
    const usernameUniqueness = Math.max(0, 100 - usernameReuse * 25);
    const metadataSeparation = Math.max(0, 100 - metadataSimilarity * 15);
    
    // Calculate overall score (0-100)
    const score = Math.round(
      (accountIsolation * 0.5) + 
      (usernameUniqueness * 0.3) + 
      (metadataSeparation * 0.2)
    );
    
    // Determine grade
    let grade = 'A+';
    if (score < 60) grade = 'F';
    else if (score < 70) grade = 'D';
    else if (score < 80) grade = 'C';
    else if (score < 90) grade = 'B';
    else if (score < 95) grade = 'A';
    
    return {
      score,
      grade,
      accountIsolation,
      usernameUniqueness,
      metadataSeparation
    };
  }

  /**
   * Generates privacy recommendations based on warnings
   */
  static generateRecommendations(warnings: PrivacyWarning[]): string[] {
    const recommendations: string[] = [];
    
    // Account overlap recommendations
    const accountOverlaps = warnings.filter(w => w.type === 'account_overlap');
    if (accountOverlaps.length > 0) {
      recommendations.push(
        'Avoid using the same accounts across different personas to maintain separation.'
      );
      
      accountOverlaps.forEach(warning => {
        const account = warning.description.match(/"([^"]+)"/)?.[1];
        if (account) {
          recommendations.push(
            `Consider removing account "${account}" from all but one persona.`
          );
        }
      });
    }
    
    // Username pattern recommendations
    const usernameWarnings = warnings.filter(w => w.type === 'username_reuse');
    if (usernameWarnings.length > 0) {
      recommendations.push(
        'Use completely different username patterns across personas to avoid correlation.'
      );
    }
    
    // Metadata recommendations
    const metadataWarnings = warnings.filter(w => w.type === 'metadata_similarity');
    if (metadataWarnings.length > 0) {
      recommendations.push(
        'Avoid using similar language or content in notes across different personas.'
      );
    }
    
    // General recommendations
    if (warnings.length > 0) {
      recommendations.push(
        'Consider using different writing styles for each persona to avoid stylometric analysis.'
      );
      recommendations.push(
        'Be mindful of timing patterns - avoid switching between personas at predictable intervals.'
      );
    } else {
      recommendations.push(
        'Great job! Continue maintaining separation between your personas.'
      );
    }
    
    return recommendations;
  }
}

/**
 * Graph visualization utilities for privacy analysis
 */
export class PrivacyGraph {
  /**
   * Generates a D3 graph visualization data structure
   */
  static generateGraphData(personas: Persona[], warnings: PrivacyWarning[]) {
    const nodes = personas.map(persona => ({
      id: persona.id,
      type: 'persona',
      accounts: persona.privateData.accounts.length,
      label: persona.id.substring(0, 8)
    }));
    
    const links = warnings.flatMap(warning => {
      const pairs: [string, string][] = [];
      const personaIds = warning.affectedPersonas;
      
      for (let i = 0; i < personaIds.length; i++) {
        for (let j = i + 1; j < personaIds.length; j++) {
          pairs.push([personaIds[i], personaIds[j]]);
        }
      }
      
      return pairs.map(([source, target]) => ({
        source,
        target,
        type: warning.type,
        severity: warning.severity
      }));
    });
    
    return { nodes, links };
  }

  /**
   * Renders a D3 force-directed graph in the specified container
   */
  static renderGraph(containerId: string, personas: Persona[], warnings: PrivacyWarning[]) {
    // Clear previous graph
    d3.select(`#${containerId}`).selectAll('*').remove();

    // Skip rendering if no personas or only one persona
    if (personas.length <= 1) {
      return;
    }

    const graphData = this.generateGraphData(personas, warnings);
    
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const width = container.clientWidth;
    const height = container.clientHeight || 400;
    
    const svg = d3.select(`#${containerId}`)
      .append('svg')
      .attr('width', width)
      .attr('height', height);
    
    // Define arrow markers for links
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('xoverflow', 'visible')
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#999')
      .style('stroke', 'none');
    
    // Create a force simulation
    const simulation = d3.forceSimulation(graphData.nodes as any)
      .force('link', d3.forceLink(graphData.links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));
    
    // Create links
    const link = svg.selectAll('.link')
      .data(graphData.links)
      .enter()
      .append('line')
      .attr('class', 'link')
      .style('stroke', (d: any) => {
        switch (d.severity) {
          case 'high': return '#ef4444';
          case 'medium': return '#f59e0b';
          case 'low': return '#3b82f6';
          default: return '#6b7280';
        }
      })
      .style('stroke-width', 2)
      .style('stroke-dasharray', (d: any) => d.type === 'metadata_similarity' ? '5,5' : 'none');
    
    // Create nodes
    const node = svg.selectAll('.node')
      .data(graphData.nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any);
    
    // Add circles to nodes
    node.append('circle')
      .attr('r', 20)
      .style('fill', '#4f46e5')
      .style('stroke', '#818cf8')
      .style('stroke-width', 2);
    
    // Add text labels to nodes
    node.append('text')
      .attr('dy', 30)
      .attr('text-anchor', 'middle')
      .text((d: any) => d.label)
      .style('fill', '#e2e8f0')
      .style('font-size', '12px');
    
    // Add tooltips
    node.append('title')
      .text((d: any) => `Persona: ${d.id}\nAccounts: ${d.accounts}`);
    
    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);
      
      node
        .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });
    
    // Drag functions
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  }
}

// Export the original functions for backward compatibility
export function analyzePrivacy(personas: Persona[]): PrivacyWarning[] {
  return PrivacyAnalyzer.analyzePrivacy(personas);
}

export function generatePrivacyGraph(personas: Persona[], warnings: PrivacyWarning[]) {
  return PrivacyGraph.generateGraphData(personas, warnings);
}

export function renderPrivacyGraph(containerId: string, personas: Persona[], warnings: PrivacyWarning[]) {
  return PrivacyGraph.renderGraph(containerId, personas, warnings);
}

export function calculatePrivacyScore(warnings: PrivacyWarning[]) {
  return PrivacyAnalyzer.calculatePrivacyScore(warnings);
}

export function generateRecommendations(warnings: PrivacyWarning[]): string[] {
  return PrivacyAnalyzer.generateRecommendations(warnings);
}
