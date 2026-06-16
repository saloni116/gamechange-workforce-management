import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { ActivityLog } from '../context/AppContext';
import {
  Box,
  Card,
  Typography,
  Grid,
  TextField,
  MenuItem,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  LinearProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Checkbox,
  ListItemText,
  FormControlLabel,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  CalendarToday as DateIcon,
  Visibility as ViewIcon,
  AttachFile as AttachmentIcon,
  Group as CoworkersIcon,
  HourglassEmpty as PendingIcon,
  PlayCircle as RunningIcon,
  CheckCircle as CompleteIcon,
  Error as RejectedIcon,
  Close as CloseIcon,
  QueryBuilder as DurationIcon,
  BarChart as ProductivityIcon,
  RateReview as ReviewIcon,
} from '@mui/icons-material';

export const WorkMonitoring: React.FC = () => {
  const { themeMode, activityLogs, users, salesOrders, addNewActivityLog, updateActivityLog, departments } = useApp();

  // Transform/normalize logs to support both local mock logs and live backend logs
  const normalizedLogs = activityLogs.map((log: any) => {
    // If it's already a normalized local mock log, return as-is
    if (log.workerName) {
      return log;
    }

    // Extract names and properties safely from backend relational objects
    const firstName = log.user?.firstName || '';
    const lastName = log.user?.lastName || '';
    const workerName = `${firstName} ${lastName}`.trim() || 'Unknown Worker';
    const employeeId = log.user?.employeeId || log.userId || 'EMP-UNKNOWN';

    const soNumber = log.SalesOrder?.soNumber || log.soId || 'SO-UNKNOWN';
    const departmentName = log.department?.name || log.departmentId || 'Unknown Dept';
    const activityName = log.activity?.activityName || log.activityId || 'Unknown Activity';

    // Extract time from slots
    const firstSlot = log.slots?.[0];
    let startTime = '';
    let endTime = '';
    if (firstSlot?.startTime) {
      const sDate = new Date(firstSlot.startTime);
      startTime = !isNaN(sDate.getTime()) ? sDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
    }
    if (firstSlot?.endTime) {
      const eDate = new Date(firstSlot.endTime);
      endTime = !isNaN(eDate.getTime()) ? eDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
    }

    const standardManMinutes = log.activity?.standardManMinutes || log.standardManMinutes || 0;
    const durationMinutes = firstSlot?.durationMinutes || log.durationMinutes || 0;

    // Extract coworkers
    const coworkers = (firstSlot?.coworkers || []).map((c: any) => {
      const cFirst = c.coworker?.firstName || '';
      const cLast = c.coworker?.lastName || '';
      return `${cFirst} ${cLast}`.trim();
    }).filter(Boolean);

    // Extract attachments
    const attachments = (log.attachments || []).map((a: any) => a.fileName || a);

    return {
      id: log.id,
      userId: employeeId,
      workerName,
      soNumber,
      department: departmentName,
      activity: activityName,
      startTime,
      endTime,
      standardManMinutes,
      durationMinutes,
      remarks: log.remarks,
      coworkers: coworkers.length > 0 ? coworkers : undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
      managerRemarks: log.managerRemarks,
      isRework: log.isRework || false,
      reworkAssignedToId: log.reworkAssignedToId,
      reworkAssignedToName: log.reworkAssignedTo
        ? `${log.reworkAssignedTo.firstName || ''} ${log.reworkAssignedTo.lastName || ''}`.trim()
        : undefined,
    };
  });

  // ── Logging Form State ──────────────────────────────────────────────
  const [logFormOpen, setLogFormOpen] = useState(false);
  const [logWorkerName, setLogWorkerName] = useState('');
  const [logSoNumber, setLogSoNumber] = useState('');
  const [logDepartment, setLogDepartment] = useState('');
  const [logActivity, setLogActivity] = useState('');
  const [logStartTime, setLogStartTime] = useState('');
  const [logEndTime, setLogEndTime] = useState('');
  const [logDurationMinutes, setLogDurationMinutes] = useState<number | ''>('');
  const [logStandardManMinutes, setLogStandardManMinutes] = useState<number | ''>('');
  const [logRemarks, setLogRemarks] = useState('');
  const [logCoworkers, setLogCoworkers] = useState<string[]>([]);
  const [logErrors, setLogErrors] = useState<Record<string, string | undefined>>({});

  const handleResetLogForm = () => {
    setLogWorkerName('');
    setLogSoNumber('');
    setLogDepartment('');
    setLogActivity('');
    setLogStartTime('');
    setLogEndTime('');
    setLogDurationMinutes('');
    setLogStandardManMinutes('');
    setLogRemarks('');
    setLogCoworkers([]);
    setLogErrors({});
  };

  const handleOpenLogForm = () => {
    handleResetLogForm();
    setLogFormOpen(true);
  };

  const handleActivityChange = (actName: string) => {
    setLogActivity(actName);
    const dept = departments.find(d => d.name === logDepartment);
    const act = (dept?.activities || []).find(a => a.name === actName);
    if (act) {
      setLogStandardManMinutes(act.standardMinutes);
    }
  };

  const handleTimeChange = (start: string, end: string) => {
    setLogStartTime(start);
    setLogEndTime(end);
    if (start && end) {
      const [startH, startM] = start.split(':').map(Number);
      const [endH, endM] = end.split(':').map(Number);
      let diff = (endH * 60 + endM) - (startH * 60 + startM);
      if (diff < 0) diff += 24 * 60; // handle wrap around midnight
      setLogDurationMinutes(diff);
    } else {
      setLogDurationMinutes('');
    }
  };

  const validateLogForm = (): boolean => {
    const tempErrors: Record<string, string | undefined> = {};
    let isValid = true;

    if (!logWorkerName) {
      tempErrors.worker = 'Worker selection is required';
      isValid = false;
    }
    if (!logSoNumber) {
      tempErrors.so = 'Sales Order is required';
      isValid = false;
    }
    if (!logDepartment) {
      tempErrors.dept = 'Department is required';
      isValid = false;
    }
    if (!logActivity) {
      tempErrors.activity = 'Activity is required';
      isValid = false;
    }
    if (!logStartTime) {
      tempErrors.startTime = 'Start time is required';
      isValid = false;
    }
    if (logStandardManMinutes === '' || Number(logStandardManMinutes) <= 0) {
      tempErrors.standard = 'Standard minutes must be a positive integer';
      isValid = false;
    }
    if (logDurationMinutes === '' || Number(logDurationMinutes) < 0) {
      tempErrors.duration = 'Duration must be a non-negative integer';
      isValid = false;
    }

    setLogErrors(tempErrors);
    return isValid;
  };

  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLogForm()) return;

    const worker = users.find(u => u.adminName === logWorkerName);
    const newLog = {
      userId: worker?.userId || `EMP-${Math.floor(100 + Math.random() * 900)}`,
      workerName: logWorkerName,
      soNumber: logSoNumber,
      department: logDepartment,
      activity: logActivity,
      startTime: logStartTime || undefined,
      endTime: logEndTime || undefined,
      standardManMinutes: Number(logStandardManMinutes),
      durationMinutes: Number(logDurationMinutes) || 0,
      remarks: logRemarks.trim() || undefined,
      coworkers: logCoworkers.length > 0 ? logCoworkers : undefined,
      attachments: [],
      employeeId: worker?.userId,
    };

    const success = await addNewActivityLog(newLog);
    if (success) {
      setLogFormOpen(false);
      handleResetLogForm();
    }
  };

  // ── Filters State ──────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState<string>(''); // empty = show all
  const [soFilter, setSoFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [employeeFilter, setEmployeeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // ── Modal State ────────────────────────────────────────────────────
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState(0); // 0: Info, 1: Coworkers, 2: Attachments, 3: Review

  // ── Review Log State ──
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [reviewIsRework, setReviewIsRework] = useState(false);
  const [reviewReworkAssignedToId, setReviewReworkAssignedToId] = useState('');
  const [isSavingReview, setIsSavingReview] = useState(false);

  const handleSaveReview = async () => {
    if (!selectedLog) return;
    setIsSavingReview(true);
    const success = await updateActivityLog(selectedLog.id, {
      managerRemarks: reviewRemarks.trim() || null,
      isRework: reviewIsRework,
      reworkAssignedToId: reviewIsRework && reviewReworkAssignedToId ? reviewReworkAssignedToId : null,
    });
    setIsSavingReview(false);
    if (success) {
      setDetailsOpen(false);
    }
  };

  // ── Helper List Retrievers ──────────────────────────────────────────
  const uniqueSOWorkOrders = ['All', ...Array.from(new Set(normalizedLogs.map((log) => log.soNumber)))];
  const uniqueDepartments = ['All', ...Array.from(new Set(normalizedLogs.map((log) => log.department)))];
  const uniqueEmployees = ['All', ...Array.from(new Set(normalizedLogs.map((log) => log.workerName)))];

  // ── Status Inference Logic ──────────────────────────────────────────
  const getLogStatus = (log: ActivityLog): 'Pending' | 'In Progress' | 'Completed' | 'Rejected' => {
    // If remarks or activity mentions rejection, treat as Rejected
    if (log.remarks?.toLowerCase().includes('reject') || log.activity.toLowerCase().includes('reject')) {
      return 'Rejected';
    }
    if (log.startTime && log.endTime) {
      return 'Completed';
    }
    if (log.startTime && !log.endTime) {
      return 'In Progress';
    }
    return 'Pending';
  };

  // ── Productivity Calculation Logic ──────────────────────────────────
  const calculateProductivity = (log: ActivityLog): number | null => {
    const status = getLogStatus(log);
    if (status === 'Pending' || !log.durationMinutes || log.durationMinutes === 0) {
      return null;
    }
    return Math.round((log.standardManMinutes / log.durationMinutes) * 100);
  };

  // ── Status Styles Helper ───────────────────────────────────────────
  const getStatusChip = (status: 'Pending' | 'In Progress' | 'Completed' | 'Rejected') => {
    switch (status) {
      case 'Completed':
        return (
          <Chip
            icon={<CompleteIcon sx={{ fontSize: '14px !important', color: '#10B981 !important' }} />}
            label="Completed"
            size="small"
            sx={{
              fontWeight: 800,
              fontSize: '0.75rem',
              bgcolor: 'rgba(16, 185, 129, 0.12)',
              color: '#10B981',
              borderRadius: '6px',
            }}
          />
        );
      case 'In Progress':
        return (
          <Chip
            icon={<RunningIcon sx={{ fontSize: '14px !important', color: '#3B82F6 !important' }} />}
            label="In Progress"
            size="small"
            sx={{
              fontWeight: 800,
              fontSize: '0.75rem',
              bgcolor: 'rgba(59, 130, 246, 0.12)',
              color: '#3B82F6',
              borderRadius: '6px',
            }}
          />
        );
      case 'Pending':
        return (
          <Chip
            icon={<PendingIcon sx={{ fontSize: '14px !important', color: '#F59E0B !important' }} />}
            label="Pending"
            size="small"
            sx={{
              fontWeight: 800,
              fontSize: '0.75rem',
              bgcolor: 'rgba(245, 158, 11, 0.12)',
              color: '#F59E0B',
              borderRadius: '6px',
            }}
          />
        );
      case 'Rejected':
        return (
          <Chip
            icon={<RejectedIcon sx={{ fontSize: '14px !important', color: '#EF4444 !important' }} />}
            label="Rejected"
            size="small"
            sx={{
              fontWeight: 800,
              fontSize: '0.75rem',
              bgcolor: 'rgba(239, 68, 68, 0.12)',
              color: '#EF4444',
              borderRadius: '6px',
            }}
          />
        );
    }
  };

  const getProductivityColor = (pct: number | null) => {
    if (pct === null) return 'text.secondary';
    if (pct >= 95) return '#10B981'; // Vibrant Green
    if (pct >= 85) return '#3B82F6'; // Sleek Blue
    if (pct >= 60) return '#F59E0B'; // Yellow Warning
    return '#EF4444'; // Red Alert
  };

  // ── KPI Summary Calculations ────────────────────────────────────────
  const totalLogs = normalizedLogs.length;
  const uniqueWorkers = new Set(normalizedLogs.map(l => l.userId)).size;
  const logsWithDuration = normalizedLogs.filter(l => l.durationMinutes > 0 && l.standardManMinutes > 0);
  const avgProductivity = logsWithDuration.length > 0
    ? Math.round(logsWithDuration.reduce((sum, l) => sum + (l.standardManMinutes / l.durationMinutes) * 100, 0) / logsWithDuration.length)
    : 0;
  const activeSOs = salesOrders.filter(so => so.isActive !== false).length;

  // ── Filters & Search Execution ──────────────────────────────────────
  const filteredLogs = normalizedLogs.filter((log) => {
    // 0. Date Filter
    if (selectedDate) {
      // try to match activityDate from the raw log
      const rawLog = activityLogs.find((r: any) => r.id === log.id) as any;
      const logDate = rawLog?.activityDate
        ? new Date(rawLog.activityDate).toISOString().split('T')[0]
        : '';
      if (logDate && logDate !== selectedDate) return false;
    }
    // 1. SO Number Filter
    if (soFilter !== 'All' && log.soNumber !== soFilter) return false;
    // 2. Department Filter
    if (deptFilter !== 'All' && log.department !== deptFilter) return false;
    // 3. Employee Filter
    if (employeeFilter !== 'All' && log.workerName !== employeeFilter) return false;
    // 4. Status Filter
    const logStatus = getLogStatus(log);
    if (statusFilter !== 'All' && logStatus !== statusFilter) return false;
    // 5. Search Text Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchSearch =
        log.workerName.toLowerCase().includes(query) ||
        log.userId.toLowerCase().includes(query) ||
        log.soNumber.toLowerCase().includes(query) ||
        log.activity.toLowerCase().includes(query) ||
        (log.remarks && log.remarks.toLowerCase().includes(query));
      if (!matchSearch) return false;
    }
    return true;
  });

  // ── Modal Actions Helper ───────────────────────────────────────────
  const handleOpenDetails = (log: any, tabIndex: number) => {
    setSelectedLog(log);
    setActiveTab(tabIndex);
    setReviewRemarks(log.managerRemarks || '');
    setReviewIsRework(log.isRework || false);
    setReviewReworkAssignedToId(log.reworkAssignedToId || '');
    setDetailsOpen(true);
  };

  return (
    <Box sx={{ pb: 5 }}>
      {/* ── KPI Summary Cards ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2.5, mb: 3 }}>
        {[
          { label: 'Total Activity Logs', value: totalLogs, color: '#6366F1', bg: 'rgba(99,102,241,0.08)', icon: '📋' },
          { label: 'Active Workers', value: uniqueWorkers, color: '#10B981', bg: 'rgba(16,185,129,0.08)', icon: '👷' },
          { label: 'Avg Productivity', value: `${avgProductivity}%`, color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', icon: '📈' },
          { label: 'Active Sales Orders', value: activeSOs, color: '#06B6D4', bg: 'rgba(6,182,212,0.08)', icon: '📦' },
        ].map((card, idx) => (
          <Card
            key={idx}
            sx={{
              p: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3.5,
              boxShadow: 'none',
              background: themeMode === 'dark' ? card.bg : 'rgba(255,255,255,0.9)',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 8px 20px ${card.color}18` }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 0.5 }}>
                  {card.label}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: card.color, letterSpacing: '-0.02em' }}>
                  {card.value}
                </Typography>
              </Box>
              <Box sx={{ fontSize: '2rem', opacity: 0.8 }}>{card.icon}</Box>
            </Box>
          </Card>
        ))}
      </Box>

      {/* ── Page Header ── */}
      <Card
        sx={{
          p: 3,
          mb: 4,
          border: '1px solid',
          borderColor: 'divider',
          background: themeMode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.005)',
          boxShadow: 'none',
          borderRadius: 4,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                letterSpacing: '-0.02em',
                mb: 0.5,
                background: 'linear-gradient(135deg, #3B82F6 0%, #10B981 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block',
              }}
            >
              Work Monitoring Dashboard
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleOpenLogForm}
              sx={{
                borderRadius: 3,
                fontWeight: 750,
                px: 3,
                py: 0.8,
                textTransform: 'none',
                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)',
              }}
            >
              Log Activity
            </Button>
            <Chip
              label="Live Sync Active"
              color="success"
              size="small"
              sx={{
                fontWeight: 800,
                fontSize: '0.75rem',
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                  '50%': { opacity: 0.7, transform: 'scale(0.97)' },
                },
              }}
            />
          </Box>
        </Box>
      </Card>

      {/* ── Top Filters Row ── */}
      <Card
        sx={{
          p: 2.5,
          mb: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3.5,
          boxShadow: 'none',
        }}
      >
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          {/* 1. Date Filter */}
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              slotProps={{
                inputLabel: { shrink: true },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <DateIcon sx={{ color: 'text.secondary', fontSize: 16 }} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2.5, bgcolor: 'background.default', fontWeight: 600, fontSize: '0.85rem' },
                },
              }}
            />
          </Grid>

          {/* 2. SO Number Dropdown */}
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="SO Number"
              value={soFilter}
              onChange={(e) => setSoFilter(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <FilterIcon sx={{ color: 'text.secondary', fontSize: 16 }} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2.5, bgcolor: 'background.default', fontWeight: 600, fontSize: '0.85rem' },
                },
              }}
            >
              {uniqueSOWorkOrders.map((so) => (
                <MenuItem key={so} value={so} sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  {so === 'All' ? 'All Sales Orders' : so}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* 3. Department Dropdown */}
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Department"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <FilterIcon sx={{ color: 'text.secondary', fontSize: 16 }} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2.5, bgcolor: 'background.default', fontWeight: 600, fontSize: '0.85rem' },
                },
              }}
            >
              {uniqueDepartments.map((dept) => (
                <MenuItem key={dept} value={dept} sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  {dept === 'All' ? 'All Departments' : dept}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* 4. Employee Dropdown */}
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Employee"
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <FilterIcon sx={{ color: 'text.secondary', fontSize: 16 }} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2.5, bgcolor: 'background.default', fontWeight: 600, fontSize: '0.85rem' },
                },
              }}
            >
              {uniqueEmployees.map((emp) => (
                <MenuItem key={emp} value={emp} sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  {emp === 'All' ? 'All Employees' : emp}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* 5. Status Dropdown */}
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <FilterIcon sx={{ color: 'text.secondary', fontSize: 16 }} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2.5, bgcolor: 'background.default', fontWeight: 600, fontSize: '0.85rem' },
                },
              }}
            >
              <MenuItem value="All" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>All Statuses</MenuItem>
              <MenuItem value="Pending" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>🟡 Pending</MenuItem>
              <MenuItem value="In Progress" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>🔵 In Progress</MenuItem>
              <MenuItem value="Completed" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>🟢 Completed</MenuItem>
              <MenuItem value="Rejected" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>🔴 Rejected</MenuItem>
            </TextField>
          </Grid>

          {/* 6. Universal Search */}
          <Grid size={{ xs: 12, sm: 12, md: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search ID, Worker, Activity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2.5, bgcolor: 'background.default', fontSize: '0.85rem' },
                },
              }}
            />
          </Grid>
        </Grid>
      </Card>

      {/* ── Live Work Tracking Table ── */}
      <TableContainer component={Paper} sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 3.5, overflow: 'hidden' }}>
        <Table size="medium">
          <TableHead sx={{ bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.012)' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: 'text.secondary', py: 2 }}>User ID</TableCell>
              <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: 'text.secondary' }}>Worker Name</TableCell>
              <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: 'text.secondary' }}>SO Number</TableCell>
              <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: 'text.secondary' }}>Department</TableCell>
              <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: 'text.secondary' }}>Activity</TableCell>
              <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: 'text.secondary' }}>Start Time</TableCell>
              <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: 'text.secondary' }}>End Time</TableCell>
              <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: 'text.secondary' }}>Productivity %</TableCell>
              <TableCell sx={{ fontWeight: 800, fontSize: '0.85rem', color: 'text.secondary' }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.85rem', color: 'text.secondary', pr: 3.5 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6 }}>
                  <Box sx={{
                    width: 80, height: 80, borderRadius: '50%',
                    bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2,
                    border: '1.5px dashed', borderColor: 'divider'
                  }}>
                    <ProductivityIcon sx={{ fontSize: 36, color: 'text.disabled' }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.8, color: 'text.primary' }}>
                    {normalizedLogs.length === 0 ? 'No Activity Logs Yet' : 'No Matching Records'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, maxWidth: 360, mb: 3, textAlign: 'center' }}>
                    {normalizedLogs.length === 0
                      ? 'No activity has been logged yet. Click "Log Activity" to add the first entry.'
                      : 'Try adjusting your filters or clearing the date/search to see more records.'}
                  </Typography>
                  {normalizedLogs.length === 0 ? (
                    <Button
                      variant="outlined"
                      startIcon={<RunningIcon />}
                      onClick={handleOpenLogForm}
                      sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none' }}
                    >
                      Log Activity
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      onClick={() => { setSoFilter('All'); setDeptFilter('All'); setEmployeeFilter('All'); setStatusFilter('All'); setSearchQuery(''); setSelectedDate(''); }}
                      sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none' }}
                    >
                      Clear All Filters
                    </Button>
                  )}
                </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => {
                const status = getLogStatus(log);
                const prod = calculateProductivity(log);

                return (
                  <TableRow
                    key={log.id}
                    sx={{
                      transition: 'background-color 0.2s',
                      '&:hover': { bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' },
                      cursor: 'pointer'
                    }}
                    onClick={() => handleOpenDetails(log, 0)}
                  >
                    {/* User ID */}
                    <TableCell sx={{ py: 1.8, fontWeight: 700, fontFamily: 'ui-monospace, monospace', color: 'text.secondary' }}>
                      {log.userId}
                    </TableCell>

                    {/* Worker Name */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                        <Avatar sx={{ width: 28, height: 28, fontSize: '0.8rem', fontWeight: 800, bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                          {log.workerName.charAt(0)}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                          {log.workerName}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* SO Number */}
                    <TableCell sx={{ fontWeight: 800, fontFamily: 'ui-monospace, monospace' }}>
                      {log.soNumber}
                    </TableCell>

                    {/* Department */}
                    <TableCell>
                      <Chip label={log.department} size="small" sx={{ fontWeight: 700, fontSize: '0.75rem' }} />
                    </TableCell>

                    {/* Activity */}
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                          {log.activity}
                        </Typography>
                        {log.isRework && (
                          <Chip
                            label={`Rework: ${log.reworkAssignedToName || 'Unassigned'}`}
                            color="error"
                            size="small"
                            sx={{ fontWeight: 800, fontSize: '0.65rem', height: 18, width: 'fit-content' }}
                          />
                        )}
                      </Box>
                    </TableCell>

                    {/* Start Time */}
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.85rem' }}>
                      {log.startTime || '--'}
                    </TableCell>

                    {/* End Time */}
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.85rem' }}>
                      {log.endTime || '--'}
                    </TableCell>

                    {/* Productivity % */}
                    <TableCell>
                      {prod === null ? (
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>--</Typography>
                      ) : (
                        <Box sx={{ width: 80 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.4 }}>
                            <Typography variant="body2" sx={{ fontWeight: 850, color: getProductivityColor(prod) }}>
                              {prod}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(prod, 100)}
                            sx={{
                              height: 3,
                              borderRadius: 1,
                              bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                              '& .MuiLinearProgress-bar': { bgcolor: getProductivityColor(prod) }
                            }}
                          />
                        </Box>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {getStatusChip(status)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="right" sx={{ pr: 2 }} onClick={(e) => e.stopPropagation()}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                        {/* Action 1: View Details */}
                        <Tooltip title="View Activity Info">
                          <IconButton size="small" color="primary" onClick={() => handleOpenDetails(log, 0)}>
                            <ViewIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>

                        {/* Action 2: View Coworkers */}
                        <Tooltip title="View Coworkers">
                          <IconButton size="small" color="secondary" onClick={() => handleOpenDetails(log, 1)}>
                            <CoworkersIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>

                        {/* Action 3: View Attachments */}
                        <Tooltip title="View Attachments">
                          <IconButton size="small" color="info" onClick={() => handleOpenDetails(log, 2)}>
                            <AttachmentIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>

                        {/* Action 4: Review & Remarks */}
                        <Tooltip title="Review & Remarks">
                          <IconButton size="small" color="warning" onClick={() => handleOpenDetails(log, 3)}>
                            <ReviewIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── Unified Interactive View Details Popup Modal ── */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider', boxShadow: '0 24px 50px rgba(0,0,0,0.25)' },
          },
        }}
      >
        {selectedLog && (
          <>
            {/* Modal Title Block */}
            <DialogTitle
              sx={{
                p: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.005)',
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 44, height: 44, fontWeight: 'bold', fontSize: '1.25rem', background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', color: '#FFF' }}>
                  {selectedLog.workerName.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                    {selectedLog.workerName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>
                    Employee ID: {selectedLog.userId} · {selectedLog.department} Department
                  </Typography>
                </Box>
              </Box>
              <IconButton onClick={() => setDetailsOpen(false)} sx={{ color: 'text.secondary' }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            {/* Modal Navigation Tabs */}
            <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}>
              <Tabs
                value={activeTab}
                onChange={(_, val) => setActiveTab(val)}
                variant="fullWidth"
                sx={{
                  '& .MuiTab-root': { fontWeight: 800, fontSize: '0.85rem', textTransform: 'none', py: 1.5 },
                  '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' }
                }}
              >
                <Tab label="Activity Info" />
                <Tab label={`Coworkers (${selectedLog.coworkers?.length || 0})`} />
                <Tab label={`Attachments (${selectedLog.attachments?.length || 0})`} />
                <Tab label="Review & Rework" />
              </Tabs>
            </Box>

            {/* Modal Content */}
            <DialogContent sx={{ p: 3, minHeight: 280 }}>
              {/* TAB 0: ACTIVITY INFORMATION */}
              {activeTab === 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Operational Metrics
                  </Typography>
                  <Grid container spacing={2.5} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>Sales Order</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, fontFamily: 'ui-monospace, monospace' }}>{selectedLog.soNumber}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>Activity Name</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{selectedLog.activity}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>Department</Typography>
                      <Chip label={selectedLog.department} size="small" sx={{ height: 20, fontWeight: 700, fontSize: '0.75rem', mt: 0.3 }} />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>Start Time</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>{selectedLog.startTime || 'Not Logged'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>End Time</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>{selectedLog.endTime || 'Not Logged'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>Current Status</Typography>
                      <Box sx={{ mt: 0.3 }}>{getStatusChip(getLogStatus(selectedLog))}</Box>
                    </Grid>
                  </Grid>

                  <Divider sx={{ mb: 2.5 }} />

                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Efficiency Telemetry
                  </Typography>
                  <Grid container spacing={2.5} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>Standard Minutes</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.2 }}>
                        <DurationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>{selectedLog.standardManMinutes} min</Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>Actual Minutes</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.2 }}>
                        <DurationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>{selectedLog.durationMinutes || '--'} min</Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>Productivity Index</Typography>
                      {calculateProductivity(selectedLog) === null ? (
                        <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.secondary', mt: 0.2 }}>--</Typography>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.2 }}>
                          <ProductivityIcon sx={{ fontSize: 16, color: getProductivityColor(calculateProductivity(selectedLog)) }} />
                          <Typography variant="body2" sx={{ fontWeight: 850, color: getProductivityColor(calculateProductivity(selectedLog)) }}>
                            {calculateProductivity(selectedLog)}%
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                  </Grid>

                  <Divider sx={{ mb: 2.5 }} />

                  {/* Remarks */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                        Worker Submission Remarks
                      </Typography>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: 2.5,
                          bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.005)',
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontStyle: 'italic', lineHeight: 1.5 }}>
                          "{selectedLog.remarks || 'No remarks recorded for this operational session.'}"
                        </Typography>
                      </Paper>
                    </Box>

                    {(selectedLog.managerRemarks || selectedLog.isRework) && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                          Manager Review & Remarks
                        </Typography>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            borderRadius: 2.5,
                            bgcolor: 'action.hover',
                            border: '1px solid',
                            borderColor: selectedLog.isRework ? 'error.light' : 'divider',
                          }}
                        >
                          {selectedLog.isRework && (
                            <Chip
                              label={`Rework assigned to: ${selectedLog.reworkAssignedToName || 'Unassigned'}`}
                              color="error"
                              size="small"
                              sx={{ fontWeight: 800, mb: 1, height: 20 }}
                            />
                          )}
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.5 }}>
                            {selectedLog.managerRemarks || 'No review remarks written.'}
                          </Typography>
                        </Paper>
                      </Box>
                    )}
                  </Box>
                </Box>
              )}

              {/* TAB 1: COWORKERS SECTION */}
              {activeTab === 1 && (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 3 }}>
                    The following colleagues are assigned to the same activity logs or department for collaboration.
                  </Typography>

                  {!selectedLog.coworkers || selectedLog.coworkers.length === 0 ? (
                    <Box sx={{ py: 5, textAlign: 'center' }}>
                      <CoworkersIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                        No coworker allocations recorded for this log.
                      </Typography>
                    </Box>
                  ) : (
                    <Grid container spacing={2}>
                      {selectedLog.coworkers.map((workerName) => {
                        // Find matching profile details if they exist in state
                        const coworkerProfile = users.find(u => u.adminName === workerName);

                        return (
                          <Grid size={{ xs: 12, sm: 6 }} key={workerName}>
                            <Paper
                              variant="outlined"
                              sx={{
                                p: 2,
                                borderRadius: 3,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'translateY(-1px)', bgcolor: 'action.hover' }
                              }}
                            >
                              <Avatar sx={{ bgcolor: 'primary.main', width: 34, height: 34, fontSize: '0.9rem', fontWeight: 800 }}>
                                {workerName.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                  {workerName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                                  {coworkerProfile?.role || 'Assembly Crew'} · {coworkerProfile?.userId || 'EMP-COLLAB'}
                                </Typography>
                              </Box>
                            </Paper>
                          </Grid>
                        );
                      })}
                    </Grid>
                  )}
                </Box>
              )}

              {/* TAB 2: ATTACHMENTS SECTION */}
              {activeTab === 2 && (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 3 }}>
                    Visual attachments, engineering schematics, and QC sheets logged in support of this operational cycle.
                  </Typography>

                  {!selectedLog.attachments || selectedLog.attachments.length === 0 ? (
                    <Box sx={{ py: 5, textAlign: 'center' }}>
                      <AttachmentIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                        No document attachments recorded for this session.
                      </Typography>
                    </Box>
                  ) : (
                    <Grid container spacing={2}>
                      {selectedLog.attachments.map((file) => {
                        const isImage = file.endsWith('.png') || file.endsWith('.jpg');

                        return (
                          <Grid size={{ xs: 12, sm: 6 }} key={file}>
                            <Paper
                              variant="outlined"
                              sx={{
                                p: 2,
                                borderRadius: 3,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                cursor: 'pointer',
                                '&:hover': { bgcolor: 'action.hover', border: '1px solid', borderColor: 'primary.main' }
                              }}
                            >
                              <Avatar sx={{ bgcolor: isImage ? 'success.lighter' : 'info.lighter', color: isImage ? 'success.main' : 'info.main', width: 36, height: 36 }}>
                                <AttachmentIcon sx={{ fontSize: 18 }} />
                              </Avatar>
                              <Box sx={{ overflow: 'hidden', flexGrow: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 800, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                  {file}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                                  {isImage ? 'Quality Capture Image' : 'PDF Blueprint Specification'}
                                </Typography>
                              </Box>
                            </Paper>
                          </Grid>
                        );
                      })}
                    </Grid>
                  )}
                </Box>
              )}

              {/* TAB 3: REVIEW & REWORK SECTION */}
              {activeTab === 3 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                    Review this activity log entry, record instructions/feedback, and flag for rework if needed.
                  </Typography>

                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Manager Review Remarks"
                    placeholder="Provide feedback or rework guidance..."
                    value={reviewRemarks}
                    onChange={(e) => setReviewRemarks(e.target.value)}
                    slotProps={{ input: { sx: { borderRadius: 3, fontWeight: 600 } } }}
                  />

                  <Box sx={{ border: '1px solid', borderColor: 'divider', p: 2, borderRadius: 3 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={reviewIsRework}
                          onChange={(e) => setReviewIsRework(e.target.checked)}
                          color="error"
                        />
                      }
                      label={
                        <Box>
                          <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: reviewIsRework ? 'error.main' : 'text.primary' }}>
                            Flag for Rework
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                            Worker will need to repeat or correct this operational activity.
                          </Typography>
                        </Box>
                      }
                    />

                    {reviewIsRework && (
                      <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel id="monitoring-rework-worker-select-label" sx={{ fontWeight: 600 }}>Assign Rework To</InputLabel>
                        <Select
                          labelId="monitoring-rework-worker-select-label"
                          value={reviewReworkAssignedToId}
                          onChange={(e) => setReviewReworkAssignedToId(e.target.value)}
                          label="Assign Rework To"
                          sx={{ borderRadius: 3, fontWeight: 700 }}
                        >
                          {users.map((u) => (
                            <MenuItem key={u.id} value={u.id} sx={{ fontWeight: 600 }}>
                              {u.adminName} ({u.userId}) · {u.role}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  </Box>

                  <Button
                    onClick={handleSaveReview}
                    variant="contained"
                    disabled={isSavingReview}
                    sx={{
                      fontWeight: 800,
                      borderRadius: 2.5,
                      py: 1.2,
                      textTransform: 'none',
                      background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                      boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
                    }}
                  >
                    {isSavingReview ? 'Saving Review…' : 'Save Review & Remarks'}
                  </Button>
                </Box>
              )}
            </DialogContent>

            {/* Modal Actions */}
            <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
              <Button
                variant="contained"
                onClick={() => setDetailsOpen(false)}
                sx={{
                  fontWeight: 700,
                  borderRadius: 2.5,
                  px: 4,
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                }}
              >
                Close Details
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ── Log Activity Form Dialog Modal ── */}
      <Dialog
        open={logFormOpen}
        onClose={() => setLogFormOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: 4, px: 2, py: 1 },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <DurationIcon color="primary" />
          Log Workforce Activity
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Box component="form" onSubmit={handleSaveLog} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            
            {/* 1. Worker Selection Dropdown */}
            <TextField
              select
              required
              fullWidth
              label="Select Worker"
              value={logWorkerName}
              onChange={(e) => {
                setLogWorkerName(e.target.value);
                if (logErrors.worker) setLogErrors((prev) => ({ ...prev, worker: undefined }));
              }}
              error={Boolean(logErrors.worker)}
              helperText={logErrors.worker}
              slotProps={{ input: { sx: { borderRadius: 3, fontWeight: 700 } } }}
            >
              {users.map((u) => (
                <MenuItem key={u.userId} value={u.adminName} sx={{ fontWeight: 600 }}>
                  {u.adminName} ({u.userId}) · {u.role}
                </MenuItem>
              ))}
            </TextField>

            {/* 2. Sales Order Selection Dropdown */}
            <TextField
              select
              required
              fullWidth
              label="Select Sales Order (SO)"
              value={logSoNumber}
              onChange={(e) => {
                const soNum = e.target.value;
                setLogSoNumber(soNum);
                setLogDepartment(''); // reset department
                setLogActivity('');   // reset activity
                if (logErrors.so) setLogErrors((prev) => ({ ...prev, so: undefined }));
              }}
              error={Boolean(logErrors.so)}
              helperText={logErrors.so}
              slotProps={{ input: { sx: { borderRadius: 3, fontWeight: 700 } } }}
            >
              {salesOrders.filter((so) => so.isActive !== false).map((so) => (
                <MenuItem key={so.soNumber} value={so.soNumber} sx={{ fontWeight: 600 }}>
                  {so.soNumber} · {so.projectName} ({so.customerName})
                </MenuItem>
              ))}
            </TextField>

            <Grid container spacing={2}>
              {/* 3. Department Selection Dropdown (Only allowed depts) */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  required
                  fullWidth
                  label="Select Department"
                  value={logDepartment}
                  disabled={!logSoNumber}
                  onChange={(e) => {
                    setLogDepartment(e.target.value);
                    setLogActivity(''); // reset activity
                    if (logErrors.dept) setLogErrors((prev) => ({ ...prev, dept: undefined }));
                  }}
                  error={Boolean(logErrors.dept)}
                  helperText={logErrors.dept || (!logSoNumber && "Select a Sales Order first")}
                  slotProps={{ input: { sx: { borderRadius: 3, fontWeight: 700 } } }}
                >
                  {(() => {
                    const filteredDepts = departments.filter(d => d.status === 'Active');
                    return filteredDepts.map((d) => (
                      <MenuItem key={d.name} value={d.name} sx={{ fontWeight: 600 }}>
                        {d.name}
                      </MenuItem>
                    ));
                  })()}
                </TextField>
              </Grid>

              {/* 4. Activity Selection Dropdown (Only allowed activities inside this dept) */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  required
                  fullWidth
                  label="Select Activity"
                  value={logActivity}
                  disabled={!logDepartment}
                  onChange={(e) => {
                    handleActivityChange(e.target.value);
                    if (logErrors.activity) setLogErrors((prev) => ({ ...prev, activity: undefined }));
                  }}
                  error={Boolean(logErrors.activity)}
                  helperText={logErrors.activity || (!logDepartment && "Select a Department first")}
                  slotProps={{ input: { sx: { borderRadius: 3, fontWeight: 700 } } }}
                >
                  {(() => {
                    const deptActivities = departments.find(d => d.name === logDepartment)?.activities || [];
                    const filteredActs = deptActivities.filter(a => a.status === 'Active');
                    return filteredActs.map((a) => (
                      <MenuItem key={a.id} value={a.name} sx={{ fontWeight: 600 }}>
                        {a.name}
                      </MenuItem>
                    ));
                  })()}
                </TextField>
              </Grid>
            </Grid>

            {/* 5. Times and Durations */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  required
                  fullWidth
                  type="time"
                  label="Start Time"
                  value={logStartTime}
                  onChange={(e) => {
                    handleTimeChange(e.target.value, logEndTime);
                    if (logErrors.startTime) setLogErrors((prev) => ({ ...prev, startTime: undefined }));
                  }}
                  error={Boolean(logErrors.startTime)}
                  helperText={logErrors.startTime}
                  slotProps={{
                    inputLabel: { shrink: true },
                    input: { sx: { borderRadius: 3, fontWeight: 600 } },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="time"
                  label="End Time (Optional)"
                  value={logEndTime}
                  onChange={(e) => handleTimeChange(logStartTime, e.target.value)}
                  slotProps={{
                    inputLabel: { shrink: true },
                    input: { sx: { borderRadius: 3, fontWeight: 600 } },
                  }}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              {/* 6. Standard Minutes (Smart pre-filled/manual override) */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  required
                  fullWidth
                  type="number"
                  label="Standard Man Minutes"
                  value={logStandardManMinutes}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    setLogStandardManMinutes(val);
                    if (logErrors.standard) setLogErrors((prev) => ({ ...prev, standard: undefined }));
                  }}
                  error={Boolean(logErrors.standard)}
                  helperText={logErrors.standard || "Pre-filled from activity template"}
                  slotProps={{
                    input: { sx: { borderRadius: 3, fontWeight: 700 } }
                  }}
                />
              </Grid>

              {/* 7. Actual Minutes (Auto-calculated/override) */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  required
                  fullWidth
                  type="number"
                  label="Actual Logged Minutes"
                  value={logDurationMinutes}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    setLogDurationMinutes(val);
                    if (logErrors.duration) setLogErrors((prev) => ({ ...prev, duration: undefined }));
                  }}
                  error={Boolean(logErrors.duration)}
                  helperText={logErrors.duration || "Auto-calculated from times"}
                  slotProps={{
                    input: { sx: { borderRadius: 3, fontWeight: 700 } }
                  }}
                />
              </Grid>
            </Grid>

            {/* 8. Remarks */}
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Remarks & Details"
              placeholder="Provide comments, quality outcomes, or challenges experienced..."
              value={logRemarks}
              onChange={(e) => setLogRemarks(e.target.value)}
              slotProps={{
                input: { sx: { borderRadius: 3 } },
              }}
            />

            {/* 9. Coworkers multi-select */}
            <FormControl fullWidth size="medium">
              <InputLabel id="log-coworkers-label" sx={{ fontWeight: 600 }}>Collaborative Coworkers</InputLabel>
              <Select
                labelId="log-coworkers-label"
                multiple
                value={logCoworkers}
                onChange={(e) => setLogCoworkers(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                input={<OutlinedInput label="Collaborative Coworkers" sx={{ borderRadius: 3 }} />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {users.filter(u => u.adminName !== logWorkerName).map((u) => (
                  <MenuItem key={u.userId} value={u.adminName} sx={{ fontWeight: 600 }}>
                    <Checkbox checked={logCoworkers.indexOf(u.adminName) > -1} size="small" />
                    <ListItemText primary={u.adminName} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ pb: 3, px: 3, mt: 1, gap: 1 }}>
          <Button onClick={() => setLogFormOpen(false)} sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveLog}
            variant="contained"
            sx={{
              fontWeight: 750,
              borderRadius: 2.5,
              px: 3.5,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
            }}
          >
            Log Activity
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
