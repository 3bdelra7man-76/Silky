'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { DayRecord } from '@/lib/types'
import { formatDate, getCommonActivities } from '@/lib/store'
import { cn } from '@/lib/utils'
import { playSound, isSoundEnabled } from '@/lib/sounds'

interface TimelineProps {
  days: DayRecord[]
  selectedDate: string | null
  onSelectDate: (date: string) => void
}

interface Node {
  record: DayRecord
  x: number
  y: number
}

interface Connection {
  from: Node
  to: Node
  commonActivities: string[]
}

export function Timeline({ days, selectedDate, onSelectDate }: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [nodes, setNodes] = useState<Node[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  const calculateLayout = useCallback(() => {
    if (!containerRef.current || days.length === 0) return

    const { width, height } = containerRef.current.getBoundingClientRect()
    setDimensions({ width, height })

    const padding = 80
    const nodeRadius = 24
    const usableWidth = width - padding * 2
    const usableHeight = height - padding * 2

    // Create a flowing, organic layout
    const newNodes: Node[] = days.map((record, index) => {
      const progress = index / Math.max(days.length - 1, 1)
      
      // Create a flowing S-curve path
      const baseX = padding + progress * usableWidth
      const waveAmplitude = usableHeight * 0.25
      const waveFrequency = 2
      const wave = Math.sin(progress * Math.PI * waveFrequency) * waveAmplitude
      
      // Add some organic variation
      const variation = Math.sin(index * 1.7) * 30
      
      const x = baseX
      const y = height / 2 + wave + variation

      return {
        record,
        x: Math.max(nodeRadius + 10, Math.min(width - nodeRadius - 10, x)),
        y: Math.max(nodeRadius + 10, Math.min(height - nodeRadius - 10, y)),
      }
    })

    setNodes(newNodes)

    // Calculate connections for days with similar activities
    const newConnections: Connection[] = []
    for (let i = 0; i < newNodes.length; i++) {
      for (let j = i + 1; j < newNodes.length; j++) {
        const commonActivities = getCommonActivities(newNodes[i].record, newNodes[j].record)
        if (commonActivities.length > 0) {
          newConnections.push({
            from: newNodes[i],
            to: newNodes[j],
            commonActivities,
          })
        }
      }
    }
    setConnections(newConnections)
  }, [days])

  useEffect(() => {
    calculateLayout()
    
    const resizeObserver = new ResizeObserver(() => {
      calculateLayout()
    })

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => resizeObserver.disconnect()
  }, [calculateLayout])

  // Heatmap color based on productivity score
  const getHeatmapClass = (score: number) => {
    if (score >= 80) return 'heatmap-4'
    if (score >= 60) return 'heatmap-3'
    if (score >= 40) return 'heatmap-2'
    if (score >= 20) return 'heatmap-1'
    return 'heatmap-0'
  }

  const getNodeSize = (score: number) => {
    // Scale from 16 to 28 based on score
    return 16 + (score / 100) * 12
  }

  const handleNodeClick = (date: string) => {
    if (isSoundEnabled()) playSound('pop')
    onSelectDate(date)
  }

  if (days.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground animate-float">
          <p className="text-lg font-medium">No history yet</p>
          <p className="text-sm mt-1">Complete tasks and log activities to see your timeline</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      <svg width={dimensions.width} height={dimensions.height} className="absolute inset-0">
        <defs>
          {/* Main connection gradient */}
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--node-line)" />
            <stop offset="100%" stopColor="var(--primary)" />
          </linearGradient>
          
          {/* Activity connection gradient (for similar activities) */}
          <linearGradient id="activityGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
            <stop offset="50%" stopColor="var(--primary)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.3" />
          </linearGradient>
          
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Activity connections (curved lines between days with similar activities) */}
        <g className="activity-connections">
          {connections.map((conn, index) => {
            // Create an arc between the two nodes
            const dx = conn.to.x - conn.from.x
            const dy = conn.to.y - conn.from.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            
            // Skip very long connections (they clutter the view)
            if (dist > dimensions.width * 0.5) return null
            
            // Arc height based on distance
            const arcHeight = Math.min(dist * 0.3, 50)
            const midX = (conn.from.x + conn.to.x) / 2
            const midY = (conn.from.y + conn.to.y) / 2 - arcHeight
            
            return (
              <path
                key={`activity-${index}`}
                d={`M ${conn.from.x} ${conn.from.y} Q ${midX} ${midY}, ${conn.to.x} ${conn.to.y}`}
                fill="none"
                stroke="url(#activityGradient)"
                strokeWidth={1 + conn.commonActivities.length * 0.5}
                strokeDasharray="4 4"
                className="connection-line"
                style={{ animationDelay: `${index * 0.1}s` }}
              />
            )
          })}
        </g>

        {/* Main timeline connection lines */}
        <g>
          {nodes.map((node, index) => {
            if (index === 0) return null
            const prevNode = nodes[index - 1]
            
            // Create curved path between nodes
            const midX = (node.x + prevNode.x) / 2
            const controlY1 = prevNode.y
            const controlY2 = node.y
            
            return (
              <path
                key={`line-${index}`}
                d={`M ${prevNode.x} ${prevNode.y} C ${midX} ${controlY1}, ${midX} ${controlY2}, ${node.x} ${node.y}`}
                fill="none"
                stroke="url(#lineGradient)"
                strokeWidth={2}
                strokeOpacity={0.6}
                className="connection-line"
                style={{ animationDelay: `${index * 0.05}s` }}
              />
            )
          })}
        </g>

        {/* Nodes with heatmap colors */}
        {nodes.map((node) => {
          const isSelected = node.record.date === selectedDate
          const isHovered = node.record.date === hoveredNode
          const nodeSize = getNodeSize(node.record.productivityScore)
          
          return (
            <g
              key={node.record.date}
              className="cursor-pointer"
              onClick={() => handleNodeClick(node.record.date)}
              onMouseEnter={() => setHoveredNode(node.record.date)}
              onMouseLeave={() => setHoveredNode(null)}
              style={{ transition: 'transform 0.2s ease' }}
            >
              {/* Outer glow for selected/hovered */}
              {(isSelected || isHovered) && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={nodeSize + (isSelected ? 10 : 6)}
                  className={cn(
                    'fill-primary/20',
                    isSelected && 'animate-pulse'
                  )}
                />
              )}
              
              {/* Heatmap node circle */}
              <circle
                cx={node.x}
                cy={node.y}
                r={nodeSize}
                className={cn(
                  'silky-transition stroke-2',
                  getHeatmapClass(node.record.productivityScore),
                  isSelected ? 'stroke-primary stroke-[3]' : 'stroke-glass-border'
                )}
                filter={(isSelected || isHovered) ? 'url(#glow)' : undefined}
                style={{
                  transform: isHovered ? `scale(1.1)` : 'scale(1)',
                  transformOrigin: `${node.x}px ${node.y}px`,
                }}
              />
              
              {/* Score text */}
              <text
                x={node.x}
                y={node.y}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-white text-xs font-bold pointer-events-none select-none"
                style={{ 
                  fontSize: nodeSize > 20 ? 12 : 10,
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                }}
              >
                {node.record.productivityScore}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Tooltip for hovered node */}
      {hoveredNode && !selectedDate && (
        <HoveredNodeTooltip nodes={nodes} hoveredDate={hoveredNode} />
      )}

      {/* Tooltip for selected node */}
      {selectedDate && (
        <SelectedNodeTooltip nodes={nodes} selectedDate={selectedDate} />
      )}

      {/* Legend */}
      <div className="absolute bottom-2 left-2 flex items-center gap-2 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1.5">
        <span>Low</span>
        <div className="flex gap-0.5">
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={cn('w-3 h-3 rounded-sm', `heatmap-${level}`)}
            />
          ))}
        </div>
        <span>High</span>
      </div>
    </div>
  )
}

