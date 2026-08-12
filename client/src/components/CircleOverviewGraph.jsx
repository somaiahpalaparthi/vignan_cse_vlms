import React, { useState } from 'react';
import { 
  PieChart, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Package, 
  Database, 
  RefreshCw, 
  Activity, 
  ShieldCheck, 
  Layers, 
  Info,
  Server,
  Monitor
} from 'lucide-react';

export const CircleOverviewGraph = ({
  totalStockCount = 0,
  totalWorkingCount = 0,
  pendingTotalCount = 0,
  completedCount = 0,
  stockCpu = 0,
  stockMonitors = 0,
  stockKeyboards = 0,
  stockMouse = 0,
  stockSmartBoards = 0,
  workingCpu = 0,
  workingMonitors = 0,
  pendingCpu = 0,
  pendingMonitors = 0,
  activeCategory = 'all',
  subBreakdown = [],
  selectedLab = 'All',
  onRefresh,
  loading = false
}) => {
  const [activeSegment, setActiveSegment] = useState(null);

  // The 4 Core Metrics with Infographic Colors matching user's image
  const metrics = [
    {
      id: 'total_inventory',
      title: 'Total Inventory',
      shortTitle: 'Inventory',
      subtitle: 'Stock Entry Based',
      count: totalStockCount,
      color: '#148a73', // Teal Green (Top Left)
      glowColor: 'rgba(20, 138, 115, 0.5)',
      icon: Package,
      desc: 'Total equipment units registered via Staff Stock Entry database'
    },
    {
      id: 'active_workstations',
      title: 'Active Workstations',
      shortTitle: 'Active',
      subtitle: 'Total Working',
      count: totalWorkingCount,
      color: '#e74c3c', // Coral Red (Right)
      glowColor: 'rgba(231, 76, 60, 0.5)',
      icon: Activity,
      desc: 'Operational workstations ready for staff and student use'
    },
    {
      id: 'pending_issues',
      title: 'Pending Issues',
      shortTitle: 'Pending',
      subtitle: 'Issue Entry Based',
      count: pendingTotalCount,
      color: '#f39c12', // Warm Orange (Bottom Right)
      glowColor: 'rgba(243, 156, 18, 0.5)',
      icon: Clock,
      desc: 'Fault tickets logged by staff waiting for maintenance & repair'
    },
    {
      id: 'maintenance_completed',
      title: 'Maintenance Completed',
      shortTitle: 'Completed',
      subtitle: 'Resolved Tickets',
      count: completedCount,
      color: '#34495e', // Slate Blue (Bottom Left)
      glowColor: 'rgba(52, 73, 94, 0.5)',
      icon: CheckCircle,
      desc: 'Equipment items successfully repaired and verified working'
    }
  ];

  const grandTotal = metrics.reduce((acc, m) => acc + m.count, 0) || 1;

  // Infographic Donut Chart Math (Matching User Reference Image)
  const size = 340;
  const cx = size / 2;
  const cy = size / 2;
  const rin = 72;
  const rout = 120;

  let accumulatedAngle = 0;
  const segments = metrics.map((m) => {
    const percentage = grandTotal > 0 ? (m.count / grandTotal) * 100 : 25;
    const sliceAngle = (percentage / 100) * 360;

    const startAngleDeg = accumulatedAngle;
    const endAngleDeg = accumulatedAngle + sliceAngle;
    const midAngleDeg = startAngleDeg + sliceAngle / 2;

    accumulatedAngle += sliceAngle;

    const startRad = ((startAngleDeg - 90) * Math.PI) / 180;
    const endRad = ((endAngleDeg - 90) * Math.PI) / 180;
    const midRad = ((midAngleDeg - 90) * Math.PI) / 180;

    // Outer Arc Points
    const xo1 = cx + rout * Math.cos(startRad);
    const yo1 = cy + rout * Math.sin(startRad);
    const xo2 = cx + rout * Math.cos(endRad);
    const yo2 = cy + rout * Math.sin(endRad);

    // Inner Arc Points
    const xi2 = cx + rin * Math.cos(endRad);
    const yi2 = cy + rin * Math.sin(endRad);
    const xi1 = cx + rin * Math.cos(startRad);
    const yi1 = cy + rin * Math.sin(startRad);

    const largeArcFlag = sliceAngle > 180 ? 1 : 0;

    let pathD = '';
    if (sliceAngle >= 359.9) {
      pathD = `M ${cx - rout} ${cy} a ${rout} ${rout} 0 1,0 ${rout * 2} 0 a ${rout} ${rout} 0 1,0 -${rout * 2} 0 M ${cx - rin} ${cy} a ${rin} ${rin} 0 1,1 ${rin * 2} 0 a ${rin} ${rin} 0 1,1 -${rin * 2} 0`;
    } else {
      pathD = `M ${xo1} ${yo1} A ${rout} ${rout} 0 ${largeArcFlag} 1 ${xo2} ${yo2} L ${xi2} ${yi2} A ${rin} ${rin} 0 ${largeArcFlag} 0 ${xi1} ${yi1} Z`;
    }

    const rmid = (rin + rout) / 2;
    const textX = cx + rmid * Math.cos(midRad);
    const textY = cy + rmid * Math.sin(midRad);

    // Callout Pointer Line Anchor Point
    const anchorX = cx + rout * Math.cos(midRad);
    const anchorY = cy + rout * Math.sin(midRad);
    const tipX = cx + (rout + 18) * Math.cos(midRad);
    const tipY = cy + (rout + 18) * Math.sin(midRad);

    const popDistance = 10;
    const translateX = Math.cos(midRad) * popDistance;
    const translateY = Math.sin(midRad) * popDistance;

    return {
      ...m,
      percentage: Math.round(percentage),
      pathD,
      textX: Math.round(textX * 10) / 10,
      textY: Math.round(textY * 10) / 10,
      anchorX: Math.round(anchorX * 10) / 10,
      anchorY: Math.round(anchorY * 10) / 10,
      tipX: Math.round(tipX * 10) / 10,
      tipY: Math.round(tipY * 10) / 10,
      translateX: Math.round(translateX * 10) / 10,
      translateY: Math.round(translateY * 10) / 10
    };
  });

  const uptimeRate = totalStockCount > 0 
    ? Math.min(100, Math.round((totalWorkingCount / totalStockCount) * 100))
    : 100;

  const currentHovered = activeSegment 
    ? segments.find((m) => m.id === activeSegment) 
    : null;

  return (
    <div style={{ padding: '4px 0', marginBottom: '14px', position: 'relative', background: 'transparent', border: 'none', boxShadow: 'none' }}>
      
      {/* Main Container: 4 Metric Cards Inline at Top, Infographic Donut Below */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
        
        {/* 1. Modern Glassmorphic Metric Cards Inline (Horizontal Row) */}
        <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
          {segments.map((seg) => {
            const IconComp = seg.icon;
            const isSelected = activeSegment === seg.id;
            
            return (
              <div
                key={seg.id}
                onMouseEnter={() => setActiveSegment(seg.id)}
                onMouseLeave={() => setActiveSegment(null)}
                style={{
                  padding: '14px 16px',
                  borderRadius: '14px',
                  background: isSelected 
                    ? `linear-gradient(135deg, ${seg.color}25 0%, ${seg.color}0a 100%)` 
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
                  backdropFilter: 'blur(10px)',
                  border: `1.5px solid ${isSelected ? seg.color : `${seg.color}44`}`,
                  boxShadow: isSelected 
                    ? `0 8px 22px -4px ${seg.glowColor}, inset 0 1px 0 rgba(255, 255, 255, 0.1)` 
                    : `0 4px 12px -2px rgba(0, 0, 0, 0.15)`,
                  transform: isSelected ? 'translateY(-4px) scale(1.02)' : 'translateY(0)',
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Header Row: Title & Colored Icon */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      background: seg.color, 
                      boxShadow: `0 0 8px ${seg.color}`,
                      display: 'inline-block' 
                    }} />
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--card-text-head)', letterSpacing: '-0.01em' }}>
                      {seg.title}
                    </span>
                  </div>
                  <div style={{ 
                    padding: '5px', 
                    borderRadius: '8px', 
                    background: `${seg.color}15`, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    <IconComp size={14} color={seg.color} />
                  </div>
                </div>

                {/* Main Metric Value & Ratio Pill */}
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.45rem', fontWeight: 900, color: isSelected ? seg.color : 'var(--text-primary)', lineHeight: 1 }}>
                    {seg.count}
                  </span>
                  <span style={{ 
                    fontSize: '0.68rem', 
                    fontWeight: 700, 
                    color: seg.color,
                    padding: '2px 7px',
                    borderRadius: '12px',
                    background: `${seg.color}18`,
                    border: `1px solid ${seg.color}35`
                  }}>
                    {seg.percentage}% ratio
                  </span>
                </div>

                {/* Micro Animated Progress Bar */}
                <div style={{ width: '100%', height: '5px', background: 'rgba(125, 125, 125, 0.12)', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div 
                    style={{ 
                      width: `${seg.percentage}%`, 
                      height: '100%', 
                      background: seg.color,
                      borderRadius: '4px',
                      boxShadow: `0 0 8px ${seg.color}`,
                      transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                    }} 
                  />
                </div>

                {/* List Type Display Format (Fans : 25) */}
                {Array.isArray(subBreakdown) && subBreakdown.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', margin: '6px 0', padding: '5px 8px', background: 'rgba(0,0,0,0.18)', borderRadius: '8px', border: `1px solid ${seg.color}25` }}>
                    {subBreakdown.map((item, idx) => {
                      const val = seg.id === 'total_inventory' ? item.stock : seg.id === 'active_workstations' ? item.working : seg.id === 'pending_issues' ? item.pending : seg.id === 'maintenance_completed' ? (idx === 0 ? completedCount : 0) : 0;
                      if (seg.id === 'maintenance_completed' && idx > 0) return null;
                      return (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justify: 'space-between',
                            fontSize: '0.70rem',
                            fontWeight: 600,
                            color: 'var(--text-secondary)',
                            padding: '1px 0',
                            borderBottom: idx < subBreakdown.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none'
                          }}
                        >
                          <span style={{ minWidth: '70px', textAlign: 'left' }}>{seg.id === 'maintenance_completed' ? 'Resolved' : item.label}</span>
                          <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>:</span>
                          <strong style={{ color: seg.color, fontWeight: 800 }}>{val}</strong>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Subtitle */}
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {seg.subtitle}
                </div>
              </div>
            );
          })}
        </div>

        {/* 2. Infographic Donut Chart Container (Matching User Reference Image) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', marginTop: '6px' }}>
          
          <div style={{ position: 'relative', width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
              
              {/* Dynamic Infographic Donut Segments */}
              {segments.map((seg) => {
                const isHovered = activeSegment === seg.id;
                return (
                  <g
                    key={seg.id}
                    onMouseEnter={() => setActiveSegment(seg.id)}
                    onMouseLeave={() => setActiveSegment(null)}
                    style={{
                      cursor: 'pointer',
                      transform: isHovered ? `translate(${seg.translateX}px, ${seg.translateY}px) scale(1.03)` : 'translate(0px, 0px)',
                      transformOrigin: `${cx}px ${cy}px`,
                      transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.3s ease',
                      filter: isHovered ? `drop-shadow(0 0 16px ${seg.color})` : 'drop-shadow(0 2px 5px rgba(0,0,0,0.25))'
                    }}
                  >
                    {/* Donut Arc Segment Path with White Gap Border (Matching Image) */}
                    <path
                      d={seg.pathD}
                      fill={seg.color}
                      stroke="var(--bg-panel-solid, #0d1320)"
                      strokeWidth="3"
                    />

                    {/* Percentage Text Rendered DIRECTLY INSIDE the Arc Segment (Matching Image) */}
                    {seg.percentage > 0 && (
                      <text
                        x={seg.textX}
                        y={seg.textY + 4}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="0.92rem"
                        fontWeight="900"
                        style={{
                          pointerEvents: 'none',
                          textShadow: '0 1px 3px rgba(0, 0, 0, 0.95), 0 0 5px rgba(0,0,0,0.6)',
                          fontFamily: 'Inter, system-ui, sans-serif'
                        }}
                      >
                        {seg.percentage}%
                      </text>
                    )}

                    {/* Callout Pointer Line pointing from Arc to Callout Speech Bubble (Matching Image) */}
                    <line
                      x1={seg.anchorX}
                      y1={seg.anchorY}
                      x2={seg.tipX}
                      y2={seg.tipY}
                      stroke={seg.color}
                      strokeWidth="2.5"
                      strokeDasharray="4 2"
                    />
                    <circle
                      cx={seg.tipX}
                      cy={seg.tipY}
                      r="4"
                      fill={seg.color}
                    />
                  </g>
                );
              })}

              {/* Center Circle Display Area with White Inner Border (Matching Image) */}
              <circle
                cx={cx}
                cy={cy}
                r={rin - 4}
                fill="var(--bg-panel-solid, #0d1320)"
                stroke="rgba(255, 255, 255, 0.25)"
                strokeWidth="3"
              />
            </svg>

            {/* Center Area Telemetry Info */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                textAlign: 'center',
                padding: '24px'
              }}
            >
              {currentHovered ? (
                <>
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, color: currentHovered.color, textTransform: 'uppercase' }}>
                    {currentHovered.title}
                  </span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--card-text-head)', margin: '2px 0' }}>
                    {currentHovered.count}
                  </span>
                  <span style={{ fontSize: '0.66rem', color: 'var(--text-secondary)' }}>
                    Units Registered
                  </span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '0.60rem', fontWeight: 800, color: 'var(--cyan-bright)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    LAB HEALTH INDEX
                  </span>
                  <span style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--green-online)', margin: '2px 0' }}>
                    {uptimeRate}%
                  </span>
                  <span style={{ fontSize: '0.66rem', color: 'var(--text-secondary)' }}>
                    System Uptime
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Detailed Itemized Cut-Off Piece Data Telemetry Pill (Stable Container Height) */}
          <div style={{ minHeight: '38px', marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {currentHovered ? (
              <div style={{
                padding: '6px 16px',
                borderRadius: '20px',
                background: `${currentHovered.color}20`,
                border: `1.5px solid ${currentHovered.color}66`,
                color: 'var(--card-text-head)',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: `0 4px 16px -2px ${currentHovered.glowColor}`,
                animation: 'fadeIn 0.2s ease-in-out'
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: currentHovered.color, boxShadow: `0 0 8px ${currentHovered.color}` }} />
                <span><strong>{currentHovered.title}:</strong> {currentHovered.count} units ({currentHovered.percentage}% share)</span>
              </div>
            ) : (
              <div style={{ visibility: 'hidden', padding: '6px 16px', fontSize: '0.78rem' }}>&nbsp;</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default CircleOverviewGraph;
