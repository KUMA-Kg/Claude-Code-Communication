import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';
import { QuantumMatchingResult } from '../../types/quantum';

interface PerformanceDashboardProps {
  matchingResults: QuantumMatchingResult[];
  accuracy: number;
  processingTime: number;
  dimensionData: number[][];
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  matchingResults,
  accuracy,
  processingTime,
  dimensionData
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const heatmapRef = useRef<SVGSVGElement>(null);
  const [selectedMetric, setSelectedMetric] = useState<'accuracy' | 'speed' | 'confidence'>('accuracy');

  // 精度グラフの描画
  useEffect(() => {
    if (!svgRef.current || matchingResults.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = 400 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // スケール設定
    const xScale = d3.scaleLinear()
      .domain([0, matchingResults.length - 1])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, 1])
      .range([height, 0]);

    // ラインジェネレーター
    const line = d3.line<QuantumMatchingResult>()
      .x((_, i) => xScale(i))
      .y(d => yScale(d.probability))
      .curve(d3.curveMonotoneX);

    // グラデーション定義
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'probability-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#00ffff')
      .attr('stop-opacity', 0.8);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#0066ff')
      .attr('stop-opacity', 0.3);

    // エリアチャート
    const area = d3.area<QuantumMatchingResult>()
      .x((_, i) => xScale(i))
      .y0(height)
      .y1(d => yScale(d.probability))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(matchingResults)
      .attr('fill', 'url(#probability-gradient)')
      .attr('d', area);

    // ライン
    g.append('path')
      .datum(matchingResults)
      .attr('fill', 'none')
      .attr('stroke', '#00ffff')
      .attr('stroke-width', 2)
      .attr('d', line);

    // 軸
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).ticks(5))
      .attr('color', '#666');

    g.append('g')
      .call(d3.axisLeft(yScale).ticks(5))
      .attr('color', '#666');

    // データポイント
    g.selectAll('.dot')
      .data(matchingResults)
      .enter().append('circle')
      .attr('class', 'dot')
      .attr('cx', (_, i) => xScale(i))
      .attr('cy', d => yScale(d.probability))
      .attr('r', 3)
      .attr('fill', '#00ffff')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 6);
        
        // ツールチップ
        const tooltip = g.append('g')
          .attr('id', 'tooltip');
        
        const rect = tooltip.append('rect')
          .attr('x', xScale(matchingResults.indexOf(d)) - 30)
          .attr('y', yScale(d.probability) - 30)
          .attr('width', 60)
          .attr('height', 25)
          .attr('fill', 'black')
          .attr('opacity', 0.8)
          .attr('rx', 3);
        
        tooltip.append('text')
          .attr('x', xScale(matchingResults.indexOf(d)))
          .attr('y', yScale(d.probability) - 15)
          .attr('text-anchor', 'middle')
          .attr('fill', 'white')
          .attr('font-size', '12px')
          .text(`${(d.probability * 100).toFixed(1)}%`);
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 3);
        
        g.select('#tooltip').remove();
      });

  }, [matchingResults]);

  // 多次元データのヒートマップ
  useEffect(() => {
    if (!heatmapRef.current || dimensionData.length === 0) return;

    const svg = d3.select(heatmapRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = 300 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // カラースケール
    const colorScale = d3.scaleSequential(d3.interpolateViridis)
      .domain([0, 1]);

    const cellSize = Math.min(width, height) / dimensionData.length;

    // ヒートマップセル
    dimensionData.forEach((row, i) => {
      row.forEach((value, j) => {
        g.append('rect')
          .attr('x', j * cellSize)
          .attr('y', i * cellSize)
          .attr('width', cellSize)
          .attr('height', cellSize)
          .attr('fill', colorScale(value))
          .attr('stroke', '#000')
          .attr('stroke-width', 0.5)
          .on('mouseover', function() {
            d3.select(this)
              .attr('stroke', '#fff')
              .attr('stroke-width', 2);
          })
          .on('mouseout', function() {
            d3.select(this)
              .attr('stroke', '#000')
              .attr('stroke-width', 0.5);
          });
      });
    });

    // 軸ラベル
    g.append('text')
      .attr('x', width / 2)
      .attr('y', -5)
      .attr('text-anchor', 'middle')
      .attr('fill', '#ccc')
      .attr('font-size', '12px')
      .text('Dimension Projection');

  }, [dimensionData]);

  return (
    <div className="bg-black/80 backdrop-blur-md rounded-lg p-6 text-white">
      <h3 className="text-xl font-bold mb-4 text-cyan-400">Performance Metrics</h3>
      
      {/* メトリクスカード */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className={`p-4 rounded-lg cursor-pointer transition-colors ${
            selectedMetric === 'accuracy' ? 'bg-cyan-600/30' : 'bg-gray-800/50'
          }`}
          onClick={() => setSelectedMetric('accuracy')}
        >
          <div className="text-2xl font-bold text-cyan-400">
            {(accuracy * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-400">Matching Accuracy</div>
        </motion.div>
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          className={`p-4 rounded-lg cursor-pointer transition-colors ${
            selectedMetric === 'speed' ? 'bg-green-600/30' : 'bg-gray-800/50'
          }`}
          onClick={() => setSelectedMetric('speed')}
        >
          <div className="text-2xl font-bold text-green-400">
            {processingTime.toFixed(0)}ms
          </div>
          <div className="text-sm text-gray-400">Processing Time</div>
        </motion.div>
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          className={`p-4 rounded-lg cursor-pointer transition-colors ${
            selectedMetric === 'confidence' ? 'bg-purple-600/30' : 'bg-gray-800/50'
          }`}
          onClick={() => setSelectedMetric('confidence')}
        >
          <div className="text-2xl font-bold text-purple-400">
            {matchingResults.length}D
          </div>
          <div className="text-sm text-gray-400">Dimensions Analyzed</div>
        </motion.div>
      </div>

      {/* グラフエリア */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-900/50 rounded-lg p-4">
          <h4 className="text-sm font-medium mb-2 text-gray-400">Probability Distribution</h4>
          <svg ref={svgRef} width="400" height="200" />
        </div>
        
        <div className="bg-gray-900/50 rounded-lg p-4">
          <h4 className="text-sm font-medium mb-2 text-gray-400">Multi-Dimensional Analysis</h4>
          <svg ref={heatmapRef} width="300" height="300" />
        </div>
      </div>

      {/* リアルタイムインジケーター */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-gray-400">Real-time Analysis Active</span>
        </div>
        <div className="text-xs text-gray-500">
          Last update: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};