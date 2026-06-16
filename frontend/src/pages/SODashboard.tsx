import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { SalesOrder, Department } from '../context/AppContext';
import {
  Grid,
  Card,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  TextField,
  MenuItem,
  InputAdornment,
  Divider,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  PictureAsPdf as PdfIcon,
  GridOn as ExcelIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  FileDownload as ExportIcon,
  CalendarToday as CalendarIcon,
  Business as BuildingIcon,
  Assignment as AssignIcon,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const today = new Date().toISOString().split('T')[0];

function getSoStatus(so: SalesOrder): string {
  if (so.isActive === false) return 'Inactive';
  const logs = (so as any)._logsCount || 0;
  const total = so.allowedActivities?.length || 0;
  if (total > 0 && logs >= total) return 'Completed';
  if (so.endDate && so.endDate < today) return 'Delayed';
  return 'Active';
}

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  Active:    { bg: 'rgba(16,185,129,0.10)',  color: '#10B981', border: 'rgba(16,185,129,0.30)' },
  Inactive:  { bg: 'rgba(107,114,128,0.10)', color: '#9CA3AF', border: 'rgba(107,114,128,0.25)' },
  Completed: { bg: 'rgba(37,99,235,0.10)',   color: '#2563EB', border: 'rgba(37,99,235,0.30)' },
  Delayed:   { bg: 'rgba(239,68,68,0.10)',   color: '#EF4444', border: 'rgba(239,68,68,0.30)' },
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const SODashboard: React.FC = () => {
  const { soNumber } = useParams<{ soNumber: string }>();
  const navigate = useNavigate();
  const { salesOrders, activityLogs, departments, themeMode, user } = useApp();

  // Resolve selected SO for Dept/Emp tabs
  let selectedSO = salesOrders.find(s => s.soNumber.toLowerCase() === (soNumber || '').toLowerCase());
  if (!selectedSO && salesOrders.length > 0) selectedSO = salesOrders[0];

  const [dashboardTab, setDashboardTab] = useState(0);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  // Summary tab filters
  const [summaryStatusFilter, setSummaryStatusFilter] = useState('All');

  // Dept / Emp tab filters
  const [periodFilter, setPeriodFilter] = useState('Monthly');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // ─── SO-level computed metrics helper ────────────────────────────────────────
  const getSOMetrics = (so: SalesOrder, allDepts: Department[]) => {
    const soLogs = activityLogs.filter((l: any) => {
      const logSO = l.soNumber || l.SalesOrder?.soNumber || '';
      return logSO === so.soNumber;
    });

    const allowedDepts = so.allowedDepartments || allDepts.filter(d => d.status === 'Active').map(d => d.name);
    const allowedActs = so.allowedActivities || [];
    const totalActivities = allowedActs.length;

    const completedActNames = new Set(soLogs.map((l: any) => l.activity?.activityName || l.activity || ''));
    const completedActivities = allowedActs.filter(a => completedActNames.has(a)).length;

    const actualHours = Math.round(soLogs.reduce((s: number, l: any) => s + (l.durationMinutes || 0), 0) / 60 * 10) / 10;

    // Ideal hours = sum of standard minutes for all allowed activities / 60
    const allDeptActs = allDepts.flatMap(d => (d.activities || []).map(a => ({ ...a, deptName: d.name })));
    const idealMinutes = allowedActs.reduce((sum, actName) => {
      const act = allDeptActs.find(a => a.name === actName);
      return sum + (act?.standardMinutes || 0);
    }, 0);
    const idealHours = Math.round(idealMinutes / 60 * 10) / 10;

    const productivity = idealHours > 0 && actualHours > 0
      ? Math.min(Math.round((idealHours / actualHours) * 100), 999)
      : 0;

    const uniqueEmps = new Set(soLogs.map((l: any) => l.userId || l.user?.id || '').filter(Boolean));

    const reworkCount = soLogs.filter((l: any) => (l.remarks || '').toLowerCase().includes('rework')).length;
    const status = getSoStatus(so);

    return {
      soLogs,
      allowedDepts,
      totalActivities,
      completedActivities,
      progressPct: totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0,
      actualHours,
      idealHours,
      productivity,
      totalEmployees: uniqueEmps.size,
      reworkCount,
      status,
    };
  };

  // ─── Summary Table Data (ALL SOs) ────────────────────────────────────────────
  const allSOMetrics = useMemo(() =>
    salesOrders.map(so => ({ so, ...getSOMetrics(so, departments) })),
    [salesOrders, activityLogs, departments]
  );

  const filteredSOMetrics = useMemo(() => {
    if (summaryStatusFilter === 'All') return allSOMetrics;
    return allSOMetrics.filter(m => m.status === summaryStatusFilter);
  }, [allSOMetrics, summaryStatusFilter]);

  // Summary totals
  const summaryTotals = useMemo(() => ({
    totalSOs: salesOrders.length,
    activeSOs: allSOMetrics.filter(m => m.status === 'Active').length,
    inactiveSOs: allSOMetrics.filter(m => m.status === 'Inactive').length,
    completedSOs: allSOMetrics.filter(m => m.status === 'Completed').length,
    delayedSOs: allSOMetrics.filter(m => m.status === 'Delayed').length,
    totalEmployees: new Set(activityLogs.map((l: any) => l.userId || '').filter(Boolean)).size,
    totalActivities: allSOMetrics.reduce((s, m) => s + m.totalActivities, 0),
    totalActualHours: Math.round(allSOMetrics.reduce((s, m) => s + m.actualHours, 0) * 10) / 10,
    totalIdealHours: Math.round(allSOMetrics.reduce((s, m) => s + m.idealHours, 0) * 10) / 10,
    avgProductivity: allSOMetrics.length > 0
      ? Math.round(allSOMetrics.reduce((s, m) => s + m.productivity, 0) / allSOMetrics.length)
      : 0,
  }), [allSOMetrics, activityLogs, salesOrders]);

  // ─── Selected SO metrics for Dept / Emp tabs ─────────────────────────────────
  const selMetrics = useMemo(() =>
    selectedSO ? getSOMetrics(selectedSO, departments) : null,
    [selectedSO, activityLogs, departments]
  );

  // Dept breakdown for selected SO
  const deptMetrics = useMemo(() => {
    if (!selectedSO || !selMetrics) return [];
    return departments
      .filter(d => d.status === 'Active')
      .map(dept => {
        const deptLogs = selMetrics.soLogs.filter((l: any) => (l.department?.name || l.department || '') === dept.name);
        const deptActs = (dept.activities || []).filter(a => a.status === 'Active');
        const completedNames = new Set(deptLogs.map((l: any) => l.activity?.activityName || l.activity || ''));
        const completed = deptActs.filter(a => completedNames.has(a.name)).length;
        const hours = Math.round(deptLogs.reduce((s: number, l: any) => s + (l.durationMinutes || 0), 0) / 60 * 10) / 10;
        const idealMin = deptActs.reduce((s, a) => s + (a.standardMinutes || 0), 0);
        const idealH = Math.round(idealMin / 60 * 10) / 10;
        const rework = deptLogs.filter((l: any) => (l.remarks || '').toLowerCase().includes('rework')).length;
        const progress = deptActs.length > 0 ? Math.round((completed / deptActs.length) * 100) : 0;
        return { department: dept.name, totalActivities: deptActs.length, completedActivities: completed, progress, hours, idealHours: idealH, rework };
      });
  }, [selectedSO, selMetrics, departments]);

  // Employee breakdown for selected SO
  type EmpRec = { employeeId: string; name: string; activities: number; actualHours: number; rework: number; depts: Set<string> };
  const employeeMetrics = useMemo(() => {
    if (!selMetrics) return [];
    const map = new Map<string, EmpRec>();
    selMetrics.soLogs.forEach((l: any) => {
      const id = l.userId || l.user?.id || 'Unknown';
      const name = l.user ? `${l.user.firstName || ''} ${l.user.lastName || ''}`.trim() : (l.workerName || id);
      const dept = l.department?.name || l.department || '';
      if (!map.has(id)) map.set(id, { employeeId: id, name, activities: 0, actualHours: 0, rework: 0, depts: new Set() });
      const e = map.get(id)!;
      e.activities += 1;
      e.actualHours += (l.durationMinutes || 0) / 60;
      if ((l.remarks || '').toLowerCase().includes('rework')) e.rework += 1;
      if (dept) e.depts.add(dept);
    });
    return Array.from(map.values()).map(e => ({ ...e, actualHours: Math.round(e.actualHours * 10) / 10, depts: Array.from(e.depts).join(', ') }));
  }, [selMetrics]);

  // Map of activity standardMinutes by department and name
  const activityIdealMinutesMap = useMemo(() => {
    const map = new Map<string, number>();
    departments.forEach(d => {
      (d.activities || []).forEach(a => {
        map.set(`${d.name}::${a.name}`, a.standardMinutes || 0);
      });
    });
    return map;
  }, [departments]);

  // Helper to determine log ideal minutes
  const getLogIdealMinutes = (log: any) => {
    const deptName = log.department?.name || log.department || '';
    const actName = log.activity?.activityName || log.activity || '';
    if (log.standardManMinutes && log.standardManMinutes > 0) {
      return log.standardManMinutes;
    }
    return activityIdealMinutesMap.get(`${deptName}::${actName}`) || 0;
  };

  // ─── Department-wise report detailed computation ────────────────────────────
  const deptReportData = useMemo(() => {
    if (!selectedSO || !selMetrics) return { details: [], summary: [], overall: null };

    // Group logs by (department, activity)
    const detailMap = new Map<string, {
      department: string;
      activity: string;
      actualHours: number;
      idealHours: number;
      users: Set<string>;
      reworkCount: number;
      reworkHours: number;
    }>();

    selMetrics.soLogs.forEach((l: any) => {
      const deptName = l.department?.name || l.department || 'Unknown';
      const actName = l.activity?.activityName || l.activity || 'Unknown';
      const key = `${deptName}::${actName}`;

      const actualMins = l.durationMinutes || 0;
      const idealMins = getLogIdealMinutes(l);
      const isRework = (l.remarks || '').toLowerCase().includes('rework');
      const userId = l.userId || l.user?.id || l.workerName || 'Unknown';

      if (!detailMap.has(key)) {
        detailMap.set(key, {
          department: deptName,
          activity: actName,
          actualHours: 0,
          idealHours: 0,
          users: new Set<string>(),
          reworkCount: 0,
          reworkHours: 0,
        });
      }

      const item = detailMap.get(key)!;
      item.actualHours += actualMins / 60;
      item.idealHours += idealMins / 60;
      item.users.add(userId);
      if (isRework) {
        item.reworkCount += 1;
        item.reworkHours += actualMins / 60;
      }
    });

    const details = Array.from(detailMap.values()).map(d => {
      const actualHours = Math.round(d.actualHours * 10) / 10;
      const idealHours = Math.round(d.idealHours * 10) / 10;
      const reworkHours = Math.round(d.reworkHours * 10) / 10;
      const productivity = actualHours > 0 ? Math.round((idealHours / actualHours) * 100) : 0;
      return {
        department: d.department,
        activity: d.activity,
        actualHours,
        idealHours,
        usersWorked: d.users.size,
        reworkCount: d.reworkCount,
        reworkHours,
        productivity,
      };
    });

    // Group details by department to construct Department Summary
    const summaryMap = new Map<string, {
      department: string;
      totalActivities: number;
      totalUsers: number;
      actualHours: number;
      idealHours: number;
      reworkCount: number;
      reworkHours: number;
    }>();

    details.forEach(d => {
      const deptName = d.department;
      if (!summaryMap.has(deptName)) {
        summaryMap.set(deptName, {
          department: deptName,
          totalActivities: 0,
          totalUsers: 0,
          actualHours: 0,
          idealHours: 0,
          reworkCount: 0,
          reworkHours: 0,
        });
      }
      const item = summaryMap.get(deptName)!;
      item.totalActivities += 1;
      item.totalUsers += d.usersWorked;
      item.actualHours += d.actualHours;
      item.idealHours += d.idealHours;
      item.reworkCount += d.reworkCount;
      item.reworkHours += d.reworkHours;
    });

    const summary = Array.from(summaryMap.values()).map(s => {
      const actualHours = Math.round(s.actualHours * 10) / 10;
      const idealHours = Math.round(s.idealHours * 10) / 10;
      const reworkHours = Math.round(s.reworkHours * 10) / 10;
      const productivity = actualHours > 0 ? Math.round((idealHours / actualHours) * 100) : 0;
      return {
        department: s.department,
        totalActivities: s.totalActivities,
        totalUsers: s.totalUsers,
        actualHours,
        idealHours,
        reworkCount: s.reworkCount,
        reworkHours,
        productivity,
      };
    });

    // Overall SO Summary
    const overallTotalDeps = summary.length;
    const overallTotalActs = summary.reduce((sum, s) => sum + s.totalActivities, 0);
    const overallTotalUsers = summary.reduce((sum, s) => sum + s.totalUsers, 0);
    const overallActualHours = Math.round(summary.reduce((sum, s) => sum + s.actualHours, 0) * 10) / 10;
    const overallIdealHours = Math.round(summary.reduce((sum, s) => sum + s.idealHours, 0) * 10) / 10;
    const overallReworkCount = summary.reduce((sum, s) => sum + s.reworkCount, 0);
    const overallReworkHours = Math.round(summary.reduce((sum, s) => sum + s.reworkHours, 0) * 10) / 10;
    const overallProductivity = overallActualHours > 0 ? Math.round((overallIdealHours / overallActualHours) * 100) : 0;

    const overall = {
      totalDepartments: overallTotalDeps,
      totalActivities: overallTotalActs,
      totalUsers: overallTotalUsers,
      actualHours: overallActualHours,
      idealHours: overallIdealHours,
      reworkCount: overallReworkCount,
      reworkHours: overallReworkHours,
      productivity: overallProductivity,
    };

    return { details, summary, overall };
  }, [selectedSO, selMetrics, activityIdealMinutesMap]);

  // ─── Employee-wise report detailed computation ──────────────────────────────
  const empReportData = useMemo(() => {
    if (!selectedSO || !selMetrics) return { details: [], summary: [], overall: null };

    // Group logs by (employeeId, department, activity)
    const detailMap = new Map<string, {
      employeeId: string;
      name: string;
      department: string;
      activity: string;
      actualHours: number;
      idealHours: number;
    }>();

    selMetrics.soLogs.forEach((l: any) => {
      const id = l.userId || l.user?.id || 'Unknown';
      const name = l.user ? `${l.user.firstName || ''} ${l.user.lastName || ''}`.trim() : (l.workerName || id);
      const deptName = l.department?.name || l.department || 'Unknown';
      const actName = l.activity?.activityName || l.activity || 'Unknown';
      const key = `${id}::${deptName}::${actName}`;

      const actualMins = l.durationMinutes || 0;
      // Get ideal minutes
      let idealMins = l.standardManMinutes || 0;
      if (idealMins <= 0) {
        idealMins = activityIdealMinutesMap.get(`${deptName}::${actName}`) || 0;
      }

      if (!detailMap.has(key)) {
        detailMap.set(key, {
          employeeId: id,
          name,
          department: deptName,
          activity: actName,
          actualHours: 0,
          idealHours: 0,
        });
      }

      const item = detailMap.get(key)!;
      item.actualHours += actualMins / 60;
      item.idealHours += idealMins / 60;
    });

    const details = Array.from(detailMap.values()).map(d => {
      const actualHours = Math.round(d.actualHours * 10) / 10;
      const idealHours = Math.round(d.idealHours * 10) / 10;
      const productivity = actualHours > 0 ? Math.round((idealHours / actualHours) * 100) : 0;
      return {
        employeeId: d.employeeId,
        name: d.name,
        department: d.department,
        activity: d.activity,
        actualHours,
        idealHours,
        productivity,
      };
    });

    // Group logs by (employeeId, department) for Employee Summary
    const summaryMap = new Map<string, {
      employeeId: string;
      name: string;
      department: string;
      totalActivities: number;
      actualHours: number;
      idealHours: number;
    }>();

    selMetrics.soLogs.forEach((l: any) => {
      const id = l.userId || l.user?.id || 'Unknown';
      const name = l.user ? `${l.user.firstName || ''} ${l.user.lastName || ''}`.trim() : (l.workerName || id);
      const deptName = l.department?.name || l.department || 'Unknown';
      const actName = l.activity?.activityName || l.activity || 'Unknown';
      const key = `${id}::${deptName}`;

      const actualMins = l.durationMinutes || 0;
      let idealMins = l.standardManMinutes || 0;
      if (idealMins <= 0) {
        idealMins = activityIdealMinutesMap.get(`${deptName}::${actName}`) || 0;
      }

      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          employeeId: id,
          name,
          department: deptName,
          totalActivities: 0,
          actualHours: 0,
          idealHours: 0,
        });
      }

      const item = summaryMap.get(key)!;
      item.totalActivities += 1;
      item.actualHours += actualMins / 60;
      item.idealHours += idealMins / 60;
    });

    const summary = Array.from(summaryMap.values()).map(s => {
      const actualHours = Math.round(s.actualHours * 10) / 10;
      const idealHours = Math.round(s.idealHours * 10) / 10;
      const productivity = actualHours > 0 ? Math.round((idealHours / actualHours) * 100) : 0;
      return {
        employeeId: s.employeeId,
        name: s.name,
        department: s.department,
        totalActivities: s.totalActivities,
        actualHours,
        idealHours,
        productivity,
      };
    });

    // Overall SO Summary (Employee-wise)
    const uniqueEmployees = new Set(selMetrics.soLogs.map((l: any) => l.userId || l.user?.id || 'Unknown'));
    const overallTotalEmployees = uniqueEmployees.size;
    const overallTotalActivities = selMetrics.soLogs.length;
    const overallActualHours = Math.round(selMetrics.soLogs.reduce((sum: number, l: any) => sum + (l.durationMinutes || 0), 0) / 60 * 10) / 10;
    
    // Ideal hours sum
    const overallIdealMinutes = selMetrics.soLogs.reduce((sum: number, l: any) => {
      let idealMins = l.standardManMinutes || 0;
      if (idealMins <= 0) {
        const deptName = l.department?.name || l.department || 'Unknown';
        const actName = l.activity?.activityName || l.activity || 'Unknown';
        idealMins = activityIdealMinutesMap.get(`${deptName}::${actName}`) || 0;
      }
      return sum + idealMins;
    }, 0);
    const overallIdealHours = Math.round(overallIdealMinutes / 60 * 10) / 10;
    
    const overallProductivity = overallActualHours > 0 ? Math.round((overallIdealHours / overallActualHours) * 100) : 0;

    const overall = {
      totalEmployees: overallTotalEmployees,
      totalActivities: overallTotalActivities,
      actualHours: overallActualHours,
      idealHours: overallIdealHours,
      productivity: overallProductivity,
    };

    return { details, summary, overall };
  }, [selectedSO, selMetrics, activityIdealMinutesMap]);

  // ─── Snackbar helper ─────────────────────────────────────────────────────────
  const notify = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Helper: download then open (for Excel & PDF) – saves with proper name and attempts to open in new tab
  const triggerDownloadAndOpen = (blob: Blob, filename: string) => {
    // Trigger download with correct filename
    saveAs(blob, filename);
    // Open blob in new tab (PDF will display, Excel may prompt download)
    const url = URL.createObjectURL(blob);
    const newTab = window.open(url, '_blank');
    if (!newTab) {
      // Pop‑up blocked – download already triggered
    }
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  // ── PDF: output as blob URL and open in new tab — opens immediately in browser PDF viewer
  const savePDF = (doc: import('jspdf').jsPDF, filename: string) => {
    const blob = doc.output('blob');
    triggerDownloadAndOpen(blob, filename);
  };

  // ─── XLSX Export ─────────────────────────────────────────────────────────────
  const saveXLSX = (wb: XLSX.WorkBook, filename: string) => {
    // Write workbook to binary array and create Blob
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    triggerDownloadAndOpen(blob, filename);
  };
  const handleSummaryXLSX = () => {
    try {
      const wb = XLSX.utils.book_new();
      const now = new Date().toLocaleString('en-IN');
      const generatedBy = user?.name || 'Admin';

      // Header rows
      const headerRows: any[][] = [
        ['GAMECHANGE BOS'],
        ['SO SUMMARY REPORT'],
        [],
        ['Generated By', generatedBy],
        ['Generated On', now],
        [],
        ['SO No', 'Customer Name', 'Start Date', 'End Date', 'Departments Involved', 'Total Employees', 'Total Activities', 'Actual Hours', 'Ideal Hours', 'Productivity %', 'Status'],
      ];

      // Data rows
      const dataRows = filteredSOMetrics.map(m => [
        m.so.soNumber,
        m.so.customerName,
        m.so.startDate,
        m.so.endDate,
        (m.so.allowedDepartments || []).length || departments.filter(d => d.status === 'Active').length,
        m.totalEmployees,
        m.totalActivities,
        m.actualHours,
        m.idealHours,
        `${m.productivity}%`,
        m.status,
      ]);

      // Summary section
      const summaryRows: any[][] = [
        [],
        ['SUMMARY'],
        ['Total SOs', 'Active SOs', 'Inactive SOs', 'Total Employees Involved', 'Total Activities', 'Total Actual Hours', 'Total Ideal Hours', 'Average Productivity'],
        [
          summaryTotals.totalSOs,
          summaryTotals.activeSOs,
          summaryTotals.inactiveSOs,
          summaryTotals.totalEmployees,
          summaryTotals.totalActivities,
          summaryTotals.totalActualHours,
          summaryTotals.totalIdealHours,
          `${summaryTotals.avgProductivity}%`,
        ],
      ];

      const allRows = [...headerRows, ...dataRows, ...summaryRows];
      const ws = XLSX.utils.aoa_to_sheet(allRows);

      // Column widths
      ws['!cols'] = [
        { wch: 14 }, { wch: 22 }, { wch: 13 }, { wch: 13 }, { wch: 22 },
        { wch: 17 }, { wch: 17 }, { wch: 14 }, { wch: 13 }, { wch: 15 }, { wch: 12 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'SO Summary Report');
      saveXLSX(wb, `SO_Summary_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      notify('SO Summary Report (.xlsx) downloaded!');
    } catch (e) {
      notify(`Export failed: ${e}`, 'error');
    }
  };

  // ─── PDF Export ──────────────────────────────────────────────────────────────
  const handleSummaryPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape' });
      const now = new Date().toLocaleString('en-IN');
      const generatedBy = user?.name || 'Admin';

      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 297, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16); doc.setFont('helvetica', 'bold');
      doc.text('GAMECHANGE BOS  —  SO SUMMARY REPORT', 14, 13);
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.text(`Generated By: ${generatedBy}   |   Generated On: ${now}`, 14, 23);

      doc.setTextColor(30, 30, 30);
      autoTable(doc, {
        startY: 36,
        head: [['SO No', 'Customer Name', 'Start Date', 'End Date', 'Depts', 'Employees', 'Activities', 'Actual Hrs', 'Ideal Hrs', 'Productivity %', 'Status']],
        body: filteredSOMetrics.map(m => [
          m.so.soNumber,
          m.so.customerName,
          m.so.startDate,
          m.so.endDate,
          (m.so.allowedDepartments || []).length || departments.filter(d => d.status === 'Active').length,
          m.totalEmployees,
          m.totalActivities,
          m.actualHours,
          m.idealHours,
          `${m.productivity}%`,
          m.status,
        ]),
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [240, 246, 255] },
        styles: { fontSize: 8, cellPadding: 3 },
      });

      const lastY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('SUMMARY', 14, lastY);
      autoTable(doc, {
        startY: lastY + 4,
        head: [['Total SOs', 'Active SOs', 'Inactive SOs', 'Total Employees', 'Total Activities', 'Total Actual Hours', 'Total Ideal Hours', 'Avg Productivity']],
        body: [[
          summaryTotals.totalSOs, summaryTotals.activeSOs, summaryTotals.inactiveSOs,
          summaryTotals.totalEmployees, summaryTotals.totalActivities,
          summaryTotals.totalActualHours, summaryTotals.totalIdealHours, `${summaryTotals.avgProductivity}%`,
        ]],
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        styles: { fontSize: 9, cellPadding: 3 },
      });

      const pc = doc.getNumberOfPages();
      for (let i = 1; i <= pc; i++) {
        doc.setPage(i); doc.setFontSize(7); doc.setTextColor(150);
        doc.text(`Page ${i} of ${pc}  •  SO Summary Report  •  GAMECHANGE BOS`, 14, 205);
      }
      savePDF(doc, `SO_Summary_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      notify('SO Summary Report (.pdf) downloaded!');
    } catch (e) {
      notify(`PDF export failed: ${e}`, 'error');
    }
  };

  // Dept XLSX
  const handleDeptXLSX = () => {
    if (!selectedSO || !deptReportData.overall) return;
    try {
      const wb = XLSX.utils.book_new();

      const rows: any[][] = [
        ['GAMECHANGE BOS'],
        ['DEPARTMENT-WISE SO REPORT'],
        [],
        ['SO Number', selectedSO.soNumber],
        ['Customer', selectedSO.customerName],
        ['Start Date', selectedSO.startDate],
        ['End Date', selectedSO.endDate],
        ['Status', getSoStatus(selectedSO)],
        [],
        ['Department', 'Activity', 'Actual Hours', 'Ideal Hours', 'Users Worked', 'Rework Count', 'Rework Hours', 'Productivity %'],
        ...deptReportData.details.map(d => [
          d.department,
          d.activity,
          d.actualHours,
          d.idealHours,
          d.usersWorked,
          d.reworkCount,
          d.reworkHours,
          `${d.productivity}%`
        ]),
        [],
        ['DEPARTMENT SUMMARY'],
        ['Department', 'Total Activities', 'Total Users', 'Actual Hours', 'Ideal Hours', 'Rework Count', 'Rework Hours', 'Productivity %'],
        ...deptReportData.summary.map(s => [
          s.department,
          s.totalActivities,
          s.totalUsers,
          s.actualHours,
          s.idealHours,
          s.reworkCount,
          s.reworkHours,
          `${s.productivity}%`
        ]),
        [],
        ['OVERALL SO SUMMARY'],
        ['Total Departments', 'Total Activities', 'Total Users', 'Actual Hours', 'Ideal Hours', 'Total Rework Count', 'Total Rework Hours', 'Overall Productivity'],
        [
          deptReportData.overall.totalDepartments,
          deptReportData.overall.totalActivities,
          deptReportData.overall.totalUsers,
          deptReportData.overall.actualHours,
          deptReportData.overall.idealHours,
          deptReportData.overall.reworkCount,
          deptReportData.overall.reworkHours,
          `${deptReportData.overall.productivity}%`
        ]
      ];

      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [
        { wch: 24 }, { wch: 24 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, 
        { wch: 15 }, { wch: 15 }, { wch: 18 }
      ];
      XLSX.utils.book_append_sheet(wb, ws, 'Department-wise SO Report');
      saveXLSX(wb, `Dept_Report_${selectedSO.soNumber}.xlsx`);
      notify('Department Report (.xlsx) downloaded!');
    } catch (e) {
      notify(`Export failed: ${e}`, 'error');
    }
  };

  // Dept PDF
  const handleDeptPDF = () => {
    if (!selectedSO || !deptReportData.overall) return;
    try {
      const doc = new jsPDF({ orientation: 'landscape' });
      const now = new Date().toLocaleString('en-IN');
      const generatedBy = user?.name || 'Admin';

      // Title header
      doc.setFillColor(8, 145, 178);
      doc.rect(0, 0, 297, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14); doc.setFont('helvetica', 'bold');
      doc.text('GAMECHANGE BOS  —  DEPARTMENT-WISE SO REPORT', 14, 12);
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.text(`SO: ${selectedSO.soNumber}  |  Customer: ${selectedSO.customerName}  |  Generated By: ${generatedBy}  |  On: ${now}`, 14, 22);

      // Table 1: Activity-wise Details
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('Activity-wise Details', 14, 38);

      autoTable(doc, {
        startY: 42,
        head: [['Department', 'Activity', 'Actual Hours', 'Ideal Hours', 'Users Worked', 'Rework Count', 'Rework Hours', 'Productivity %']],
        body: deptReportData.details.map(d => [
          d.department, d.activity, `${d.actualHours}h`, `${d.idealHours}h`, d.usersWorked, d.reworkCount, `${d.reworkHours}h`, `${d.productivity}%`
        ]),
        headStyles: { fillColor: [8, 145, 178], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [240, 252, 252] },
        styles: { fontSize: 8, cellPadding: 3 },
      });

      // Table 2: Department Summary
      const y2 = (doc as any).lastAutoTable.finalY + 12;
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('Department Summary', 14, y2);

      autoTable(doc, {
        startY: y2 + 4,
        head: [['Department', 'Total Activities', 'Total Users', 'Actual Hours', 'Ideal Hours', 'Rework Count', 'Rework Hours', 'Productivity %']],
        body: deptReportData.summary.map(s => [
          s.department, s.totalActivities, s.totalUsers, `${s.actualHours}h`, `${s.idealHours}h`, s.reworkCount, `${s.reworkHours}h`, `${s.productivity}%`
        ]),
        headStyles: { fillColor: [8, 145, 178], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [240, 252, 252] },
        styles: { fontSize: 8, cellPadding: 3 },
      });

      // Table 3: Overall SO Summary
      const y3 = (doc as any).lastAutoTable.finalY + 12;
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('Overall SO Summary', 14, y3);

      autoTable(doc, {
        startY: y3 + 4,
        head: [['Total Departments', 'Total Activities', 'Total Users', 'Actual Hours', 'Ideal Hours', 'Total Rework Count', 'Total Rework Hours', 'Overall Productivity']],
        body: [[
          deptReportData.overall.totalDepartments,
          deptReportData.overall.totalActivities,
          deptReportData.overall.totalUsers,
          `${deptReportData.overall.actualHours}h`,
          `${deptReportData.overall.idealHours}h`,
          deptReportData.overall.reworkCount,
          `${deptReportData.overall.reworkHours}h`,
          `${deptReportData.overall.productivity}%`
        ]],
        headStyles: { fillColor: [8, 145, 178], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        styles: { fontSize: 8.5, cellPadding: 3 },
      });

      const pc = doc.getNumberOfPages();
      for (let i = 1; i <= pc; i++) {
        doc.setPage(i); doc.setFontSize(7); doc.setTextColor(150);
        doc.text(`Page ${i} of ${pc}  •  Department-wise Report  •  GAMECHANGE BOS`, 14, 205);
      }

      savePDF(doc, `Dept_Report_${selectedSO.soNumber}.pdf`);
      notify('Department Report (.pdf) downloaded!');
    } catch (e) {
      notify(`PDF failed: ${e}`, 'error');
    }
  };

  // Emp XLSX
  const handleEmpXLSX = () => {
    if (!selectedSO || !empReportData.overall) return;
    try {
      const wb = XLSX.utils.book_new();

      const rows: any[][] = [
        ['GAMECHANGE BOS'],
        ['EMPLOYEE-WISE SO REPORT'],
        [],
        ['SO Number', selectedSO.soNumber],
        ['Customer Name', selectedSO.customerName],
        ['Start Date', selectedSO.startDate],
        ['End Date', selectedSO.endDate],
        ['Status', getSoStatus(selectedSO)],
        [],
        ['Employee ID', 'Employee Name', 'Department', 'Activity', 'Hours Worked', 'Ideal Hours', 'Productivity %'],
        ...empReportData.details.map(e => [
          e.employeeId,
          e.name,
          e.department,
          e.activity,
          e.actualHours,
          e.idealHours,
          `${e.productivity}%`
        ]),
        [],
        ['EMPLOYEE SUMMARY'],
        ['Employee ID', 'Employee Name', 'Department', 'Total Activities', 'Total Hours Worked', 'Ideal Hours', 'Productivity %'],
        ...empReportData.summary.map(s => [
          s.employeeId,
          s.name,
          s.department,
          s.totalActivities,
          s.actualHours,
          s.idealHours,
          `${s.productivity}%`
        ]),
        [],
        ['OVERALL SO SUMMARY'],
        ['Total Employees', 'Total Activities', 'Total Hours Worked', 'Total Ideal Hours', 'Average Productivity'],
        [
          empReportData.overall.totalEmployees,
          empReportData.overall.totalActivities,
          empReportData.overall.actualHours,
          empReportData.overall.idealHours,
          `${empReportData.overall.productivity}%`
        ]
      ];

      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [
        { wch: 16 }, { wch: 24 }, { wch: 20 }, { wch: 24 }, { wch: 15 }, 
        { wch: 15 }, { wch: 18 }
      ];
      XLSX.utils.book_append_sheet(wb, ws, 'Employee-wise SO Report');
      saveXLSX(wb, `Emp_Report_${selectedSO.soNumber}.xlsx`);
      notify('Employee Report (.xlsx) downloaded!');
    } catch (e) {
      notify(`Export failed: ${e}`, 'error');
    }
  };

  // Emp PDF
  const handleEmpPDF = () => {
    if (!selectedSO || !empReportData.overall) return;
    try {
      const doc = new jsPDF({ orientation: 'landscape' });
      const now = new Date().toLocaleString('en-IN');
      const generatedBy = user?.name || 'Admin';

      // Title header
      doc.setFillColor(139, 92, 246);
      doc.rect(0, 0, 297, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14); doc.setFont('helvetica', 'bold');
      doc.text('GAMECHANGE BOS  —  EMPLOYEE-WISE SO REPORT', 14, 12);
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.text(`SO: ${selectedSO.soNumber}  |  Customer: ${selectedSO.customerName}  |  Generated By: ${generatedBy}  |  On: ${now}`, 14, 22);

      // Table 1: Employee Activity-wise Details
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('Employee Activity-wise Details', 14, 38);

      autoTable(doc, {
        startY: 42,
        head: [['Emp ID', 'Employee Name', 'Department', 'Activity', 'Hours Worked', 'Ideal Hours', 'Productivity %']],
        body: empReportData.details.map(e => [
          e.employeeId, e.name, e.department, e.activity, `${e.actualHours}h`, `${e.idealHours}h`, `${e.productivity}%`
        ]),
        headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [250, 245, 255] },
        styles: { fontSize: 8, cellPadding: 3 },
      });

      // Table 2: Employee Summary
      const y2 = (doc as any).lastAutoTable.finalY + 12;
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('Employee Summary', 14, y2);

      autoTable(doc, {
        startY: y2 + 4,
        head: [['Emp ID', 'Employee Name', 'Department', 'Total Activities', 'Total Hours Worked', 'Ideal Hours', 'Productivity %']],
        body: empReportData.summary.map(s => [
          s.employeeId, s.name, s.department, s.totalActivities, `${s.actualHours}h`, `${s.idealHours}h`, `${s.productivity}%`
        ]),
        headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [250, 245, 255] },
        styles: { fontSize: 8, cellPadding: 3 },
      });

      // Table 3: Overall SO Summary
      const y3 = (doc as any).lastAutoTable.finalY + 12;
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('Overall SO Summary', 14, y3);

      autoTable(doc, {
        startY: y3 + 4,
        head: [['Total Employees', 'Total Activities', 'Total Hours Worked', 'Total Ideal Hours', 'Average Productivity']],
        body: [[
          empReportData.overall.totalEmployees,
          empReportData.overall.totalActivities,
          `${empReportData.overall.actualHours}h`,
          `${empReportData.overall.idealHours}h`,
          `${empReportData.overall.productivity}%`
        ]],
        headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        styles: { fontSize: 8.5, cellPadding: 3 },
      });

      const pc = doc.getNumberOfPages();
      for (let i = 1; i <= pc; i++) {
        doc.setPage(i); doc.setFontSize(7); doc.setTextColor(150);
        doc.text(`Page ${i} of ${pc}  •  Employee-wise Report  •  GAMECHANGE BOS`, 14, 205);
      }

      savePDF(doc, `Emp_Report_${selectedSO.soNumber}.pdf`);
      notify('Employee Report (.pdf) downloaded!');
    } catch (e) {
      notify(`PDF failed: ${e}`, 'error');
    }
  };

  // ─── Filter / Export Bar ──────────────────────────────────────────────────────
  const FilterExportBar = ({ tab }: { tab: number }) => (
    <Box sx={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      flexWrap: 'wrap', gap: 2, mb: 3, p: 2, borderRadius: 3,
      border: '1px solid', borderColor: 'divider',
      bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.012)',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <FilterIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
          <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Filters</Typography>
        </Box>
        {tab === 0 ? (
          <TextField select size="small" label="Status" value={summaryStatusFilter}
            onChange={e => setSummaryStatusFilter(e.target.value)} sx={{ minWidth: 130 }}
            slotProps={{ input: { sx: { borderRadius: 2, fontSize: '0.85rem' } } }}>
            {['All', 'Active', 'Inactive', 'Completed', 'Delayed'].map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
          </TextField>
        ) : (
          <>
            <TextField select size="small" label="Period" value={periodFilter}
              onChange={e => setPeriodFilter(e.target.value)} sx={{ minWidth: 130 }}
              slotProps={{ input: { sx: { borderRadius: 2, fontSize: '0.85rem' } } }}>
              {['Daily', 'Weekly', 'Monthly', 'Yearly', 'Custom Range'].map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
            </TextField>
            <TextField type="date" size="small" label="From Date" value={fromDate}
              onChange={e => setFromDate(e.target.value)} sx={{ minWidth: 155 }}
              slotProps={{ inputLabel: { shrink: true }, input: { sx: { borderRadius: 2, fontSize: '0.85rem' }, startAdornment: <InputAdornment position="start"><CalendarIcon sx={{ fontSize: 15, color: 'text.secondary' }} /></InputAdornment> } }} />
            <TextField type="date" size="small" label="To Date" value={toDate}
              onChange={e => setToDate(e.target.value)} sx={{ minWidth: 155 }}
              slotProps={{ inputLabel: { shrink: true }, input: { sx: { borderRadius: 2, fontSize: '0.85rem' }, startAdornment: <InputAdornment position="start"><CalendarIcon sx={{ fontSize: 15, color: 'text.secondary' }} /></InputAdornment> } }} />
          </>
        )}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <ExportIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
          <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Export</Typography>
        </Box>
        <Button size="small" variant="outlined" startIcon={<ExcelIcon sx={{ color: '#10B981', fontSize: '1rem' }} />}
          onClick={tab === 0 ? handleSummaryXLSX : tab === 1 ? handleDeptXLSX : handleEmpXLSX}
          sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none', fontSize: '0.8rem', borderColor: 'rgba(16,185,129,0.4)', color: '#10B981', '&:hover': { borderColor: '#10B981', bgcolor: 'rgba(16,185,129,0.06)' } }}>
          Download Excel (.xlsx)
        </Button>
        <Button size="small" variant="outlined" startIcon={<PdfIcon sx={{ color: '#EF4444', fontSize: '1rem' }} />}
          onClick={tab === 0 ? handleSummaryPDF : tab === 1 ? handleDeptPDF : handleEmpPDF}
          sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none', fontSize: '0.8rem', borderColor: 'rgba(239,68,68,0.4)', color: '#EF4444', '&:hover': { borderColor: '#EF4444', bgcolor: 'rgba(239,68,68,0.06)' } }}>
          Download PDF (.pdf)
        </Button>
      </Box>
    </Box>
  );

  // ─── Chart styles ─────────────────────────────────────────────────────────────
  const gridStroke = themeMode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const tooltipStyle = { backgroundColor: themeMode === 'dark' ? '#1F2937' : '#fff', borderRadius: 8, border: '1px solid rgba(139,92,246,0.15)', fontSize: 12 };
  const PIE_COLORS = ['#10B981', '#8B5CF6', '#EF4444', '#9CA3AF'];

  // ─── Selected SO info for tabs 2/3 ───────────────────────────────────────────
  const soStatus = selectedSO ? getSoStatus(selectedSO) : 'Active';
  const sc = STATUS_COLORS[soStatus] || STATUS_COLORS.Active;
  const isOverdue = selectedSO?.endDate && selectedSO.endDate < today;

  return (
    <Box>
      <Snackbar open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar(p => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} sx={{ width: '100%', borderRadius: 3, fontWeight: 700 }}>{snackbar.message}</Alert>
      </Snackbar>

      {/* ── Page Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/so-management')}
          sx={{ fontWeight: 700, textTransform: 'none', color: 'text.secondary', borderRadius: 2.5, '&:hover': { color: 'primary.main', bgcolor: 'action.hover' } }}>
          Back to Registry
        </Button>
        {/* SO Selector — relevant for dept/emp tabs */}
        {salesOrders.length > 0 && dashboardTab !== 0 && (
          <TextField select size="small" label="Select SO for Report" value={selectedSO?.soNumber || ''}
            onChange={e => navigate(`/so-reports/${e.target.value}`)}
            sx={{ minWidth: 280 }}
            slotProps={{ input: { sx: { borderRadius: 2.5 }, startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: 'text.secondary' }} /></InputAdornment> } }}>
            {salesOrders.map(s => (
              <MenuItem key={s.soNumber} value={s.soNumber}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 800, fontFamily: 'ui-monospace, monospace' }}>{s.soNumber}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{s.customerName}</Typography>
                </Box>
              </MenuItem>
            ))}
          </TextField>
        )}
      </Box>

      {/* ── Selected SO compact info bar — only for dept/emp tabs ── */}
      {selectedSO && dashboardTab !== 0 && (
        <Card sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography sx={{ fontWeight: 900, fontFamily: 'ui-monospace, monospace', fontSize: '1rem' }}>{selectedSO.soNumber}</Typography>
              <Chip label={soStatus} size="small" sx={{ fontWeight: 800, fontSize: '0.7rem', bgcolor: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }} />
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>Customer</Typography>
              <Typography variant="body2" sx={{ fontWeight: 800 }}>{selectedSO.customerName}</Typography>
            </Box>
            {selectedSO.projectName && <><Divider orientation="vertical" flexItem /><Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>Project</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedSO.projectName}</Typography>
            </Box></>}
            <Divider orientation="vertical" flexItem />
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>Start</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>{selectedSO.startDate}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>End</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: isOverdue ? 'error.main' : 'inherit' }}>{selectedSO.endDate}</Typography>
              </Box>
            </Box>
            {selMetrics && (
              <>
                <Divider orientation="vertical" flexItem />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <LinearProgress variant="determinate" value={selMetrics.progressPct} sx={{
                    width: 100, height: 5, borderRadius: 3,
                    bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #8B5CF6, #06B6D4)', borderRadius: 3 }
                  }} />
                  <Typography variant="caption" sx={{ fontWeight: 800 }}>{selMetrics.progressPct}%</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{selMetrics.completedActivities}/{selMetrics.totalActivities} acts</Typography>
                </Box>
              </>
            )}
          </Box>
        </Card>
      )}

      {/* ── Main Report Card ── */}
      <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
          <Tabs value={dashboardTab} onChange={(_, v) => setDashboardTab(v)}
            sx={{ '& .MuiTab-root': { fontWeight: 700, fontSize: '0.88rem', textTransform: 'none', px: 3, py: 2 } }}>
            <Tab label="📋 SO Summary Report" />
            <Tab label="🏢 Department-wise Report" />
            <Tab label="👥 Employee-wise Report" />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>

          {/* ══════════════════════════════════════════════════════════ */}
          {/* TAB 0: SO SUMMARY REPORT                                  */}
          {/* ══════════════════════════════════════════════════════════ */}
          {dashboardTab === 0 && (
            <>
              <FilterExportBar tab={0} />

              {/* Summary KPI Cards */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                  { label: 'Total SOs', value: summaryTotals.totalSOs, color: '#8B5CF6', sub: 'All registered' },
                  { label: 'Active SOs', value: summaryTotals.activeSOs, color: '#10B981', sub: 'In progress' },
                  { label: 'Completed SOs', value: summaryTotals.completedSOs, color: '#2563EB', sub: 'Signed off' },
                  { label: 'Delayed SOs', value: summaryTotals.delayedSOs, color: '#EF4444', sub: 'Past deadline' },
                  { label: 'Inactive SOs', value: summaryTotals.inactiveSOs, color: '#9CA3AF', sub: 'Deactivated' },
                  { label: 'Total Activities', value: summaryTotals.totalActivities, color: '#06B6D4', sub: 'Across all SOs' },
                  { label: 'Total Actual Hrs', value: `${summaryTotals.totalActualHours}h`, color: '#F59E0B', sub: 'Logged hours' },
                  { label: 'Avg Productivity', value: `${summaryTotals.avgProductivity}%`, color: '#6366F1', sub: 'Ideal vs Actual' },
                ].map((k, i) => (
                  <Grid size={{ xs: 6, sm: 4, md: 3, lg: 1.5 }} key={i}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, borderColor: 'divider', bgcolor: 'transparent', height: '100%' }}>
                      <Typography variant="h5" sx={{ fontWeight: 900, color: k.color, mb: 0.25, lineHeight: 1 }}>{k.value}</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', mb: 0.25 }}>{k.label}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>{k.sub}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              {/* SO Table */}
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(37,99,235,0.04)' }}>
                    <TableRow>
                      {['SO No', 'Customer Name', 'Start Date', 'End Date', 'Depts Involved', 'Total Employees', 'Total Activities', 'Actual Hours', 'Ideal Hours', 'Productivity %', 'Status'].map(h => (
                        <TableCell key={h} sx={{ fontWeight: 800, fontSize: '0.75rem', py: 1.5, whiteSpace: 'nowrap' }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredSOMetrics.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} align="center" sx={{ py: 5 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>No Sales Orders match the selected filter.</Typography>
                        </TableCell>
                      </TableRow>
                    ) : filteredSOMetrics.map((m, i) => {
                      const s = STATUS_COLORS[m.status] || STATUS_COLORS.Active;
                      return (
                        <TableRow key={i} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                          <TableCell sx={{ fontFamily: 'ui-monospace, monospace', fontWeight: 800, fontSize: '0.82rem', color: 'primary.main', whiteSpace: 'nowrap' }}>{m.so.soNumber}</TableCell>
                          <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{m.so.customerName}</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: 'text.secondary', whiteSpace: 'nowrap' }}>{m.so.startDate}</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: m.status === 'Delayed' ? 'error.main' : 'text.secondary', whiteSpace: 'nowrap' }}>{m.so.endDate}</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#8B5CF6', textAlign: 'center' }}>{(m.so.allowedDepartments || []).length || departments.filter(d => d.status === 'Active').length}</TableCell>
                          <TableCell sx={{ fontWeight: 700, textAlign: 'center', color: '#06B6D4' }}>{m.totalEmployees}</TableCell>
                          <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>{m.totalActivities}</TableCell>
                          <TableCell sx={{ fontWeight: 600, textAlign: 'center', color: 'text.secondary' }}>{m.actualHours}h</TableCell>
                          <TableCell sx={{ fontWeight: 600, textAlign: 'center', color: 'text.secondary' }}>{m.idealHours}h</TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>
                            <Chip label={`${m.productivity}%`} size="small" sx={{
                              fontWeight: 800, fontSize: '0.75rem',
                              bgcolor: m.productivity >= 90 ? 'rgba(16,185,129,0.12)' : m.productivity >= 70 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                              color: m.productivity >= 90 ? '#10B981' : m.productivity >= 70 ? '#F59E0B' : '#EF4444',
                            }} />
                          </TableCell>
                          <TableCell>
                            <Chip label={m.status} size="small" sx={{ fontWeight: 800, fontSize: '0.72rem', bgcolor: s.bg, color: s.color, border: `1px solid ${s.border}` }} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pie chart */}
              {summaryTotals.totalSOs > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, borderColor: 'divider', bgcolor: 'transparent' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>SO Status Distribution</Typography>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={[
                          { name: 'Active', value: summaryTotals.activeSOs },
                          { name: 'Completed', value: summaryTotals.completedSOs },
                          { name: 'Delayed', value: summaryTotals.delayedSOs },
                          { name: 'Inactive', value: summaryTotals.inactiveSOs },
                        ].filter(d => d.value > 0)}
                          cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                          {PIE_COLORS.map((color, idx) => <Cell key={idx} fill={color} />)}
                        </Pie>
                        <ChartTooltip contentStyle={tooltipStyle} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Paper>
                </Box>
              )}
            </>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* TAB 1: DEPARTMENT-WISE REPORT                             */}
          {/* ══════════════════════════════════════════════════════════ */}
          {dashboardTab === 1 && (
            <>
              <FilterExportBar tab={1} />
              {!selectedSO || deptReportData.details.length === 0 ? (
                <Box sx={{ py: 8, textAlign: 'center' }}>
                  <BuildingIcon sx={{ fontSize: 52, color: 'text.disabled', mb: 1.5 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.secondary' }}>No Department Data Available</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 600 }}>No activity logs have been recorded for this Sales Order yet.</Typography>
                </Box>
              ) : (
                <>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, borderColor: 'divider', bgcolor: 'transparent', mb: 4 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>Department Progress</Typography>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={deptMetrics} margin={{ top: 0, right: 16, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                        <XAxis dataKey="department" tick={{ fontSize: 11, fontWeight: 600 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <ChartTooltip contentStyle={tooltipStyle} />
                        <Legend />
                        <Bar dataKey="completedActivities" name="Completed" fill="#10B981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="totalActivities" name="Total" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Paper>

                  {/* Section 1: Detailed Table */}
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BuildingIcon color="primary" sx={{ fontSize: 20 }} />
                      Activity-wise Details
                    </Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider' }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(8,145,178,0.04)' }}>
                          <TableRow>
                            {['Department', 'Activity', 'Actual Hours', 'Ideal Hours', 'Users Worked', 'Rework Count', 'Rework Hours', 'Productivity %'].map(h => (
                              <TableCell key={h} sx={{ fontWeight: 800, fontSize: '0.75rem', py: 1.5 }}>{h}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {deptReportData.details.map((d, i) => (
                            <TableRow key={i} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                              <TableCell sx={{ fontWeight: 700 }}>{d.department}</TableCell>
                              <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>{d.activity}</TableCell>
                              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>{d.actualHours}h</TableCell>
                              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>{d.idealHours}h</TableCell>
                              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>{d.usersWorked}</TableCell>
                              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>{d.reworkCount}</TableCell>
                              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>{d.reworkHours}h</TableCell>
                              <TableCell sx={{ textAlign: 'center' }}>
                                <Chip label={`${d.productivity}%`} size="small" sx={{
                                  fontWeight: 800, fontSize: '0.75rem',
                                  bgcolor: d.productivity >= 90 ? 'rgba(16,185,129,0.12)' : d.productivity >= 70 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                                  color: d.productivity >= 90 ? '#10B981' : d.productivity >= 70 ? '#F59E0B' : '#EF4444',
                                }} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>

                  {/* Section 2: Department Summary */}
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BuildingIcon color="secondary" sx={{ fontSize: 20 }} />
                      Department Summary
                    </Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider' }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(139,92,246,0.04)' }}>
                          <TableRow>
                            {['Department', 'Total Activities', 'Total Users', 'Actual Hours', 'Ideal Hours', 'Rework Count', 'Rework Hours', 'Productivity %'].map(h => (
                              <TableCell key={h} sx={{ fontWeight: 800, fontSize: '0.75rem', py: 1.5 }}>{h}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {deptReportData.summary.map((s, i) => (
                            <TableRow key={i} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                              <TableCell sx={{ fontWeight: 700 }}>{s.department}</TableCell>
                              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>{s.totalActivities}</TableCell>
                              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>{s.totalUsers}</TableCell>
                              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>{s.actualHours}h</TableCell>
                              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>{s.idealHours}h</TableCell>
                              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>{s.reworkCount}</TableCell>
                              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>{s.reworkHours}h</TableCell>
                              <TableCell sx={{ textAlign: 'center' }}>
                                <Chip label={`${s.productivity}%`} size="small" sx={{
                                  fontWeight: 800, fontSize: '0.75rem',
                                  bgcolor: s.productivity >= 90 ? 'rgba(16,185,129,0.12)' : s.productivity >= 70 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                                  color: s.productivity >= 90 ? '#10B981' : s.productivity >= 70 ? '#F59E0B' : '#EF4444',
                                }} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>

                  {/* Section 3: Overall SO Summary */}
                  {deptReportData.overall && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AssignIcon color="primary" sx={{ fontSize: 20 }} />
                        Overall SO Summary
                      </Typography>
                      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider' }}>
                        <Table size="small">
                          <TableHead sx={{ bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}>
                            <TableRow>
                              {['Total Departments', 'Total Activities', 'Total Users', 'Actual Hours', 'Ideal Hours', 'Total Rework Count', 'Total Rework Hours', 'Overall Productivity'].map(h => (
                                <TableCell key={h} sx={{ fontWeight: 800, fontSize: '0.75rem', py: 1.5 }}>{h}</TableCell>
                              ))}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            <TableRow sx={{ bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.005)' }}>
                              <TableCell sx={{ fontWeight: 800, fontSize: '0.9rem' }}>{deptReportData.overall.totalDepartments}</TableCell>
                              <TableCell sx={{ fontWeight: 800, fontSize: '0.9rem', textAlign: 'center' }}>{deptReportData.overall.totalActivities}</TableCell>
                              <TableCell sx={{ fontWeight: 800, fontSize: '0.9rem', textAlign: 'center' }}>{deptReportData.overall.totalUsers}</TableCell>
                              <TableCell sx={{ fontWeight: 800, fontSize: '0.9rem', textAlign: 'center', color: 'primary.main' }}>{deptReportData.overall.actualHours}h</TableCell>
                              <TableCell sx={{ fontWeight: 800, fontSize: '0.9rem', textAlign: 'center' }}>{deptReportData.overall.idealHours}h</TableCell>
                              <TableCell sx={{ fontWeight: 800, fontSize: '0.9rem', textAlign: 'center' }}>{deptReportData.overall.reworkCount}</TableCell>
                              <TableCell sx={{ fontWeight: 800, fontSize: '0.9rem', textAlign: 'center' }}>{deptReportData.overall.reworkHours}h</TableCell>
                              <TableCell sx={{ textAlign: 'center' }}>
                                <Chip label={`${deptReportData.overall.productivity}%`} size="medium" sx={{
                                  fontWeight: 900, fontSize: '0.85rem',
                                  bgcolor: deptReportData.overall.productivity >= 90 ? 'rgba(16,185,129,0.15)' : deptReportData.overall.productivity >= 70 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                                  color: deptReportData.overall.productivity >= 90 ? '#10B981' : deptReportData.overall.productivity >= 70 ? '#F59E0B' : '#EF4444',
                                  px: 1
                                }} />
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}
                </>
              )}
            </>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* TAB 2: EMPLOYEE-WISE REPORT                               */}
          {/* ══════════════════════════════════════════════════════════ */}
          {dashboardTab === 2 && (
            <>
              <FilterExportBar tab={2} />
              {!selectedSO || empReportData.details.length === 0 ? (
                <Box sx={{ py: 8, textAlign: 'center' }}>
                  <AssignIcon sx={{ fontSize: 52, color: 'text.disabled', mb: 1.5 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.secondary' }}>No Employee Data Available</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 600 }}>No activity logs have been recorded for this Sales Order yet.</Typography>
                </Box>
              ) : (
                <>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, borderColor: 'divider', bgcolor: 'transparent', mb: 4 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>Employee Contribution (Top 10)</Typography>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={employeeMetrics.slice(0, 10).map(e => ({ name: e.name.split(' ')[0], activities: e.activities, hours: e.actualHours }))}
                        margin={{ top: 0, right: 16, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <ChartTooltip contentStyle={tooltipStyle} />
                        <Legend />
                        <Bar dataKey="activities" name="Activities" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="hours" name="Hours" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Paper>

                  {/* Section 1: Detailed Table */}
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AssignIcon color="primary" sx={{ fontSize: 20 }} />
                      Employee Activity-wise Details
                    </Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider' }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(139,92,246,0.04)' }}>
                          <TableRow>
                            {['Employee ID', 'Employee Name', 'Department', 'Activity', 'Hours Worked', 'Ideal Hours', 'Productivity %'].map(h => (
                              <TableCell key={h} sx={{ fontWeight: 800, fontSize: '0.75rem', py: 1.5 }}>{h}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {empReportData.details.map((e, i) => (
                            <TableRow key={i} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                              <TableCell sx={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700, fontSize: '0.8rem', color: 'primary.main' }}>{e.employeeId}</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>{e.name}</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>{e.department}</TableCell>
                              <TableCell sx={{ fontWeight: 700, color: 'secondary.main' }}>{e.activity}</TableCell>
                              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>{e.actualHours}h</TableCell>
                              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>{e.idealHours}h</TableCell>
                              <TableCell sx={{ textAlign: 'center' }}>
                                <Chip label={`${e.productivity}%`} size="small" sx={{
                                  fontWeight: 800, fontSize: '0.75rem',
                                  bgcolor: e.productivity >= 90 ? 'rgba(16,185,129,0.12)' : e.productivity >= 70 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                                  color: e.productivity >= 90 ? '#10B981' : e.productivity >= 70 ? '#F59E0B' : '#EF4444',
                                }} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>

                  {/* Section 2: Employee Summary */}
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AssignIcon color="secondary" sx={{ fontSize: 20 }} />
                      Employee Summary
                    </Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider' }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(8,145,178,0.04)' }}>
                          <TableRow>
                            {['Employee ID', 'Employee Name', 'Department', 'Total Activities', 'Total Hours Worked', 'Ideal Hours', 'Productivity %'].map(h => (
                              <TableCell key={h} sx={{ fontWeight: 800, fontSize: '0.75rem', py: 1.5 }}>{h}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {empReportData.summary.map((s, i) => (
                            <TableRow key={i} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                              <TableCell sx={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700, fontSize: '0.8rem', color: 'primary.main' }}>{s.employeeId}</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>{s.name}</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>{s.department}</TableCell>
                              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>{s.totalActivities}</TableCell>
                              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>{s.actualHours}h</TableCell>
                              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>{s.idealHours}h</TableCell>
                              <TableCell sx={{ textAlign: 'center' }}>
                                <Chip label={`${s.productivity}%`} size="small" sx={{
                                  fontWeight: 800, fontSize: '0.75rem',
                                  bgcolor: s.productivity >= 90 ? 'rgba(16,185,129,0.12)' : s.productivity >= 70 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                                  color: s.productivity >= 90 ? '#10B981' : s.productivity >= 70 ? '#F59E0B' : '#EF4444',
                                }} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>

                  {/* Section 3: Overall SO Summary */}
                  {empReportData.overall && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AssignIcon color="primary" sx={{ fontSize: 20 }} />
                        Overall SO Summary
                      </Typography>
                      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider' }}>
                        <Table size="small">
                          <TableHead sx={{ bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}>
                            <TableRow>
                              {['Total Employees', 'Total Activities', 'Total Hours Worked', 'Total Ideal Hours', 'Average Productivity'].map(h => (
                                <TableCell key={h} sx={{ fontWeight: 800, fontSize: '0.75rem', py: 1.5 }}>{h}</TableCell>
                              ))}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            <TableRow sx={{ bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.005)' }}>
                              <TableCell sx={{ fontWeight: 800, fontSize: '0.9rem' }}>{empReportData.overall.totalEmployees}</TableCell>
                              <TableCell sx={{ fontWeight: 800, fontSize: '0.9rem', textAlign: 'center' }}>{empReportData.overall.totalActivities}</TableCell>
                              <TableCell sx={{ fontWeight: 800, fontSize: '0.9rem', textAlign: 'center', color: 'primary.main' }}>{empReportData.overall.actualHours}h</TableCell>
                              <TableCell sx={{ fontWeight: 800, fontSize: '0.9rem', textAlign: 'center' }}>{empReportData.overall.idealHours}h</TableCell>
                              <TableCell sx={{ textAlign: 'center' }}>
                                <Chip label={`${empReportData.overall.productivity}%`} size="medium" sx={{
                                  fontWeight: 900, fontSize: '0.85rem',
                                  bgcolor: empReportData.overall.productivity >= 90 ? 'rgba(16,185,129,0.15)' : empReportData.overall.productivity >= 70 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                                  color: empReportData.overall.productivity >= 90 ? '#10B981' : empReportData.overall.productivity >= 70 ? '#F59E0B' : '#EF4444',
                                  px: 1
                                }} />
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}
                </>
              )}
            </>
          )}

        </Box>
      </Card>
    </Box>
  );
};
