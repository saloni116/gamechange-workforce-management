import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  Snackbar,
  Alert,
  TextField,
  MenuItem,
  InputAdornment,
  Divider,
  LinearProgress,
  Skeleton,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  GetApp as DownloadIcon,
  HelpOutlined as FormulaIcon,
  Timeline as DailyIcon,
  DateRange as WeeklyIcon,
  Assessment as MonthlyIcon,
  Group as PerformersIcon,
  Warning as ReworkIcon,
  BarChart as DeptIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  PictureAsPdf as PdfIcon,
  EmojiEvents as TrophyIcon,
  CheckCircle as CheckIcon,
  Schedule as TimeIcon,
  TrendingUp as TrendIcon,
  Refresh as RefreshIcon,
  FiberManualRecord as LiveDotIcon,
  Analytics as AnalyticsIcon,
  Groups as GroupsIcon,
  AccessTime as ClockIcon,
  Speed as SpeedIcon,
  ReportProblem as ReportIcon,
  RateReview as ReviewIcon,
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend,
  Cell,
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── API Base ─────────────────────────────────────────────────────────────────
const API_BASE = 'http://127.0.0.1:5000/api/v1';

const fetchWithAuth = async (endpoint: string) => {
  const token = localStorage.getItem('accessToken');
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const parseMins = (str: string): number => {
  if (!str || str === '--') return 0;
  const h = str.match(/(\d+)\s*(Hours?|h)/i);
  const m = str.match(/(\d+)\s*(Minutes?|Min|m)/i);
  let t = 0;
  if (h) t += parseInt(h[1]) * 60;
  if (m) t += parseInt(m[1]);
  if (!h && !m) { const b = str.replace(/\D/g, ''); if (b) t = parseInt(b); }
  return Math.max(1, t);
};

const calcPct = (std: string, actual: string): number | null => {
  if (!std || !actual || actual === '--') return null;
  const s = parseMins(std);
  const a = parseMins(actual);
  if (a === 0) return null;
  return Math.round((s / a) * 100);
};

const fmtPct = (p: number | null) => (p === null ? '--' : `${p}%`);

const pctColor = (p: number | null) => {
  if (p === null) return '#94A3B8';
  if (p >= 100) return '#10B981';
  if (p >= 75) return '#3B82F6';
  if (p >= 50) return '#F59E0B';
  return '#EF4444';
};

const fmtTime = (d: Date) =>
  d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

// ─── Types ────────────────────────────────────────────────────────────────────
interface NormalizedLog {
  id: string;
  userId: string;
  workerName: string;
  soNumber: string;
  department: string;
  activity: string;
  startTime: string;
  endTime: string;
  standardManMinutes: number;
  durationMinutes: number;
  remarks?: string;
  createdAt?: string;
  managerRemarks?: string;
  isRework?: boolean;
  reworkAssignedToId?: string;
  reworkAssignedToName?: string;
}

interface DashboardSummary {
  totalUsers: number;
  totalDepartments: number;
  totalActivities: number;
  totalSalesOrders: number;
  totalActivityLogs: number;
  totalManHours: number;
  activeUsers: number;
  completedActivities: number;
  averageProductivity: number;
  productivityTrend: { time: string; productivity: number; activeTasks: number; hasData: boolean }[];
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
const StatCardSkeleton = () => (
  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, height: 100 }}>
    <Skeleton variant="text" width="60%" height={16} sx={{ mb: 1 }} />
    <Skeleton variant="text" width="40%" height={32} />
    <Skeleton variant="text" width="80%" height={12} sx={{ mt: 0.5 }} />
  </Paper>
);

// ─── Component ────────────────────────────────────────────────────────────────
interface ReportsAnalyticsProps {
  defaultTab?: number;
}

