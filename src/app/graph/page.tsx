'use client';

import {
  useEffect,
  useState,
} from 'react';

import * as d3 from 'd3';
import Link from 'next/link';
import {
  FaCheck,
  FaExclamationTriangle,
  FaLink,
  FaNetworkWired,
  FaTimes,
} from 'react-icons/fa';

import {
  analyzePrivacy,
  generatePrivacyGraph,
} from '@/lib/privacy/analyzer';
import {
  decryptStorage,
  loadEncryptedStorage,
} from '@/lib/storage/localStore';
import {
  Persona,
  PrivacyWarning,
} from '@/types';

export default function GraphPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [warnings, setWarnings] = useState<PrivacyWarning[]>([]);
  const [error, setError] = useState('');
  const [privateKey, setPrivateKey] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (personas.length > 0) {
      renderGraph();
    }
  }, [personas, warnings]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const encryptedData = loadEncryptedStorage();
      if (encryptedData) {
        // In a real app, we would prompt for the master key
        // For demo purposes, we'll use a simulated key retrieval
        const simulatedPrivateKey = localStorage.getItem('whoim_demo_private_key') || '';
        setPrivateKey(simulatedPrivateKey);
        
        if (simulatedPrivateKey) {
          const storage = await decryptStorage(encryptedData, simulatedPrivateKey);
          setPersonas(storage.personas);
          
          // Analyze privacy
          const privacyWarnings = analyzePrivacy(storage.personas);
          setWarnings(privacyWarnings);
        }
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data. Please check your private key.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderGraph = () => {
    // Clear previous graph
    d3.select('#privacy-graph').selectAll('*').remove();

    // Skip rendering if no personas or only one persona
    if (personas.length <= 1) {
      return;
    }

    const graphData = generatePrivacyGraph(personas, warnings);
    
    const width = document.getElementById('privacy-graph')?.clientWidth || 600;
    const height = 400;
    
    const svg = d3.select('#privacy-graph')
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
    const simulation = d3.forceSimulation(graphData.nodes)
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
        .on('end', dragended));
    
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
      .text((d: any) => d.id.substring(0, 6))
      .style('fill', '#e2e8f0')
      .style('font-size', '12px');
    
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
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-xl">Analyzing privacy...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold">
              <span className="text-indigo-400">WHOIM</span> V2
            </Link>
            <nav className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-white hover:text-indigo-300 transition-colors">
                Dashboard
              </Link>
              <Link href="/personas" className="text-white hover:text-indigo-300 transition-colors">
                Personas
              </Link>
              <Link href="/graph" className="text-white hover:text-indigo-300 transition-colors font-semibold">
                Privacy Graph
              </Link>
              <Link href="/settings" className="text-white hover:text-indigo-300 transition-colors">
                Settings
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Privacy Analysis</h1>

        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-700 text-red-200 p-4 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg mb-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FaNetworkWired className="mr-2 text-indigo-400" /> Privacy Graph
              </h2>
              
              {personas.length <= 1 ? (
                <div className="bg-gray-700 p-6 rounded-lg text-center">
                  <p className="text-gray-400 mb-4">
                    Privacy analysis requires at least two personas to compare.
                  </p>
                  <Link 
                    href="/personas" 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition-colors"
                  >
                    Create More Personas
                  </Link>
                </div>
              ) : (
                <div className="bg-gray-700 rounded-lg p-4 h-96">
                  <div id="privacy-graph" className="w-full h-full"></div>
                </div>
              )}
              
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="flex items-center">
                  <div className="w-4 h-1 bg-red-500 mr-2"></div>
                  <span className="text-sm text-gray-300">High Risk</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-1 bg-yellow-500 mr-2"></div>
                  <span className="text-sm text-gray-300">Medium Risk</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-1 bg-blue-500 mr-2"></div>
                  <span className="text-sm text-gray-300">Low Risk</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-1 bg-gray-500 mr-2 dashed"></div>
                  <span className="text-sm text-gray-300">Metadata Link</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Privacy Recommendations</h2>
              
              {warnings.length === 0 ? (
                <div className="bg-green-900/30 border border-green-700 text-green-200 p-4 rounded-lg flex items-start">
                  <FaCheck className="text-green-400 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-semibold mb-1">No Privacy Issues Detected</p>
                    <p className="text-sm">Your personas are well-isolated from each other. Keep up the good privacy practices!</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {warnings.map((warning, index) => (
                    <div 
                      key={index} 
                      className={`border rounded-lg p-4 flex items-start ${
                        warning.severity === 'high' 
                          ? 'bg-red-900/30 border-red-700 text-red-200' 
                          : warning.severity === 'medium'
                            ? 'bg-yellow-900/30 border-yellow-700 text-yellow-200'
                            : 'bg-blue-900/30 border-blue-700 text-blue-200'
                      }`}
                    >
                      <FaExclamationTriangle className={`mt-1 mr-3 flex-shrink-0 ${
                        warning.severity === 'high' 
                          ? 'text-red-400' 
                          : warning.severity === 'medium'
                            ? 'text-yellow-400'
                            : 'text-blue-400'
                      }`} />
                      <div>
                        <p className="font-semibold mb-1">
                          {warning.type === 'account_overlap' 
                            ? 'Account Overlap Detected' 
                            : warning.type === 'username_reuse'
                              ? 'Similar Usernames Detected'
                              : 'Metadata Similarity Detected'}
                        </p>
                        <p className="text-sm mb-2">{warning.description}</p>
                        <div className="text-xs">
                          <span className="font-semibold">Affected Personas: </span>
                          {warning.affectedPersonas.map(id => id.substring(0, 8)).join(', ')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg mb-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FaLink className="mr-2 text-indigo-400" /> Persona Links
              </h2>
              
              {personas.length === 0 ? (
                <p className="text-gray-400">No personas available.</p>
              ) : (
                <div className="space-y-3">
                  {personas.map(persona => (
                    <div key={persona.id} className="bg-gray-700 p-3 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold">{persona.id.substring(0, 8)}</h3>
                        <span className="bg-indigo-600 text-xs px-2 py-1 rounded-full">
                          {persona.privateData.accounts.length} accounts
                        </span>
                      </div>
                      
                      {persona.privateData.accounts.length > 0 ? (
                        <ul className="space-y-1 text-sm">
                          {persona.privateData.accounts.map((account, idx) => (
                            <li key={idx} className="bg-gray-600 px-2 py-1 rounded text-gray-300">
                              {account}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-400">No connected accounts</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Privacy Score</h2>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">Overall Rating</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    warnings.length === 0 
                      ? 'bg-green-600' 
                      : warnings.some(w => w.severity === 'high')
                        ? 'bg-red-600'
                        : warnings.some(w => w.severity === 'medium')
                          ? 'bg-yellow-600'
                          : 'bg-blue-600'
                  }`}>
                    {warnings.length === 0 
                      ? 'A+' 
                      : warnings.some(w => w.severity === 'high')
                        ? 'C'
                        : warnings.some(w => w.severity === 'medium')
                          ? 'B'
                          : 'A'}
                  </span>
                </div>
                
                <div className="space-y-2 mt-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Account Isolation</span>
                      <span>
                        {warnings.filter(w => w.type === 'account_overlap').length === 0 
                          ? <FaCheck className="text-green-400" /> 
                          : <FaTimes className="text-red-400" />}
                      </span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          warnings.filter(w => w.type === 'account_overlap').length === 0 
                            ? 'bg-green-500' 
                            : 'bg-red-500'
                        }`}
                        style={{ width: warnings.filter(w => w.type === 'account_overlap').length === 0 ? '100%' : '30%' }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Username Uniqueness</span>
                      <span>
                        {warnings.filter(w => w.type === 'username_reuse').length === 0 
                          ? <FaCheck className="text-green-400" /> 
                          : <FaExclamationTriangle className="text-yellow-400" />}
                      </span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          warnings.filter(w => w.type === 'username_reuse').length === 0 
                            ? 'bg-green-500' 
                            : 'bg-yellow-500'
                        }`}
                        style={{ width: warnings.filter(w => w.type === 'username_reuse').length === 0 ? '100%' : '60%' }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Metadata Separation</span>
                      <span>
                        {warnings.filter(w => w.type === 'metadata_similarity').length === 0 
                          ? <FaCheck className="text-green-400" /> 
                          : <FaExclamationTriangle className="text-blue-400" />}
                      </span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          warnings.filter(w => w.type === 'metadata_similarity').length === 0 
                            ? 'bg-green-500' 
                            : 'bg-blue-500'
                        }`}
                        style={{ width: warnings.filter(w => w.type === 'metadata_similarity').length === 0 ? '100%' : '80%' }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