function HoveredNodeTooltip({ nodes, hoveredDate }: { nodes: Node[]; hoveredDate: string }) {
  const node = nodes.find(n => n.record.date === hoveredDate)
  if (!node) return null

  const { record, x, y } = node

  return (
    <div
      className="absolute glass rounded-lg p-2 pointer-events-none z-10 text-xs animate-in fade-in zoom-in-95 duration-150"
      style={{
        left: Math.min(x + 20, window.innerWidth - 150),
        top: y - 30,
      }}
    >
      <p className="font-medium">{formatDate(record.date)}</p>
    </div>
  )
}

function SelectedNodeTooltip({ nodes, selectedDate }: { nodes: Node[]; selectedDate: string }) {
  const selectedNode = nodes.find(n => n.record.date === selectedDate)
  if (!selectedNode) return null

  const { record, x, y } = selectedNode
  const completedTasks = record.tasks.filter(t => t.completed).length
  const totalTasks = record.tasks.length

  return (
    <div
      className="absolute glass rounded-lg p-3 pointer-events-none silky-transition z-10 min-w-[180px] animate-in fade-in slide-in-from-left-2"
      style={{
        left: Math.min(x + 35, window.innerWidth - 200),
        top: y - 50,
      }}
    >
      <p className="font-semibold text-sm">{formatDate(record.date)}</p>
      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
        <span>{completedTasks}/{totalTasks} tasks</span>
        <span>{record.activities.length} activities</span>
      </div>
      <div className="mt-2 flex gap-1">
        {record.activities.slice(0, 4).map((activity, i) => (
          <span 
            key={i} 
            className="px-1.5 py-0.5 bg-primary/20 text-primary text-xs rounded capitalize"
          >
            {activity.type}
          </span>
        ))}
        {record.activities.length > 4 && (
          <span className="text-xs text-muted-foreground">+{record.activities.length - 4}</span>
        )}
      </div>
    </div>
  )
}