export const ReportsAnalytics: React.FC<ReportsAnalyticsProps> = ({ defaultTab = 0 }) => {
  const { themeMode, users, erpActivities, updateActivityLog } = useApp();

  // ── State ──
  const [mainTab, setMainTab] = useState(defaultTab);
  const [trendTab, setTrendTab] = useState(0);
  const [empSearch, setEmpSearch] = useState('');
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  // ── Review Log Modal State ──
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedReviewLog, setSelectedReviewLog] = useState<NormalizedLog | null>(null);
  const [managerRemarksInput, setManagerRemarksInput] = useState('');
  const [isReworkInput, setIsReworkInput] = useState(false);
  const [reworkAssignedToIdInput, setReworkAssignedToIdInput] = useState('');

  // ── Live Data State ──
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [logs, setLogs] = useState<NormalizedLog[]>([]);
  const [liveUsers, setLiveUsers] = useState<typeof users>([]);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => { setMainTab(defaultTab); }, [defaultTab]);

  // ── Save review changes to backend ──
  const handleSaveReview = async () => {
    if (!selectedReviewLog) return;
    setRefreshing(true);
    const success = await updateActivityLog(selectedReviewLog.id, {
      managerRemarks: managerRemarksInput.trim() || null,
      isRework: isReworkInput,
      reworkAssignedToId: isReworkInput && reworkAssignedToIdInput ? reworkAssignedToIdInput : null,
    });
    setRefreshing(false);
    if (success) {
      setSnackbar({ open: true, message: '✅ Log reviewed and updated successfully!', severity: 'success' });
      setReviewModalOpen(false);
      fetchAllData(true); // reload fresh data
    } else {
      setSnackbar({ open: true, message: '❌ Failed to update log review.', severity: 'error' });
    }
  };

  // ── Normalize raw backend log ──
  const normalizeLog = (log: any): NormalizedLog => {
    if (log.workerName && log.isRework !== undefined) return log as NormalizedLog;
    const first = log.user?.firstName || '';
    const last = log.user?.lastName || '';
    const workerName = `${first} ${last}`.trim() || 'Unknown Worker';
    const employeeId = log.user?.employeeId || log.userId || 'EMP-UNKNOWN';
    const soNumber = log.SalesOrder?.soNumber || log.soId || 'SO-UNKNOWN';
    const departmentName = log.department?.name || log.departmentId || 'Unknown';
    const activityName = log.activity?.activityName || log.activityId || 'Unknown Activity';
    const firstSlot = log.slots?.[0];
    let startTime = '';
    let endTime = '';
    if (firstSlot?.startTime) {
      const d = new Date(firstSlot.startTime);
      if (!isNaN(d.getTime())) startTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    if (firstSlot?.endTime) {
      const d = new Date(firstSlot.endTime);
      if (!isNaN(d.getTime())) endTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    const standardManMinutes = log.activity?.standardManMinutes || log.standardManMinutes || 0;
    const durationMinutes = firstSlot?.durationMinutes || log.durationMinutes || 0;
    const reworkAssignedToName = log.reworkAssignedTo
      ? `${log.reworkAssignedTo.firstName || ''} ${log.reworkAssignedTo.lastName || ''}`.trim()
      : undefined;

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
      createdAt: log.createdAt,
      managerRemarks: log.managerRemarks,
      isRework: log.isRework || false,
      reworkAssignedToId: log.reworkAssignedToId,
      reworkAssignedToName,
    };
  };

  // ── Fetch all data ──
  const fetchAllData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else if (!lastUpdated) setLoading(true);

    try {
      const [summaryData, logsData, usersData] = await Promise.allSettled([
        fetchWithAuth('/dashboard/summary'),
        fetchWithAuth('/activity-logs'),
        fetchWithAuth('/users'),
      ]);

      if (summaryData.status === 'fulfilled') setSummary(summaryData.value);
      if (logsData.status === 'fulfilled' && Array.isArray(logsData.value)) {
        setLogs(logsData.value.map(normalizeLog));
      }
      if (usersData.status === 'fulfilled' && Array.isArray(usersData.value)) {
        setLiveUsers(usersData.value.map((u: any) => ({
          id: u.id,
          adminName: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Employee',
          userId: u.employeeId || u.userId,
          mobile: u.mobile || '',
          email: u.email || '',
          role: u.role || 'Operator',
          status: (u.status === 'ACTIVE' ? 'Working' : 'Idle') as any,
        })));
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error('ReportsAnalytics fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setCountdown(30);
    }
  }, [lastUpdated]);

  // ── Initial load + 30s auto-refresh ──
  useEffect(() => {
    fetchAllData();

    refreshRef.current = setInterval(() => fetchAllData(), 30000);
    countdownRef.current = setInterval(() => setCountdown(c => (c <= 1 ? 30 : c - 1)), 1000);

    return () => {
      if (refreshRef.current) clearInterval(refreshRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // ── Computed stats from real logs ──
  const completedLogs = logs.filter(l => l.durationMinutes > 0);
  const totalManHours = summary?.totalManHours ?? Math.round(logs.reduce((s, l) => s + l.durationMinutes, 0) / 60);
  const avgProductivity = summary?.averageProductivity ??
    (completedLogs.length > 0
      ? Math.round(completedLogs.reduce((s, l) => s + (l.standardManMinutes / l.durationMinutes) * 100, 0) / completedLogs.length)
      : 0);
  const reworkLogs = logs.filter(l =>
    l.isRework ||
    (l.remarks && l.remarks.toLowerCase().includes('rework')) ||
    (l.durationMinutes > 0 && (l.standardManMinutes / l.durationMinutes) < 0.6)
  );

  // ── Department aggregation ──
  const deptMap: Record<string, { total: number; stdSum: number; actSum: number; rework: number }> = {};
  logs.forEach(l => {
    const d = l.department || 'Unknown';
    if (!deptMap[d]) deptMap[d] = { total: 0, stdSum: 0, actSum: 0, rework: 0 };
    deptMap[d].total += 1;
    deptMap[d].stdSum += l.standardManMinutes;
    deptMap[d].actSum += l.durationMinutes;
    const isRework = (l.remarks?.toLowerCase().includes('rework')) || (l.durationMinutes > 0 && (l.standardManMinutes / l.durationMinutes) < 0.6);
    if (isRework) deptMap[d].rework += 1;
  });

  const deptData = Object.entries(deptMap).map(([dept, v]) => ({
    label: dept,
    productivity: v.actSum > 0 ? Math.min(150, Math.round((v.stdSum / v.actSum) * 100)) : 0,
  })).sort((a, b) => b.productivity - a.productivity).slice(0, 6);

  const reworkData = Object.entries(deptMap).map(([dept, v]) => ({
    department: dept.length > 10 ? dept.slice(0, 10) + '…' : dept,
    completed: v.total - v.rework,
    rework: v.rework,
  })).slice(0, 6);

  // ── Performer aggregation ──
  const empStats: Record<string, { name: string; dept: string; std: number; act: number; count: number }> = {};
  logs.forEach(l => {
    if (!empStats[l.workerName]) empStats[l.workerName] = { name: l.workerName, dept: l.department, std: 0, act: 0, count: 0 };
    empStats[l.workerName].std += l.standardManMinutes;
    empStats[l.workerName].act += l.durationMinutes;
    empStats[l.workerName].count += 1;
  });

  const performersList = Object.values(empStats).map(e => ({
    name: e.name,
    department: e.dept,
    score: e.act > 0 ? Math.min(150, Math.round((e.std / e.act) * 100)) : 100,
    completed: e.count,
  })).filter(p => p.completed > 0);

  const topPerformers = [...performersList].sort((a, b) => b.score - a.score).slice(0, 5);
  const lowestPerformers = [...performersList].sort((a, b) => a.score - b.score).slice(0, 5);

  // ── Trend charts from dashboard summary ──
  const trendSource = summary?.productivityTrend || [];
  // Weekly: group by day of week from logs
  const dayBuckets: Record<string, number[]> = { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [] };
  logs.forEach(l => {
    if (l.createdAt) {
      const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(l.createdAt).getDay()];
      if (l.durationMinutes > 0) dayBuckets[day].push(Math.round((l.standardManMinutes / l.durationMinutes) * 100));
    }
  });
  const weeklyData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => ({
    label: day,
    productivity: dayBuckets[day].length > 0
      ? Math.round(dayBuckets[day].reduce((s, v) => s + v, 0) / dayBuckets[day].length)
      : 0,
    hasData: dayBuckets[day].length > 0,
  }));

  // Monthly: group by month from logs
  const monthBuckets: Record<string, number[]> = {};
  logs.forEach(l => {
    if (l.createdAt) {
      const month = new Date(l.createdAt).toLocaleString('default', { month: 'short' });
      if (!monthBuckets[month]) monthBuckets[month] = [];
      if (l.durationMinutes > 0) monthBuckets[month].push(Math.round((l.standardManMinutes / l.durationMinutes) * 100));
    }
  });
  const monthlyData = Object.entries(monthBuckets).map(([label, vals]) => ({
    label,
    productivity: vals.length > 0 ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0,
  })).slice(-6);

  // Rework activity breakdown
  const actReworkMap: Record<string, { activity: string; department: string; reworkCount: number }> = {};
  reworkLogs.forEach(l => {
    if (!actReworkMap[l.activity]) actReworkMap[l.activity] = { activity: l.activity, department: l.department, reworkCount: 0 };
    actReworkMap[l.activity].reworkCount += 1;
  });
  const mostRework = Object.values(actReworkMap).sort((a, b) => b.reworkCount - a.reworkCount).slice(0, 5);

  // ── Employee individual ──
  const displayUsers = liveUsers.length > 0 ? liveUsers : users;
  const filteredUsers = displayUsers.filter(u =>
    u.adminName.toLowerCase().includes(empSearch.toLowerCase()) ||
    u.userId.toLowerCase().includes(empSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(empSearch.toLowerCase())
  );
  const selectedUser = displayUsers.find(u => u.userId === selectedEmpId) ?? null;

  const empLogs = logs.filter(l => l.userId === selectedEmpId);
  const empActivities = [
    ...erpActivities.filter(a => a.assignedEmployeeId === selectedEmpId).map(a => ({
      id: a.id, name: a.name, code: a.code,
      standardTime: a.standardTime, startTime: a.startTime, endTime: a.endTime,
      actualDuration: a.actualDuration, status: a.status,
      remarks: '', managerRemarks: '', isRework: false, reworkAssignedToId: '', reworkAssignedToName: '', rawLog: null,
    })),
    ...empLogs.filter(l => !erpActivities.some(a => a.id === l.id)).map(l => ({
      id: l.id, name: l.activity, code: l.soNumber,
      standardTime: `${l.standardManMinutes} Minutes`, startTime: l.startTime, endTime: l.endTime,
      actualDuration: `${l.durationMinutes} Minutes`, status: 'Completed' as const,
      remarks: l.remarks || '',
      managerRemarks: l.managerRemarks || '',
      isRework: l.isRework || false,
      reworkAssignedToId: l.reworkAssignedToId || '',
      reworkAssignedToName: l.reworkAssignedToName || '',
      rawLog: l,
    })),
  ];

  const empCompleted = empActivities.filter(a => a.status === 'Completed');
  const empRunning = empActivities.filter(a => a.status === 'Running');
  const empAssigned = empActivities.filter(a => a.status === 'Assigned');
  const empAvgPct = empCompleted.length > 0
    ? Math.round(empCompleted.reduce((s, a) => s + (calcPct(a.standardTime, a.actualDuration) ?? 100), 0) / empCompleted.length)
    : null;

  // ── Chart styles ──
  const isDark = themeMode === 'dark';
  const tooltipStyle = {
    backgroundColor: isDark ? '#1E1B4B' : '#FFFFFF',
    borderRadius: 12,
    border: '1px solid rgba(139,92,246,0.3)',
    fontSize: 12,
    fontWeight: 600,
  };
  const gridStroke = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

  // ── PDF Export ──
  const downloadOverviewPDF = () => {
    const doc = new jsPDF();
    const now = new Date().toLocaleString();
    doc.setFillColor(139, 92, 246);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Workforce Productivity Report', 14, 12);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${now}  |  Live data from backend`, 14, 21);
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary Metrics', 14, 40);
    autoTable(doc, {
      startY: 45,
      head: [['Metric', 'Value']],
      body: [
        ['Total Users', String(summary?.totalUsers ?? '--')],
        ['Total Activity Logs', String(summary?.totalActivityLogs ?? logs.length)],
        ['Man Hours Logged', `${totalManHours} hrs`],
        ['Avg Productivity', `${avgProductivity}%`],
        ['Rework Cases', String(reworkLogs.length)],
      ],
      headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 245, 255] },
      styles: { fontSize: 10, cellPadding: 4 },
    });
    const y1 = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Top Performers', 14, y1);
    autoTable(doc, {
      startY: y1 + 5,
      head: [['Employee', 'Department', 'Productivity', 'Activities']],
      body: topPerformers.map(r => [r.name, r.department, `${r.score}%`, String(r.completed)]),
      headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 253, 244] },
      styles: { fontSize: 10, cellPadding: 4 },
    });
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Page ${i} of ${pageCount}  •  Work Management ERP  •  Live Report`, 14, 290);
    }
    doc.save(`Workforce_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    setSnackbar({ open: true, message: '✅ Report PDF downloaded!', severity: 'success' });
  };

  const downloadEmployeePDF = () => {
    if (!selectedUser) {
      setSnackbar({ open: true, message: '⚠ Select an employee first.', severity: 'error' });
      return;
    }
    const doc = new jsPDF();
    const now = new Date().toLocaleString();
    doc.setFillColor(139, 92, 246);
    doc.rect(0, 0, 210, 32, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Individual Employee Report', 14, 13);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${selectedUser.adminName} | ID: ${selectedUser.userId} | ${selectedUser.role}`, 14, 22);
    doc.text(`Generated: ${now}`, 14, 29);
    doc.setTextColor(30, 30, 30);
    autoTable(doc, {
      startY: 40,
      head: [['Metric', 'Value']],
      body: [
        ['Total Activities', String(empActivities.length)],
        ['Completed', String(empCompleted.length)],
        ['Running', String(empRunning.length)],
        ['Assigned', String(empAssigned.length)],
        ['Avg Productivity', empAvgPct !== null ? `${empAvgPct}%` : 'N/A'],
      ],
      headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 4 },
    });
    if (empActivities.length > 0) {
      const y = (doc as any).lastAutoTable.finalY + 10;
      autoTable(doc, {
        startY: y,
        head: [['Activity', 'Code', 'Std', 'Actual', 'Productivity', 'Status']],
        body: empActivities.map(a => {
          const p = calcPct(a.standardTime, a.actualDuration);
          return [a.name, a.code, a.standardTime, a.actualDuration || '--', fmtPct(p), a.status];
        }),
        headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        styles: { fontSize: 8, cellPadding: 3 },
      });
    }
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Page ${i} of ${pageCount}  •  Work Management ERP  •  Employee: ${selectedUser.adminName}`, 14, 290);
    }
    doc.save(`Employee_Report_${selectedUser.userId}_${new Date().toISOString().split('T')[0]}.pdf`);
    setSnackbar({ open: true, message: `✅ Report for ${selectedUser.adminName} downloaded!`, severity: 'success' });
  };

  // ── Stat Cards data ──
  const statCards = [
    {
      label: 'Total Users',
      value: loading ? null : String(summary?.totalUsers ?? '--'),
      sub: 'Registered in system',
      color: '#8B5CF6',
      icon: <GroupsIcon />,
      gradient: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(124,58,237,0.05) 100%)',
    },
    {
      label: 'Activity Logs',
      value: loading ? null : String(summary?.totalActivityLogs ?? logs.length),
      sub: 'Total submissions',
      color: '#10B981',
      icon: <AnalyticsIcon />,
      gradient: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.05) 100%)',
    },
    {
      label: 'Man Hours',
      value: loading ? null : `${totalManHours.toLocaleString()} hrs`,
      sub: 'Across all activities',
      color: '#3B82F6',
      icon: <ClockIcon />,
      gradient: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.05) 100%)',
    },
    {
      label: 'Avg Productivity',
      value: loading ? null : `${avgProductivity}%`,
      sub: 'Standard/Actual ratio',
      color: pctColor(avgProductivity),
      icon: <SpeedIcon />,
      gradient: `linear-gradient(135deg, ${pctColor(avgProductivity)}22 0%, ${pctColor(avgProductivity)}08 100%)`,
    },
    {
      label: 'Rework Cases',
      value: loading ? null : String(reworkLogs.length),
      sub: 'Low efficiency or flagged',
      color: '#EF4444',
      icon: <ReportIcon />,
      gradient: 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.05) 100%)',
    },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <Box>
      <Snackbar
        open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar(p => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%', borderRadius: 3, fontWeight: 600 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* ── Page Header ── */}
      <Card sx={{
        p: 3, mb: 4,
        border: '1px solid',
        borderColor: 'divider',
        background: isDark
          ? 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(99,102,241,0.04) 100%)'
          : 'linear-gradient(135deg, rgba(139,92,246,0.05) 0%, rgba(99,102,241,0.02) 100%)',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                Reports & Analytics
              </Typography>
              {/* Live indicator */}
              <Chip
                icon={<LiveDotIcon sx={{ fontSize: '10px !important', color: '#10B981 !important', animation: 'pulse 2s infinite' }} />}
                label={refreshing ? 'Refreshing…' : 'Live'}
                size="small"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  bgcolor: 'rgba(16,185,129,0.1)',
                  color: '#10B981',
                  border: '1px solid rgba(16,185,129,0.3)',
                  height: 22,
                  '@keyframes pulse': {
                    '0%': { opacity: 1 },
                    '50%': { opacity: 0.4 },
                    '100%': { opacity: 1 },
                  },
                }}
              />
            </Box>
            {lastUpdated && (
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ClockIcon sx={{ fontSize: 12 }} />
                Last updated: {fmtTime(lastUpdated)} · Auto-refresh in {countdown}s
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Tooltip title="Refresh now">
              <IconButton
                onClick={() => fetchAllData(true)}
                disabled={refreshing}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  '&:hover': { bgcolor: 'rgba(139,92,246,0.08)' },
                }}
              >
                <RefreshIcon sx={{ fontSize: 18, color: refreshing ? '#8B5CF6' : 'text.secondary', animation: refreshing ? 'spin 1s linear infinite' : 'none', '@keyframes spin': { '100%': { transform: 'rotate(360deg)' } } }} />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => setSnackbar({ open: true, message: 'Excel export coming soon! Use PDF for now.', severity: 'success' })}
              sx={{ borderRadius: 3, py: 1, fontWeight: 700, borderColor: 'divider', fontSize: '0.82rem' }}
            >
              Export Excel
            </Button>
            <Button
              variant="contained"
              startIcon={<PdfIcon />}
              onClick={mainTab === 1 ? downloadEmployeePDF : downloadOverviewPDF}
              sx={{
                borderRadius: 3, py: 1, fontWeight: 700, fontSize: '0.82rem',
                background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                boxShadow: '0 4px 14px rgba(139,92,246,0.35)',
                '&:hover': { boxShadow: '0 6px 20px rgba(139,92,246,0.45)' },
              }}
            >
              {mainTab === 1 ? 'Employee PDF' : 'Download PDF'}
            </Button>
          </Box>
        </Box>
      </Card>

      {/* ── Main Tabs ── */}
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', mb: 0 }}>
        <Tabs
          value={mainTab} onChange={(_, v) => setMainTab(v)}
          sx={{ '& .MuiTab-root': { fontWeight: 700, fontSize: '0.9rem', textTransform: 'none', px: 3, py: 1.5 } }}
        >
          <Tab label="📊 Overview & Analytics" />
          <Tab label="👤 Individual Employee Report" />
        </Tabs>
      </Box>

      {/* ══════════════════════════════════════ TAB 0 — OVERVIEW ═══════════════════════════════════════ */}
      {mainTab === 0 && (
        <Box sx={{ mt: 4 }}>
          {/* ── KPI Cards ── */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {statCards.map((c) => (
              <Grid size={{ xs: 12, sm: 6, md: 2.4 }} key={c.label}>
                {loading ? <StatCardSkeleton /> : (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2.5, borderRadius: 3,
                      background: c.gradient,
                      border: `1px solid ${c.color}30`,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 8px 25px ${c.color}20`,
                        borderColor: `${c.color}60`,
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {c.label}
                      </Typography>
                      <Avatar sx={{ width: 28, height: 28, bgcolor: `${c.color}18`, color: c.color }}>
                        {React.cloneElement(c.icon, { sx: { fontSize: 15 } })}
                      </Avatar>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: c.color, letterSpacing: '-0.02em', lineHeight: 1 }}>
                      {c.value}
                    </Typography>
                    <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600, display: 'block', mt: 0.5 }}>
                      {c.sub}
                    </Typography>
                  </Paper>
                )}
              </Grid>
            ))}
          </Grid>

          {/* ── Productivity Formula Banner ── */}
          <Card sx={{
            p: 2.5, mb: 4,
            border: '1px dashed',
            borderColor: 'rgba(139,92,246,0.4)',
            bgcolor: isDark ? 'rgba(139,92,246,0.04)' : 'rgba(139,92,246,0.02)',
            borderRadius: 3,
          }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <Avatar sx={{ bgcolor: 'rgba(139,92,246,0.1)', color: '#8B5CF6', width: 40, height: 40 }}>
                <FormulaIcon />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.3 }}>Productivity Formula</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Used across all charts and tables
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                <Paper variant="outlined" sx={{ px: 2.5, py: 1, borderRadius: 2, borderStyle: 'dashed', borderColor: 'rgba(139,92,246,0.4)' }}>
                  <Typography sx={{ fontWeight: 800, color: 'primary.main', fontFamily: 'ui-monospace, monospace', fontSize: '0.82rem' }}>
                    Productivity % = (Standard Time ÷ Actual Duration) × 100
                  </Typography>
                </Paper>
                {[
                  { label: '≥100%', color: '#10B981', text: 'Excellent' },
                  { label: '≥75%', color: '#3B82F6', text: 'Good' },
                  { label: '≥50%', color: '#F59E0B', text: 'Average' },
                  { label: '<50%', color: '#EF4444', text: 'Below' },
                ].map(b => (
                  <Box key={b.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: b.color }} />
                    <Typography variant="caption" sx={{ fontWeight: 700, color: b.color }}>{b.label}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{b.text}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Card>

          {/* ── Charts Row ── */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Productivity Trend */}
            <Grid size={{ xs: 12, lg: 7 }}>
              <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, height: 420, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ p: 3, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.2 }}>Productivity Trends</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {trendTab === 0 ? 'Hourly breakdown (today)' : trendTab === 1 ? 'Daily breakdown (this week)' : 'Monthly breakdown'}
                    </Typography>
                  </Box>
                  <Tabs
                    value={trendTab} onChange={(_, v) => setTrendTab(v)}
                    sx={{ minHeight: 34, '& .MuiTab-root': { py: 0.5, minHeight: 34, fontSize: '0.78rem', fontWeight: 700, textTransform: 'none', px: 2 } }}
                  >
                    <Tab label="Hourly" icon={<DailyIcon sx={{ fontSize: 14 }} />} iconPosition="start" />
                    <Tab label="Weekly" icon={<WeeklyIcon sx={{ fontSize: 14 }} />} iconPosition="start" />
                    <Tab label="Monthly" icon={<MonthlyIcon sx={{ fontSize: 14 }} />} iconPosition="start" />
                  </Tabs>
                </Box>
                <Box sx={{ flexGrow: 1, p: 2, pt: 1 }}>
                  {loading ? (
                    <Skeleton variant="rectangular" height="100%" sx={{ borderRadius: 2 }} />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      {trendTab === 0 ? (
                        <AreaChart data={trendSource} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                          <XAxis dataKey="time" tick={{ fontSize: 10, fontWeight: 600 }} />
                          <YAxis tick={{ fontSize: 10, fontWeight: 600 }} domain={[0, 120]} />
                          <ChartTooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}%`, 'Productivity']} />
                          <Area type="monotone" dataKey="productivity" name="Productivity %" stroke="#8B5CF6" strokeWidth={3} fill="url(#grad1)" dot={{ r: 3, fill: '#8B5CF6' }} />
                        </AreaChart>
                      ) : trendTab === 1 ? (
                        weeklyData.length === 0 ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                            <Typography color="text.disabled" sx={{ fontWeight: 600 }}>No weekly data from backend yet</Typography>
                          </Box>
                        ) : (
                          <LineChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                            <XAxis dataKey="label" tick={{ fontSize: 10, fontWeight: 600 }} />
                            <YAxis tick={{ fontSize: 10, fontWeight: 600 }} domain={[0, 120]} />
                            <ChartTooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}%`, 'Productivity']} />
                            <Line type="monotone" dataKey="productivity" stroke="#6366F1" strokeWidth={3.5} dot={{ r: 5, fill: '#6366F1' }} />
                          </LineChart>
                        )
                      ) : (
                        monthlyData.length === 0 ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                            <Typography color="text.disabled" sx={{ fontWeight: 600 }}>No monthly data from backend yet</Typography>
                          </Box>
                        ) : (
                          <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#EC4899" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#EC4899" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                            <XAxis dataKey="label" tick={{ fontSize: 10, fontWeight: 600 }} />
                            <YAxis tick={{ fontSize: 10, fontWeight: 600 }} domain={[0, 120]} />
                            <ChartTooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}%`, 'Productivity']} />
                            <Area type="monotone" dataKey="productivity" stroke="#EC4899" strokeWidth={3} fill="url(#grad2)" dot={{ r: 3, fill: '#EC4899' }} />
                          </AreaChart>
                        )
                      )}
                    </ResponsiveContainer>
                  )}
                </Box>
              </Card>
            </Grid>

            {/* Department Scores */}
            <Grid size={{ xs: 12, lg: 5 }}>
              <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, height: 420, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ p: 3, pb: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.2 }}>Department Productivity</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {deptData.length > 0 ? `${deptData.length} departments from live data` : 'No department data yet'}
                  </Typography>
                </Box>
                <Box sx={{ flexGrow: 1, p: 2, pt: 1 }}>
                  {loading ? (
                    <Skeleton variant="rectangular" height="100%" sx={{ borderRadius: 2 }} />
                  ) : deptData.length === 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 1 }}>
                      <DeptIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                      <Typography color="text.disabled" sx={{ fontWeight: 600 }}>No department logs yet</Typography>
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                        <XAxis dataKey="label" tick={{ fontSize: 9, fontWeight: 600 }} />
                        <YAxis tick={{ fontSize: 10, fontWeight: 600 }} domain={[0, 120]} />
                        <ChartTooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}%`, 'Productivity']} />
                        <Bar dataKey="productivity" name="Productivity %" radius={[8, 8, 0, 0]} maxBarSize={36}>
                          {deptData.map((_, i) => (
                            <Cell key={i} fill={['#8B5CF6', '#6366F1', '#3B82F6', '#10B981', '#EC4899', '#F59E0B'][i % 6]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Box>
              </Card>
            </Grid>
          </Grid>

          {/* ── Rework Analysis Chart ── */}
          <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 4, height: 320, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 3, pb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.2 }}>Completed vs Rework by Department</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Live breakdown from all activity logs
              </Typography>
            </Box>
            <Box sx={{ flexGrow: 1, p: 2, pt: 1 }}>
              {loading ? (
                <Skeleton variant="rectangular" height="100%" sx={{ borderRadius: 2 }} />
              ) : reworkData.length === 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Typography color="text.disabled" sx={{ fontWeight: 600 }}>No rework data yet</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reworkData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                    <XAxis dataKey="department" tick={{ fontSize: 10, fontWeight: 600 }} />
                    <YAxis tick={{ fontSize: 10, fontWeight: 600 }} />
                    <ChartTooltip contentStyle={tooltipStyle} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Bar dataKey="completed" name="Completed" fill="#8B5CF6" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="rework" name="Rework Cases" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Card>

          {/* ── Summary Tables ── */}
          <Grid container spacing={3}>
            {/* Top Performers */}
            <Grid size={{ xs: 12, lg: 4 }}>
              <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%' }}>
                <Box sx={{ p: 2.5, pb: 1.5, display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'rgba(16,185,129,0.1)', color: '#10B981', width: 36, height: 36 }}>
                    <TrophyIcon sx={{ fontSize: 18 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Top Performers</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Highest productivity score</Typography>
                  </Box>
                </Box>
                <CardContent sx={{ p: 2, pt: 0 }}>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={48} sx={{ borderRadius: 2, mb: 0.5 }} />)
                  ) : topPerformers.length === 0 ? (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <Typography color="text.disabled" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>No performer data yet</Typography>
                    </Box>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', py: 1, color: 'text.secondary' }}>#</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem' }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem' }}>Score</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {topPerformers.map((row, i) => (
                            <TableRow key={row.name} sx={{ '&:hover': { bgcolor: 'rgba(16,185,129,0.04)' } }}>
                              <TableCell sx={{ py: 1.2 }}>
                                <Avatar sx={{ width: 22, height: 22, fontSize: '0.7rem', fontWeight: 800, bgcolor: i === 0 ? '#F59E0B' : i === 1 ? '#94A3B8' : i === 2 ? '#CD7F32' : 'rgba(16,185,129,0.1)', color: i < 3 ? '#fff' : '#10B981' }}>
                                  {i + 1}
                                </Avatar>
                              </TableCell>
                              <TableCell sx={{ py: 1.2 }}>
                                <Typography sx={{ fontWeight: 700, fontSize: '0.8rem' }}>{row.name}</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{row.department}</Typography>
                              </TableCell>
                              <TableCell>
                                <Box>
                                  <Typography sx={{ fontWeight: 800, fontSize: '0.8rem', color: pctColor(row.score) }}>{row.score}%</Typography>
                                  <LinearProgress variant="determinate" value={Math.min(row.score, 100)} sx={{ mt: 0.3, height: 3, borderRadius: 2, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { bgcolor: pctColor(row.score) } }} />
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Lowest Performers */}
            <Grid size={{ xs: 12, lg: 4 }}>
              <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%' }}>
                <Box sx={{ p: 2.5, pb: 1.5, display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'rgba(245,158,11,0.1)', color: '#F59E0B', width: 36, height: 36 }}>
                    <PerformersIcon sx={{ fontSize: 18 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Needs Attention</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Lowest productivity score</Typography>
                  </Box>
                </Box>
                <CardContent sx={{ p: 2, pt: 0 }}>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={48} sx={{ borderRadius: 2, mb: 0.5 }} />)
                  ) : lowestPerformers.length === 0 ? (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <Typography color="text.disabled" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>No performer data yet</Typography>
                    </Box>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', py: 1, color: 'text.secondary' }}>#</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem' }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem' }}>Score</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {lowestPerformers.map((row, i) => (
                            <TableRow key={row.name} sx={{ '&:hover': { bgcolor: 'rgba(245,158,11,0.04)' } }}>
                              <TableCell sx={{ py: 1.2 }}>
                                <Avatar sx={{ width: 22, height: 22, fontSize: '0.7rem', fontWeight: 800, bgcolor: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
                                  {i + 1}
                                </Avatar>
                              </TableCell>
                              <TableCell sx={{ py: 1.2 }}>
                                <Typography sx={{ fontWeight: 700, fontSize: '0.8rem' }}>{row.name}</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{row.department}</Typography>
                              </TableCell>
                              <TableCell>
                                <Box>
                                  <Typography sx={{ fontWeight: 800, fontSize: '0.8rem', color: pctColor(row.score) }}>{row.score}%</Typography>
                                  <LinearProgress variant="determinate" value={Math.min(row.score, 100)} sx={{ mt: 0.3, height: 3, borderRadius: 2, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { bgcolor: pctColor(row.score) } }} />
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Most Rework */}
            <Grid size={{ xs: 12, lg: 4 }}>
              <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%' }}>
                <Box sx={{ p: 2.5, pb: 1.5, display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'rgba(239,68,68,0.1)', color: '#EF4444', width: 36, height: 36 }}>
                    <ReworkIcon sx={{ fontSize: 18 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Most Rework Tasks</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Activities needing rework</Typography>
                  </Box>
                </Box>
                <CardContent sx={{ p: 2, pt: 0 }}>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={48} sx={{ borderRadius: 2, mb: 0.5 }} />)
                  ) : mostRework.length === 0 ? (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <CheckIcon sx={{ fontSize: 36, color: '#10B981', mb: 1 }} />
                      <Typography color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>No rework cases! 🎉</Typography>
                      <Typography color="text.disabled" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>All activities within efficiency threshold</Typography>
                    </Box>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', py: 1, color: 'text.secondary' }}>Activity</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem' }}>Cases</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {mostRework.map((row) => (
                            <TableRow key={row.activity} sx={{ '&:hover': { bgcolor: 'rgba(239,68,68,0.04)' } }}>
                              <TableCell sx={{ py: 1.2 }}>
                                <Typography sx={{ fontWeight: 700, fontSize: '0.79rem' }}>{row.activity}</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{row.department}</Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={row.reworkCount}
                                  size="small"
                                  sx={{ fontWeight: 800, fontSize: '0.75rem', height: 22, bgcolor: 'rgba(239,68,68,0.12)', color: '#EF4444', minWidth: 32 }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* ── Recent Activity Logs Table ── */}
          {logs.length > 0 && (
            <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mt: 4 }}>
              <Box sx={{ p: 2.5, pb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>Recent Activity Logs</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Latest {Math.min(logs.length, 10)} of {logs.length} records from backend
                  </Typography>
                </Box>
                <Chip label={`${logs.length} total`} size="small" sx={{ fontWeight: 700, bgcolor: 'rgba(139,92,246,0.1)', color: '#8B5CF6' }} />
              </Box>
              <CardContent sx={{ p: 2, pt: 0 }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)' }}>
                      <TableRow>
                        {['Worker', 'SO Number', 'Department', 'Activity', 'Duration', 'Productivity', 'Worker Remark', 'Manager Review', 'Actions'].map(h => (
                          <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.75rem', py: 1.2 }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {logs.slice(0, 10).map((log) => {
                        const pct = log.durationMinutes > 0 ? Math.round((log.standardManMinutes / log.durationMinutes) * 100) : null;
                        return (
                          <TableRow key={log.id} sx={{ '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' } }}>
                            <TableCell sx={{ py: 1.2, fontWeight: 700, fontSize: '0.82rem' }}>{log.workerName}</TableCell>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'primary.main', fontWeight: 700 }}>{log.soNumber}</TableCell>
                            <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600 }}>{log.department}</TableCell>
                            <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{log.activity}</TableCell>
                            <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600 }}>{log.durationMinutes} min</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography sx={{ fontWeight: 800, fontSize: '0.8rem', color: pctColor(pct) }}>
                                  {pct !== null ? `${pct}%` : '--'}
                                </Typography>
                                {pct !== null && (
                                  <LinearProgress variant="determinate" value={Math.min(pct, 100)} sx={{ flex: 1, height: 4, borderRadius: 2, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { bgcolor: pctColor(pct) } }} />
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              {log.remarks ? (
                                <Tooltip title={log.remarks}>
                                  <Typography variant="body2" sx={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'text.secondary', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {log.remarks}
                                  </Typography>
                                </Tooltip>
                              ) : (
                                <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.disabled', fontStyle: 'italic' }}>
                                  No remark
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                {log.isRework && (
                                  <Chip
                                    label={`Rework: ${log.reworkAssignedToName || 'Unassigned'}`}
                                    color="error"
                                    size="small"
                                    sx={{ fontWeight: 800, fontSize: '0.7rem', height: 20, width: 'fit-content' }}
                                  />
                                )}
                                {log.managerRemarks ? (
                                  <Tooltip title={log.managerRemarks}>
                                    <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 650, color: 'text.primary', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {log.managerRemarks}
                                    </Typography>
                                  </Tooltip>
                                ) : (
                                  !log.isRework && (
                                    <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.disabled', fontStyle: 'italic' }}>
                                      Not reviewed
                                    </Typography>
                                  )
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Tooltip title="Review Activity Log">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => {
                                    setSelectedReviewLog(log);
                                    setManagerRemarksInput(log.managerRemarks || '');
                                    setIsReworkInput(log.isRework || false);
                                    setReworkAssignedToIdInput(log.reworkAssignedToId || '');
                                    setReviewModalOpen(true);
                                  }}
                                  sx={{
                                    border: '1px solid',
                                    borderColor: 'primary.light',
                                    borderRadius: 2,
                                    '&:hover': { bgcolor: 'rgba(139,92,246,0.08)' },
                                  }}
                                >
                                  <ReviewIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {/* ══════════════════════════════════════ TAB 1 — INDIVIDUAL EMPLOYEE ═══════════════════════════ */}
      {mainTab === 1 && (
        <Box sx={{ mt: 4 }}>
          <Grid container spacing={3}>
            {/* Left: Employee Selector */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 3, height: '100%' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5 }}>Select Employee</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 2 }}>
                  {displayUsers.length} users loaded from backend
                </Typography>

                <TextField
                  fullWidth size="small"
                  placeholder="Search by name, ID, or role…"
                  value={empSearch}
                  onChange={(e) => setEmpSearch(e.target.value)}
                  sx={{ mb: 2 }}
                  slotProps={{
                    input: {
                      startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 17, color: 'text.secondary' }} /></InputAdornment>,
                      sx: { borderRadius: 3, bgcolor: 'background.default' },
                    },
                  }}
                />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 440, overflowY: 'auto', pr: 0.5 }}>
                  {filteredUsers.length === 0 ? (
                    <Typography variant="body2" color="text.disabled" sx={{ fontWeight: 600, textAlign: 'center', py: 4 }}>
                      {loading ? 'Loading users…' : 'No employees found.'}
                    </Typography>
                  ) : filteredUsers.map((u) => (
                    <Paper
                      key={u.userId}
                      variant="outlined"
                      onClick={() => setSelectedEmpId(u.userId)}
                      sx={{
                        p: 1.5, borderRadius: 3, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 1.5,
                        borderColor: selectedEmpId === u.userId ? '#8B5CF6' : 'divider',
                        bgcolor: selectedEmpId === u.userId ? 'rgba(139,92,246,0.06)' : 'transparent',
                        transition: 'all 0.15s',
                        '&:hover': { borderColor: '#8B5CF6', bgcolor: 'rgba(139,92,246,0.04)' },
                      }}
                    >
                      <Avatar sx={{ width: 36, height: 36, fontWeight: 'bold', fontSize: '0.9rem', bgcolor: selectedEmpId === u.userId ? 'rgba(139,92,246,0.15)' : 'action.hover', color: selectedEmpId === u.userId ? '#8B5CF6' : 'text.primary' }}>
                        {u.adminName.charAt(0)}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.adminName}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{u.role} · {u.userId}</Typography>
                      </Box>
                      {selectedEmpId === u.userId && <CheckIcon sx={{ fontSize: 16, color: '#8B5CF6', flexShrink: 0 }} />}
                    </Paper>
                  ))}
                </Box>
              </Card>
            </Grid>

            {/* Right: Report */}
            <Grid size={{ xs: 12, md: 8 }}>
              {!selectedUser ? (
                <Paper variant="outlined" sx={{ borderRadius: 3, py: 12, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                  <PersonIcon sx={{ fontSize: 60, color: 'text.disabled' }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.secondary' }}>Select an Employee</Typography>
                  <Typography variant="body2" color="text.disabled" sx={{ fontWeight: 600 }}>
                    Choose a Worker or Technician from the left panel.
                  </Typography>
                </Paper>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Profile Card */}
                  <Card sx={{ p: 3, border: '1px solid', borderColor: '#8B5CF6', borderRadius: 3, background: 'linear-gradient(135deg, rgba(139,92,246,0.07) 0%, rgba(124,58,237,0.03) 100%)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 2 }}>
                      <Avatar sx={{ width: 64, height: 64, fontSize: '1.5rem', fontWeight: 'bold', bgcolor: 'rgba(139,92,246,0.15)', color: '#8B5CF6', border: '2px solid rgba(139,92,246,0.3)' }}>
                        {selectedUser.adminName.charAt(0)}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>{selectedUser.adminName}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                          {selectedUser.role} · ID: {selectedUser.userId}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                          <Chip label={selectedUser.status} size="small" sx={{ fontWeight: 800, fontSize: '0.72rem', height: 20, bgcolor: selectedUser.status === 'Working' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', color: selectedUser.status === 'Working' ? '#10B981' : '#F59E0B' }} />
                          <Chip label={`${empLogs.length} logs in backend`} size="small" sx={{ fontWeight: 700, fontSize: '0.72rem', height: 20, bgcolor: 'rgba(139,92,246,0.1)', color: '#8B5CF6' }} />
                        </Box>
                      </Box>
                      <Button
                        variant="contained" startIcon={<PdfIcon />}
                        onClick={downloadEmployeePDF}
                        sx={{ borderRadius: 3, fontWeight: 700, background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)', boxShadow: '0 4px 14px rgba(139,92,246,0.3)' }}
                      >
                        Download PDF
                      </Button>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={1.5}>
                      {[
                        { label: 'Email', value: selectedUser.email || '--' },
                        { label: 'Mobile', value: selectedUser.mobile || '--' },
                      ].map((f) => (
                        <Grid size={{ xs: 12, sm: 6 }} key={f.label}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>{f.label}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{f.value}</Typography>
                        </Grid>
                      ))}
                    </Grid>
                  </Card>

                  {/* Metrics */}
                  <Grid container spacing={2}>
                    {[
                      { label: 'Total Activities', value: empActivities.length, color: '#8B5CF6', icon: <DeptIcon /> },
                      { label: 'Completed', value: empCompleted.length, color: '#10B981', icon: <CheckIcon /> },
                      { label: 'Running', value: empRunning.length, color: '#3B82F6', icon: <TimeIcon /> },
                      { label: 'Avg Productivity', value: empAvgPct !== null ? `${empAvgPct}%` : '--', color: pctColor(empAvgPct), icon: <TrendIcon /> },
                    ].map((m) => (
                      <Grid size={{ xs: 6, md: 3 }} key={m.label}>
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, textAlign: 'center', border: `1px solid ${m.color}30`, background: `linear-gradient(135deg, ${m.color}12 0%, ${m.color}04 100%)`, transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 6px 20px ${m.color}20` } }}>
                          <Avatar sx={{ mx: 'auto', mb: 1, width: 36, height: 36, bgcolor: `${m.color}18`, color: m.color }}>
                            {React.cloneElement(m.icon, { sx: { fontSize: 18 } })}
                          </Avatar>
                          <Typography variant="h6" sx={{ fontWeight: 900, color: m.color }}>{m.value}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>{m.label}</Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>

                  {/* Activity Table */}
                  <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <Box sx={{ p: 2.5, pb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Activity History</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          All activities for {selectedUser.adminName} · {empActivities.length} records
                        </Typography>
                      </Box>
                      {empLogs.length > 0 && (
                        <Chip label={`${empLogs.length} from backend`} size="small" sx={{ fontWeight: 700, bgcolor: 'rgba(16,185,129,0.1)', color: '#10B981' }} />
                      )}
                    </Box>
                    <CardContent sx={{ p: 2, pt: 0 }}>
                      <TableContainer>
                        <Table size="small">
                          <TableHead sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)' }}>
                            <TableRow>
                              {['Activity', 'Code', 'Std Time', 'Actual', 'Productivity', 'Status', 'Worker Remark', 'Manager Review', 'Actions'].map(h => (
                                <TableCell key={h} sx={{ fontWeight: 700, py: 1.3, fontSize: '0.77rem' }}>{h}</TableCell>
                              ))}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {empActivities.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                                  <PersonIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
                                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>No activities yet</Typography>
                                </TableCell>
                              </TableRow>
                            ) : (
                              empActivities.map((a) => {
                                const pct = calcPct(a.standardTime, a.actualDuration);
                                const statusStyles: Record<string, { bg: string; color: string }> = {
                                  Running: { bg: 'rgba(16,185,129,0.1)', color: '#10B981' },
                                  Completed: { bg: 'rgba(59,130,246,0.1)', color: '#3B82F6' },
                                  Assigned: { bg: 'rgba(245,158,11,0.1)', color: '#F59E0B' },
                                  Pending: { bg: 'rgba(148,163,184,0.1)', color: '#94A3B8' },
                                };
                                const sty = statusStyles[a.status] || statusStyles.Pending;
                                return (
                                  <TableRow key={a.id} sx={{ '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' } }}>
                                    <TableCell sx={{ py: 1.3, fontWeight: 700, fontSize: '0.82rem' }}>{a.name}</TableCell>
                                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'primary.main', fontWeight: 700 }}>{a.code}</TableCell>
                                    <TableCell sx={{ fontWeight: 600, fontSize: '0.82rem' }}>{a.standardTime}</TableCell>
                                    <TableCell sx={{ fontWeight: 600, fontSize: '0.82rem', color: 'text.secondary' }}>{a.actualDuration || '--'}</TableCell>
                                    <TableCell>
                                      <Typography variant="body2" sx={{ fontWeight: 800, color: pctColor(pct) }}>{fmtPct(pct)}</Typography>
                                      {pct !== null && (
                                        <LinearProgress variant="determinate" value={Math.min(pct, 100)} sx={{ mt: 0.3, height: 3, borderRadius: 2, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { bgcolor: pctColor(pct) } }} />
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <Chip label={a.status} size="small" sx={{ fontWeight: 800, fontSize: '0.74rem', bgcolor: sty.bg, color: sty.color }} />
                                    </TableCell>
                                    <TableCell>
                                      {a.remarks ? (
                                        <Tooltip title={a.remarks}>
                                          <Typography variant="body2" sx={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'text.secondary', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {a.remarks}
                                          </Typography>
                                        </Tooltip>
                                      ) : (
                                        <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.disabled', fontStyle: 'italic' }}>
                                          No remark
                                        </Typography>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                        {a.isRework && (
                                          <Chip
                                            label={`Rework: ${a.reworkAssignedToName || 'Unassigned'}`}
                                            color="error"
                                            size="small"
                                            sx={{ fontWeight: 800, fontSize: '0.7rem', height: 20, width: 'fit-content' }}
                                          />
                                        )}
                                        {a.managerRemarks ? (
                                          <Tooltip title={a.managerRemarks}>
                                            <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 650, color: 'text.primary', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                              {a.managerRemarks}
                                            </Typography>
                                          </Tooltip>
                                        ) : (
                                          !a.isRework && a.rawLog && (
                                            <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.disabled', fontStyle: 'italic' }}>
                                              Not reviewed
                                            </Typography>
                                          )
                                        )}
                                      </Box>
                                    </TableCell>
                                    <TableCell>
                                      {a.rawLog ? (
                                        <Tooltip title="Review Activity Log">
                                          <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={() => {
                                              const log = a.rawLog;
                                              setSelectedReviewLog(log);
                                              setManagerRemarksInput(log.managerRemarks || '');
                                              setIsReworkInput(log.isRework || false);
                                              setReworkAssignedToIdInput(log.reworkAssignedToId || '');
                                              setReviewModalOpen(true);
                                            }}
                                            sx={{
                                              border: '1px solid',
                                              borderColor: 'primary.light',
                                              borderRadius: 2,
                                              '&:hover': { bgcolor: 'rgba(139,92,246,0.08)' },
                                            }}
                                          >
                                            <ReviewIcon sx={{ fontSize: 16 }} />
                                          </IconButton>
                                        </Tooltip>
                                      ) : (
                                        <Typography variant="caption" color="text.disabled">N/A</Typography>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Box>
              )}
            </Grid>
          </Grid>
        </Box>
      )}
      {/* ── Log Review & Rework Assignment Dialog ── */}
      <Dialog
        open={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: 4, px: 2, py: 1 },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ReviewIcon color="primary" />
          Review Workforce Activity Log
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {selectedReviewLog && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
              {/* Activity Details Summary */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: 'action.hover' }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Worker Name</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>{selectedReviewLog.workerName}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Sales Order</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>{selectedReviewLog.soNumber}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Activity</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 750 }}>{selectedReviewLog.activity}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Productivity</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: pctColor(selectedReviewLog.durationMinutes > 0 ? Math.round((selectedReviewLog.standardManMinutes / selectedReviewLog.durationMinutes) * 100) : null) }}>
                      {selectedReviewLog.durationMinutes > 0 ? `${Math.round((selectedReviewLog.standardManMinutes / selectedReviewLog.durationMinutes) * 100)}%` : '--'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Worker Remarks */}
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                  Worker Remarks (Submitted at log completion)
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, borderStyle: 'dashed' }}>
                  <Typography variant="body2" sx={{ fontStyle: 'italic', fontWeight: 600, color: selectedReviewLog.remarks ? 'text.primary' : 'text.disabled' }}>
                    {selectedReviewLog.remarks ? `"${selectedReviewLog.remarks}"` : 'No remarks submitted by the worker.'}
                  </Typography>
                </Paper>
              </Box>

              {/* Manager Remarks */}
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Manager Review Remarks"
                placeholder="Type your observations, instructions, or approval notes..."
                value={managerRemarksInput}
                onChange={(e) => setManagerRemarksInput(e.target.value)}
                slotProps={{ input: { sx: { borderRadius: 3, fontWeight: 600 } } }}
              />

              {/* Rework Toggles */}
              <Box sx={{ border: '1px solid', borderColor: 'divider', p: 2, borderRadius: 3 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isReworkInput}
                      onChange={(e) => setIsReworkInput(e.target.checked)}
                      color="error"
                    />
                  }
                  label={
                    <Box>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: isReworkInput ? 'error.main' : 'text.primary' }}>
                        Assign as Rework Case
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                        Flag this activity log as failing efficiency or quality criteria and assign to worker to redo.
                      </Typography>
                    </Box>
                  }
                />

                {isReworkInput && (
                  <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel id="rework-worker-select-label" sx={{ fontWeight: 600 }}>Assign Rework To</InputLabel>
                    <Select
                      labelId="rework-worker-select-label"
                      value={reworkAssignedToIdInput}
                      onChange={(e) => setReworkAssignedToIdInput(e.target.value)}
                      label="Assign Rework To"
                      sx={{ borderRadius: 3, fontWeight: 700 }}
                    >
                      {(() => {
                        const allUsers = liveUsers.length > 0 ? liveUsers : users;
                        return allUsers.map((u: any) => (
                          <MenuItem key={u.id} value={u.id} sx={{ fontWeight: 600 }}>
                            {u.adminName} ({u.userId}) · {u.role}
                          </MenuItem>
                        ));
                      })()}
                    </Select>
                  </FormControl>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ pb: 3, px: 3, mt: 1, gap: 1 }}>
          <Button onClick={() => setReviewModalOpen(false)} sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveReview}
            variant="contained"
            disabled={refreshing}
            sx={{
              fontWeight: 800,
              borderRadius: 2.5,
              px: 3.5,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
              boxShadow: '0 4px 14px rgba(139,92,246,0.3)',
            }}
          >
            {refreshing ? 'Saving…' : 'Save Review'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
