import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Typography,
  Box,
  Avatar,
  LinearProgress,
  Chip,
  Paper,
} from '@mui/material';
import {
  Group as WorkersIcon,
  Assignment as SOIcon,
  BarChart as ProductivityIcon,
  NotificationsActive as AlertIcon,
  CheckCircle as CompleteIcon,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Label,
} from 'recharts';

const initials = (name: string) =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

export const Dashboard: React.FC = () => {
  const {
    metrics,
    productivityTrend,
    salesOrders,
    activityLogs,
    themeMode,
  } = useApp();


  // Clean computed Sales Orders Progress
  const activeSOList = useMemo(() => {
    return salesOrders
      .filter(so => so.isActive !== false)
      .slice(0, 4)
      .map(so => {
        const total = so.allowedActivities ? so.allowedActivities.length : 0;
        const loggedActs = new Set(
          activityLogs
            .filter((log: any) => {
              const logSoNumber = log.SalesOrder?.soNumber || log.soNumber || log.soId;
              return logSoNumber === so.soNumber;
            })
            .map((log: any) => log.activity?.activityName || log.activity || '')
        );
        const done = so.allowedActivities 
          ? so.allowedActivities.filter(act => loggedActs.has(act)).length
          : 0;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        return { ...so, totalActs: total, doneActs: done, pct };
      });
  }, [salesOrders, activityLogs]);

  // Calculate unique users active today (who have logged at least one activity today)
  const activeUsersToday = useMemo(() => {
    const todayStr = new Date().toDateString();
    const activeUserIds = new Set(
      activityLogs
        .filter((log: any) => {
          if (!log.createdAt) return false;
          return new Date(log.createdAt).toDateString() === todayStr;
        })
        .map((log: any) => log.userId || log.user?.employeeId || log.user?.id)
        .filter(Boolean)
    );
    return activeUserIds.size;
  }, [activityLogs]);

  // 3D Glassmorphic Card styled with volumetric light-source highlights
  const GlassCard: React.FC<{ children: React.ReactNode; sx?: object; glowColor?: string }> = ({
    children,
    sx = {},
    glowColor = '#8B5CF6'
  }) => (
    <Paper
      elevation={0}
      sx={{
        background: themeMode === 'dark'
          ? 'linear-gradient(135deg, rgba(28, 29, 38, 0.8) 0%, rgba(16, 17, 22, 0.9) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 243, 247, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        boxShadow: themeMode === 'dark'
          ? `0 20px 40px -10px rgba(0, 0, 0, 0.55), 
             inset 0 1px 0px rgba(255, 255, 255, 0.12), 
             inset 0 -1.5px 2px rgba(0, 0, 0, 0.4),
             0 2px 4px rgba(0, 0, 0, 0.3)`
          : `0 14px 28px -8px rgba(0, 0, 0, 0.08), 
             inset 0 1px 0px rgba(255, 255, 255, 0.95), 
             inset 0 -1.5px 2px rgba(0, 0, 0, 0.04),
             0 2px 4px rgba(0, 0, 0, 0.01)`,
        borderRadius: '24px',
        border: themeMode === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.04)',
        p: 3,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)',
        '&:hover': {
          transform: 'translateY(-5px) scale(1.002)',
          boxShadow: themeMode === 'dark'
            ? `0 28px 56px -12px rgba(0, 0, 0, 0.75), 
               inset 0 1px 0px rgba(255, 255, 255, 0.18), 
               0 0 25px ${glowColor}1c`
            : `0 20px 40px -8px rgba(0, 0, 0, 0.14), 
               inset 0 1px 0px rgba(255, 255, 255, 1), 
               0 0 25px ${glowColor}12`,
          borderColor: glowColor,
        },
        ...sx,
      }}
    >
      {children}
    </Paper>
  );

  return (
    <Box sx={{ pb: 6, fontFamily: '"Outfit", sans-serif' }}>
      
      {/* ── Keyframe CSS animations ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-dot {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.95; }
        }
      `}} />

      {/* ── Header Command Banner ── */}
      <Box
        sx={{
          width: '100%',
          borderRadius: '28px',
          overflow: 'hidden',
          position: 'relative',
          mb: 4.5,
          boxShadow: themeMode === 'dark' 
            ? '0 25px 50px -15px rgba(0,0,0,0.65), inset 0 1px 0px rgba(255,255,255,0.1)'
            : '0 15px 30px -10px rgba(0,0,0,0.1), inset 0 1px 0px rgba(255,255,255,0.9)',
          border: themeMode === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.03)',
          background: '#0a0b0f',
          minHeight: 180,
          backgroundImage: 'url(/images/transformer_assembly.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {/* Mirror overlay gradient */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(8, 9, 14, 0.92) 0%, rgba(139, 92, 246, 0.25) 100%)',
            zIndex: 1,
          }}
        />

                  <Box sx={{ zIndex: 2, position: 'relative', p: { xs: 4, md: 5 }, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 3 }}>
          <Box>
            <Chip
              label="EXECUTIVE COMMAND COCKPIT"
              size="small"
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.08)',
                color: '#A78BFA',
                fontWeight: 900,
                fontSize: '0.78rem',
                letterSpacing: '0.12em',
                border: '1px solid rgba(139, 92, 246, 0.25)',
                mb: 1.5,
              }}
            />
            <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-0.02em', color: '#ffffff', mb: 0.8 }}>
              Workforce Intelligence Command
            </Typography>
          </Box>

          {/* Live DB Stats */}
          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <Box>
              <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.06em' }}>TOTAL USERS</Typography>
              <Typography sx={{ color: '#ffffff', fontSize: '0.9rem', fontWeight: 900, mt: 0.2, fontFamily: 'ui-monospace, monospace' }}>
                {metrics.totalUsers}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.06em' }}>ACTIVE SOs</Typography>
              <Typography sx={{ color: '#06B6D4', fontSize: '0.9rem', fontWeight: 900, mt: 0.2, fontFamily: 'ui-monospace, monospace' }}>
                {salesOrders.filter(so => so.isActive !== false).length}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.06em' }}>LOGS TODAY</Typography>
              <Typography sx={{ color: '#10B981', fontSize: '0.9rem', fontWeight: 900, mt: 0.2, fontFamily: 'ui-monospace, monospace' }}>
                {metrics.completedActivities}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.06em' }}>STATUS</Typography>
              <Typography sx={{ color: '#10B981', fontSize: '0.9rem', fontWeight: 900, mt: 0.2, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10B981', boxShadow: '0 0 8px #10B981', animation: 'pulse-dot 1.5s infinite' }} />
                ONLINE
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ── Executive 3D Metrics Grid ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3.5, mb: 4.5 }}>
        {[
          {label: 'Active Workforce', value: `${activeUsersToday} / ${metrics.totalUsers}`, color: '#6366F1', icon: <WorkersIcon />},
          { label: 'Sales Orders', value: salesOrders.length, color: '#06B6D4', icon: <SOIcon /> },
          { label: 'Completed Today', value: metrics.completedActivities, color: '#EC4899', icon: <CompleteIcon /> },
          { label: 'Avg Productivity', value: `${metrics.averageProductivity}%`, color: '#10B981', icon: <ProductivityIcon /> },
        ].map((card, idx) => (
          <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }} key={idx}>
            <GlassCard glowColor={card.color}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: `${card.color}15`, border: `1.5px solid ${card.color}35`, color: card.color, width: 48, height: 48 }}>
                  {card.icon}
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: '0.02em', textTransform: 'uppercase', display: 'block', mb: 0.2 }}>
                    {card.label}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.02em' }}>
                    {card.value}
                  </Typography>
                </Box>
              </Box>
            </GlassCard>
          </Box>
        ))}
      </Box>

      {/* ── Two-Column Cockpit Layout ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3.5 }}>
        
        {/* Left Column - Chart & Sales Progress */}
        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 8' }, display: 'flex', flexDirection: 'column', gap: 3.5 }}>
          
          {/* Productivity Chart Card */}
          <GlassCard glowColor="#8B5CF6">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 4, height: 20, borderRadius: 2, bgcolor: '#8B5CF6' }} />
                <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: '-0.01em' }}>
                  Productivity Cockpit Trend
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.82rem', pl: 2 }}>
                Plots the aggregate daily average worker productivity (%) over the last 7 days. Greater values indicate tasks met or exceeded standard time targets.
              </Typography>
            </Box>

            <Box sx={{ width: '100%', height: 290 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={productivityTrend} 
                  margin={{ 
                    top: 15, 
                    right: 25, 
                    left: 20, 
                    bottom: 25 
                  }}
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke={themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'} 
                  />
                  <XAxis 
                    dataKey="time" 
                    stroke={themeMode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.6)'} 
                    style={{ fontSize: '0.72rem', fontWeight: 600 }}
                    dy={5}
                  >
                    <Label 
                      value="Timeline (Date)" 
                      position="insideBottom" 
                      offset={-15} 
                      style={{ 
                        fill: themeMode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.7)', 
                        fontSize: '0.75rem', 
                        fontWeight: 700 
                      }} 
                    />
                  </XAxis>
                  <YAxis 
                    domain={[50, 100]} 
                    stroke={themeMode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.6)'} 
                    style={{ fontSize: '0.72rem', fontWeight: 600 }}
                    tickFormatter={(val) => `${val}%`}
                    dx={-5}
                  >
                    <Label 
                      value="Productivity (%)" 
                      angle={-90} 
                      position="insideLeft" 
                      style={{ 
                        textAnchor: 'middle', 
                        fill: themeMode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.7)', 
                        fontSize: '0.75rem', 
                        fontWeight: 700 
                      }}
                      offset={-5}
                    />
                  </YAxis>
                  <RechartsTooltip 
                    formatter={(value: any, name: any) => {
                      if (name === 'productivity') return [`${value}%`, 'Average Productivity'];
                      if (name === 'activeTasks') return [value, 'Completed Tasks'];
                      return [value, name];
                    }}
                    contentStyle={{ 
                      backgroundColor: themeMode === 'dark' ? '#13141a' : '#ffffff', 
                      border: themeMode === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.12)', 
                      borderRadius: '12px',
                      color: themeMode === 'dark' ? '#ffffff' : '#000000'
                    }} 
                    labelStyle={{ 
                      color: '#8B5CF6', 
                      fontWeight: 800 
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="productivity" 
                    stroke="#8B5CF6" 
                    strokeWidth={3.5} 
                    dot={{ fill: '#8B5CF6', r: 5 }} 
                    activeDot={{ r: 7 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </GlassCard>

          {/* Sales Orders Progress list */}
          <GlassCard glowColor="#06B6D4">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3.5 }}>
              <Box sx={{ width: 4, height: 20, borderRadius: 2, bgcolor: '#06B6D4' }} />
              <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: '-0.01em' }}>
                Active Sales Orders Progress
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {activeSOList.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    No active sales orders found.
                  </Typography>
                </Box>
              ) : (
                activeSOList.map((so) => {
                  const isCompleted = so.status === 'Completed';
                  const isDelayed = so.status === 'Delayed';
                  const statusColor = isCompleted ? '#10B981' : isDelayed ? '#EF4444' : '#06B6D4';

                  return (
                    <Box
                      key={so.soNumber}
                      sx={{
                        p: 2.5,
                        borderRadius: '16px',
                        background: themeMode === 'dark' ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.01)',
                        border: '1.5px solid rgba(255,255,255,0.04)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          background: themeMode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 850 }}>{so.projectName}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                            {so.soNumber} • Customer: {so.customerName}
                          </Typography>
                        </Box>
                        <Chip
                          label={so.status}
                          size="small"
                          sx={{
                            bgcolor: `${statusColor}15`,
                            color: statusColor,
                            border: `1.5px solid ${statusColor}25`,
                            fontWeight: 900,
                            fontSize: '0.75rem',
                          }}
                        />
                      </Box>

                      {/* 3D Progress Bar */}
                      <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.6 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                            {so.doneActs} / {so.totalActs} Tasks Complete
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 900, color: statusColor }}>
                            {so.pct}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={so.pct}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: 'rgba(255,255,255,0.05)',
                            boxShadow: themeMode === 'dark' ? 'inset 0 1px 2px rgba(0,0,0,0.5)' : 'inset 0 1px 2px rgba(0,0,0,0.05)',
                            '& .MuiLinearProgress-bar': {
                              background: `linear-gradient(90deg, ${statusColor}, #8B5CF6)`,
                              borderRadius: 3,
                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                            }
                          }}
                        />
                      </Box>
                    </Box>
                  );
                })
              )}
            </Box>
          </GlassCard>
        </Box>

        {/* Right Column - Live Activity Stream & System status */}
        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
          <GlassCard glowColor="#EC4899" sx={{ minHeight: '100%' }}>
            
            {/* Pulsing Alert Section */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <AlertIcon sx={{ color: '#EC4899', fontSize: 18 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                    Live Operations Feed
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 650, mt: 0.5, display: 'block' }}>
                  {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} • {metrics.completedActivities} completed today
                </Typography>
              </Box>
              <Chip
                label="LIVE NOW"
                size="small"
                sx={{
                  bgcolor: 'rgba(236, 72, 153, 0.15)',
                  color: '#EC4899',
                  fontWeight: 900,
                  fontSize: '0.75rem',
                }}
              />
            </Box>

            {/* Vertical timeline items */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.2 }}>
              {activityLogs.slice(0, 15).map((rawLog: any, idx) => {
                const colors = ['#10B981', '#06B6D4', '#F59E0B', '#8B5CF6', '#EC4899'];
                const itemColor = colors[idx % colors.length];

                // Normalize log structure supporting both local mock and relational backend logs
                const workerName = rawLog.workerName || 
                  `${rawLog.user?.firstName || ''} ${rawLog.user?.lastName || ''}`.trim() || 
                  'Unknown Worker';
                const employeeId = rawLog.user?.employeeId || rawLog.userId || 'EMP-UNKNOWN';
                const soNumber = rawLog.SalesOrder?.soNumber || rawLog.soNumber || rawLog.soId || 'SO-UNKNOWN';
                const departmentName = rawLog.department?.name || rawLog.department || rawLog.departmentId || 'Unknown Dept';
                const activityName = rawLog.activity?.activityName || rawLog.activity || rawLog.activityId || 'Unknown Activity';

                // Calculate relative elapsed time since submission
                let elapsedText = 'just now';
                const createdTime = rawLog.createdAt ? new Date(rawLog.createdAt).getTime() : null;
                if (createdTime && !isNaN(createdTime)) {
                  const diffMs = Date.now() - createdTime;
                  const diffMins = Math.floor(diffMs / (1000 * 60));
                  const diffHrs = Math.floor(diffMins / 60);
                  const diffDays = Math.floor(diffHrs / 24);
                  
                  if (diffDays > 0) {
                    elapsedText = `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
                  } else if (diffHrs > 0) {
                    elapsedText = `${diffHrs} ${diffHrs === 1 ? 'hour' : 'hours'} ago`;
                  } else if (diffMins > 0) {
                    elapsedText = `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
                  } else {
                    elapsedText = 'just now';
                  }
                } else {
                  elapsedText = rawLog.durationMinutes ? `${rawLog.durationMinutes}m ago` : 'just now';
                }

                return (
                  <Box key={idx} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: `${itemColor}15`,
                          color: itemColor,
                          border: `1.5px solid ${itemColor}45`,
                          fontWeight: 900,
                          fontSize: '0.75rem',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                        }}
                      >
                        {initials(workerName)}
                      </Avatar>
                      {idx < 14 && (
                        <Box sx={{ width: 1.5, height: 42, bgcolor: 'rgba(255,255,255,0.05)', my: 0.8 }} />
                      )}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.3 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                          {workerName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          {elapsedText}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                        {employeeId} • {departmentName}
                      </Typography>
                      <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500, fontSize: '0.82rem', lineHeight: 1.4 }}>
                        {activityName} on <span style={{ color: '#A78BFA', fontWeight: 800 }}>{soNumber}</span>.
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </GlassCard>
        </Box>

      </Box>
    </Box>
  );
};
