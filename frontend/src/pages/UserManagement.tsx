import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Typography, Box, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField, InputAdornment, Checkbox,
  Tabs, Tab, Button, Snackbar, Alert, LinearProgress, Chip, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  Select, MenuItem, FormControl, InputLabel, Grid, ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  PersonAdd as PersonAddIcon,
  GetApp as ExportIcon,
  Person as PersonIcon,
  TrendingUp as TrendIcon,
  Work as WorkIcon,
  AdminPanelSettings as AdminIcon,
  Assignment as AssignIcon,
  Block as BlockIcon,
  ManageAccounts as ManageIcon,
  Edit as EditIcon,
  Key as KeyIcon,
} from '@mui/icons-material';


// ─── helpers ────────────────────────────────────────────────────────────────
const initials = (name: string) =>
  name.split(' ').map((w) => w[0]).join('').substring(0, 2).toUpperCase();

const getUserAnalytics = (userId: string) => {
  const n = parseInt(userId.replace(/\D/g, '')) || 100;
  const productivity = 60 + (n % 36);
  const rework = n % 6;
  const tasksCompleted = 10 + (n % 22);
  const hoursLogged = 80 + (n % 80);
  const lastActivity = `2026-05-${Math.min(27, 10 + (n % 18))}`;
  return { productivity, rework, tasksCompleted, hoursLogged, lastActivity };
};

// gradient used on profile header
const HEADER_GRADIENT = 'linear-gradient(135deg, #0ea5e9 0%, #2563EB 50%, #06B6D4 100%)';

// ─── Add User Dialog ─────────────────────────────────────────────────────────
interface AddUserDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (user: any) => void;
}

const AddUserDialog: React.FC<AddUserDialogProps> = ({ open, onClose, onAdd }) => {
  const { roles } = useApp();
  const roleOptions = roles.length > 0
    ? roles.filter(r => r.name === 'Skilled' || r.name === 'Trainee')
    : [{ id: 'skilled', name: 'Skilled' }, { id: 'trainee', name: 'Trainee' }];

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [userId, setUserId]       = useState('');
  const [mobile, setMobile]       = useState('');
  const [email, setEmail]         = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [status, setStatus]       = useState<'Active' | 'Inactive'>('Active');
  const [password, setPassword]   = useState('');

  // Automatically initialize role select to the first available option
  React.useEffect(() => {
    if (roleOptions.length > 0) {
      if (!roleOptions.some(r => r.id === selectedRoleId)) {
        setSelectedRoleId(roleOptions[0].id);
      }
    }
  }, [roleOptions, selectedRoleId]);

  const allFilled = firstName && lastName && userId && mobile && email && selectedRoleId;

  const handleGenerate = () => {
    if (!firstName || mobile.length < 3) return;
    const namePart = firstName.substring(0, 3).toUpperCase();
    const mobilePart = mobile.slice(-3);
    setPassword(`${namePart}${mobilePart}`);
  };

  const handleSubmit = () => {
    const matchedRole = roleOptions.find(r => r.id === selectedRoleId) || roleOptions[0];
    const newUser = {
      adminName: `${firstName} ${lastName}`,
      userId: userId.toUpperCase(),
      mobile,
      email,
      role: matchedRole?.name || 'Worker',
      status: status === 'Active' ? 'Working' : 'Away',
      // Backend fields
      firstName,
      lastName,
      roleId: matchedRole?.id || '',
    };
    onAdd(newUser);
    // reset
    setFirstName(''); setLastName(''); setUserId('');
    setMobile(''); setEmail(''); setSelectedRoleId('');
    setStatus('Active'); setPassword('');
    onClose();
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': { borderRadius: 2.5 },
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
      <DialogTitle sx={{ fontWeight: 800, fontSize: '1.3rem', pb: 1 }}>
        Add New User
      </DialogTitle>

      <DialogContent sx={{ pt: 1.5 }}>
        <Grid container spacing={2}>
          {/* Row 1 */}
          <Grid size={{ xs: 6 }}>
            <TextField fullWidth label="First Name *" value={firstName}
              onChange={(e) => setFirstName(e.target.value)} sx={inputSx} />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField fullWidth label="Last Name *" value={lastName}
              onChange={(e) => setLastName(e.target.value)} sx={inputSx} />
          </Grid>

          {/* User ID */}
          <Grid size={{ xs: 12 }}>
            <TextField fullWidth label="User ID *" value={userId}
              onChange={(e) => setUserId(e.target.value.toUpperCase())}
              helperText="Auto-converted to UPPERCASE" sx={inputSx} />
          </Grid>

          {/* Mobile */}
          <Grid size={{ xs: 12 }}>
            <TextField fullWidth label="Mobile Number *" value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').substring(0, 10))}
              slotProps={{
                input: {
                  startAdornment: (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 1, color: 'text.secondary', fontWeight: 700 }}>
                      +91
                      <Box sx={{ width: '1px', height: 20, bgcolor: 'divider', ml: 0.5 }} />
                    </Box>
                  ),
                }
              }}
              placeholder="10-digit (starts with 6-9)"
              sx={inputSx} />
          </Grid>

          {/* Email */}
          <Grid size={{ xs: 12 }}>
            <TextField fullWidth label="Email ID *" value={email}
              onChange={(e) => setEmail(e.target.value)} type="email" sx={inputSx} />
          </Grid>

          {/* Role — from backend */}
          <Grid size={{ xs: 12 }}>
            <FormControl fullWidth sx={inputSx}>
              <InputLabel>Select Role *</InputLabel>
              <Select value={selectedRoleId} label="Select Role *"
                onChange={(e) => setSelectedRoleId(e.target.value)}
                sx={{ borderRadius: 2.5 }}>
                {roleOptions.map((r) => (
                  <MenuItem key={r.id} value={r.id} sx={{ fontWeight: 600 }}>{r.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Status */}
          <Grid size={{ xs: 12 }}>
            <FormControl fullWidth sx={inputSx}>
              <InputLabel shrink>Status</InputLabel>
              <Select value={status} label="Status"
                onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
                sx={{ borderRadius: 2.5 }}>
                <MenuItem value="Active" sx={{ fontWeight: 600 }}>Active</MenuItem>
                <MenuItem value="Inactive" sx={{ fontWeight: 600 }}>Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Password + Generate */}
          <Grid size={{ xs: 8 }}>
            <TextField fullWidth label="Password" value={password}
              onChange={(e) => setPassword(e.target.value)} sx={inputSx} />
          </Grid>
          <Grid size={{ xs: 4 }}>
            <Button fullWidth variant="outlined" disabled={!firstName || mobile.length < 3}
              onClick={handleGenerate}
              sx={{ height: 56, borderRadius: 2.5, fontWeight: 700, textTransform: 'none' }}>
              Generate
            </Button>
          </Grid>
          {(!firstName || mobile.length < 3) && (
            <Grid size={{ xs: 12 }}>
              <Typography variant="caption" color="text.secondary">
                Fill First Name and Mobile Number above to enable Generate
              </Typography>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
        <Button onClick={onClose} variant="text"
          sx={{ fontWeight: 700, textTransform: 'none', color: 'text.secondary' }}>
          Cancel
        </Button>
        <Button variant="contained" disabled={!allFilled} onClick={handleSubmit}
          sx={{
            borderRadius: 3, fontWeight: 700, textTransform: 'none', px: 4,
            background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
          }}>
          Add User
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Edit User Dialog ────────────────────────────────────────────────────────
interface EditUserDialogProps {
  user: any | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (id: string, updatedFields: any) => Promise<void>;
}

const EditUserDialog: React.FC<EditUserDialogProps> = ({ user, open, onClose, onUpdate }) => {
  const { roles } = useApp();
  const roleOptions = roles.length > 0
    ? roles.filter(r => r.name === 'Skilled' || r.name === 'Trainee')
    : [{ id: 'skilled', name: 'Skilled' }, { id: 'trainee', name: 'Trainee' }];

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [mobile, setMobile]       = useState('');
  const [email, setEmail]         = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [status, setStatus]       = useState<'Active' | 'Inactive'>('Active');

  // Load user data when dialog opens
  React.useEffect(() => {
    if (user && open) {
      const parts = user.adminName.split(' ');
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
      setMobile(user.mobile || '');
      setEmail(user.email || '');
      
      const matchedRole = roleOptions.find(r => r.name.toLowerCase() === user.role.toLowerCase());
      setSelectedRoleId(matchedRole?.id || roleOptions[0]?.id || '');
      setStatus(user.status === 'Working' || user.status === 'Active' ? 'Active' : 'Inactive');
    }
  }, [user, open, roleOptions]);

  const allFilled = firstName && lastName && mobile && email && selectedRoleId;

  const handleSubmit = async () => {
    if (!user) return;
    const matchedRole = roleOptions.find(r => r.id === selectedRoleId) || roleOptions[0];
    const updatedFields = {
      firstName,
      lastName,
      mobile,
      email,
      role: matchedRole?.name || 'Worker',
      status: status === 'Active' ? 'Working' : 'Away',
      roleId: matchedRole?.id,
    };
    await onUpdate(user.id || user.userId, updatedFields);
    onClose();
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': { borderRadius: 2.5 },
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
      <DialogTitle sx={{ fontWeight: 800, fontSize: '1.3rem', pb: 1 }}>
        Edit User Information
      </DialogTitle>

      <DialogContent sx={{ pt: 1.5 }}>
        <Grid container spacing={2}>
          {/* Row 1 */}
          <Grid size={{ xs: 6 }}>
            <TextField fullWidth label="First Name *" value={firstName}
              onChange={(e) => setFirstName(e.target.value)} sx={inputSx} />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField fullWidth label="Last Name *" value={lastName}
              onChange={(e) => setLastName(e.target.value)} sx={inputSx} />
          </Grid>

          {/* User ID - Read Only */}
          <Grid size={{ xs: 12 }}>
            <TextField fullWidth label="User ID" value={user?.userId || ''}
              slotProps={{ input: { readOnly: true } }}
              helperText="User ID cannot be changed" sx={inputSx} />
          </Grid>

          {/* Mobile */}
          <Grid size={{ xs: 12 }}>
            <TextField fullWidth label="Mobile Number *" value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').substring(0, 10))}
              slotProps={{
                input: {
                  startAdornment: (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 1, color: 'text.secondary', fontWeight: 700 }}>
                      +91
                      <Box sx={{ width: '1px', height: 20, bgcolor: 'divider', ml: 0.5 }} />
                    </Box>
                  ),
                }
              }}
              placeholder="10-digit (starts with 6-9)"
              sx={inputSx} />
          </Grid>

          {/* Email */}
          <Grid size={{ xs: 12 }}>
            <TextField fullWidth label="Email ID *" value={email}
              onChange={(e) => setEmail(e.target.value)} type="email" sx={inputSx} />
          </Grid>

          {/* Role — from backend */}
          <Grid size={{ xs: 12 }}>
            <FormControl fullWidth sx={inputSx}>
              <InputLabel>Select Role *</InputLabel>
              <Select value={selectedRoleId} label="Select Role *"
                onChange={(e) => setSelectedRoleId(e.target.value)}
                sx={{ borderRadius: 2.5 }}>
                {roleOptions.map((r) => (
                  <MenuItem key={r.id} value={r.id} sx={{ fontWeight: 600 }}>{r.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Status */}
          <Grid size={{ xs: 12 }}>
            <FormControl fullWidth sx={inputSx}>
              <InputLabel shrink>Status</InputLabel>
              <Select value={status} label="Status"
                onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
                sx={{ borderRadius: 2.5 }}>
                <MenuItem value="Active" sx={{ fontWeight: 600 }}>Active</MenuItem>
                <MenuItem value="Inactive" sx={{ fontWeight: 600 }}>Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
        <Button onClick={onClose} variant="text"
          sx={{ fontWeight: 700, textTransform: 'none', color: 'text.secondary' }}>
          Cancel
        </Button>
        <Button variant="contained" disabled={!allFilled} onClick={handleSubmit}
          sx={{
            borderRadius: 3, fontWeight: 700, textTransform: 'none', px: 4,
            background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
          }}>
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── User Profile Dialog ──────────────────────────────────────────────────────
interface EmployeeDetail {
  id?: string;
  employeeId?: string;
  firstName?: string;
  lastName?: string;
  mobile?: string;
  email?: string;
  role?: string;
  status?: string;
  isActive?: boolean;
  createdAt?: string;
}

interface UserProfileDialogProps {
  user: any | null;
  open: boolean;
  onClose: () => void;
  activityLogs: ReturnType<typeof useApp>['activityLogs'];
  salesOrders: ReturnType<typeof useApp>['salesOrders'];
  onEditClick: (user: any) => void;
}

type PeriodKey = 'Today' | 'Weekly' | 'Monthly' | 'Yearly';

const UserProfileDialog: React.FC<UserProfileDialogProps> = ({
  user, open, onClose, activityLogs, salesOrders, onEditClick,
}) => {
  const [tab, setTab] = useState(0);
  const [period, setPeriod] = useState<PeriodKey>('Today');
  const [snackMsg, setSnackMsg] = useState<string | null>(null);
  const [detail, setDetail] = useState<EmployeeDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Fetch full employee detail from backend when dialog opens
  React.useEffect(() => {
    if (!user || !open) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    setLoadingDetail(true);
    fetch(`http://127.0.0.1:5000/api/v1/users/${user.id || user.userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setDetail(data); })
      .catch(() => {})
      .finally(() => setLoadingDetail(false));
  }, [user, open]);

  if (!user) return null;

  const analytics = getUserAnalytics(user.userId);
  const isActive = user.status === 'Working' || user.status === 'Active';

  // Transform/normalize logs to support both local mock logs and live backend logs
  const normalizedLogs = activityLogs.map((log: any) => {
    if (log.workerName) {
      return log;
    }

    const firstName = log.user?.firstName || '';
    const lastName = log.user?.lastName || '';
    const workerName = `${firstName} ${lastName}`.trim() || 'Unknown Worker';
    const employeeId = log.user?.employeeId || log.userId || 'EMP-UNKNOWN';

    const soNumber = log.SalesOrder?.soNumber || log.soId || 'SO-UNKNOWN';
    const departmentName = log.department?.name || log.departmentId || 'Unknown Dept';
    const activityName = log.activity?.activityName || log.activityId || 'Unknown Activity';

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
    };
  });

  // Work summary rows from activity logs
  const workLogs = normalizedLogs.filter((l) => l.userId === user.userId);
  const workRows = workLogs.map((l) => {
    const so = salesOrders.find((s) => s.soNumber === l.soNumber);
    const soAct = (so?.activities || []).find((a) => a.activityName === l.activity);
    return {
      soId: l.soNumber,
      department: l.department,
      activity: l.activity,
      date: l.createdAt ? new Date(l.createdAt).toISOString().split('T')[0] : '2026-05-30',
      status: soAct?.status ?? (l.endTime ? 'Completed' : 'Running'),
    };
  });

  const getActStatusStyle = (s: string) => {
    switch (s) {
      case 'Completed': return { color: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' };
      case 'Running':   return { color: '#2563EB', bg: 'rgba(37,99,235,0.12)', border: 'rgba(37,99,235,0.3)' };
      case 'Delayed':   return { color: '#EF4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' };
      default:          return { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' };
    }
  };

  const actionCards = [
    { icon: <AssignIcon />, label: 'Assign Rework',    desc: 'Mark selected work for revision',         color: '#2563EB', bg: '#EFF6FF' },
    { icon: <BlockIcon />,  label: 'Deactivate User',  desc: 'Disable this user\'s system access',      color: '#EF4444', bg: '#FEF2F2' },
    { icon: <ManageIcon />, label: 'Modify Role',      desc: 'Change the role assigned to this user',   color: '#F59E0B', bg: '#FFFBEB' },
    { icon: <EditIcon />,   label: 'Edit User Info',   desc: 'Update name, email, or mobile details',   color: '#0891B2', bg: '#ECFEFF' },
    { icon: <KeyIcon />,    label: 'Reset Password',   desc: 'Generate a new password for this user',   color: '#0D9488', bg: '#F0FDFA' },
  ];

  const periodFilter = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
      <ToggleButtonGroup value={period} exclusive size="small"
        onChange={(_, v) => { if (v) setPeriod(v); }}>
        {(['Today', 'Weekly', 'Monthly', 'Yearly'] as PeriodKey[]).map((p) => (
          <ToggleButton key={p} value={p}
            sx={{ fontWeight: 700, textTransform: 'none', px: 2,
                  '&.Mui-selected': { bgcolor: '#1E293B', color: '#fff' } }}>
            {p}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <TextField type="date" size="small" label="Pick Date"
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
    </Box>
  );

  return (
    <>
      <Snackbar open={Boolean(snackMsg)} autoHideDuration={3000}
        onClose={() => setSnackMsg(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="success" sx={{ fontWeight: 700, borderRadius: 2 }}>{snackMsg}</Alert>
      </Snackbar>

      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3, overflow: 'hidden', maxHeight: '90vh' } } }}>

        {/* ── Header Banner ─────────────────────────────────────── */}
        <Box sx={{ background: HEADER_GRADIENT, p: 3, pr: 2, position: 'relative', color: '#fff' }}>
          <IconButton onClick={onClose} size="small"
            sx={{ position: 'absolute', top: 12, right: 12, color: 'rgba(255,255,255,0.8)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
            <CloseIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 52, height: 52, bgcolor: 'rgba(255,255,255,0.25)',
                          fontWeight: 800, fontSize: '1.2rem', border: '2px solid rgba(255,255,255,0.4)' }}>
              {initials(user.adminName)}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                {user.adminName}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.3 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.85 }}>
                  {user.userId} · {user.role} ·
                </Typography>
                <Chip label={isActive ? 'Active' : 'Inactive'} size="small"
                  sx={{ bgcolor: isActive ? '#10B981' : '#EF4444', color: '#fff',
                        fontWeight: 800, fontSize: '0.75rem', height: 20 }} />
              </Box>
            </Box>
          </Box>
        </Box>

        <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}
            sx={{ px: 2, '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', minHeight: 48, fontSize: '0.88rem' },
                  '& .MuiTabs-indicator': { bgcolor: '#2563EB', height: 2.5 } }}>
            <Tab icon={<PersonIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Employee Info" />
            <Tab icon={<TrendIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Productivity Summary" />
            <Tab icon={<WorkIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Work Summary" />
            <Tab icon={<AdminIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Admin Actions" />
          </Tabs>
        </Box>

        <DialogContent sx={{ p: 3, minHeight: 400 }}>

          {tab === 0 && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#2563EB', mb: 2.5 }}>
                    Personal Details
                  </Typography>
                  {loadingDetail && (
                    <LinearProgress sx={{ mb: 2, borderRadius: 2 }} />
                  )}
                  {[
                    { label: 'Employee ID', value: detail?.employeeId || user.userId },
                    { label: 'Full Name',   value: detail ? `${detail.firstName || ''} ${detail.lastName || ''}`.trim() : user.adminName },
                    { label: 'Email',       value: detail?.email || user.email || '—' },
                    { label: 'Mobile',      value: `+91 ${detail?.mobile || user.mobile}` },
                    { label: 'Joined On',   value: detail?.createdAt ? new Date(detail.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' },
                  ].map((row) => (
                    <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.2,
                        borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>{row.label}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.value}</Typography>
                    </Box>
                  ))}
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#2563EB', mb: 2.5 }}>
                    Role & Access
                  </Typography>
                  {[
                    { label: 'Role',        value: detail?.role || user.role },
                    { label: 'Status',      value: (detail?.status || user.status || 'ACTIVE').replace('_', ' ') },
                    { label: 'Account',     value: detail?.isActive !== false ? 'Active Account' : 'Disabled Account' },
                    { label: 'DB Record ID', value: detail?.id ? detail.id.substring(0, 18) + '…' : '—' },
                  ].map((row) => (
                    <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.2,
                        borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>{row.label}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{row.value}</Typography>
                    </Box>
                  ))}
                </Box>
              </Grid>
            </Grid>
          )}

          {tab === 1 && (
            <Box>
              {periodFilter}
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 3, display: 'block' }}>
                Showing: {period}
              </Typography>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                  { label: 'Productivity Score', sub: 'Overall performance',    value: `${analytics.productivity}%`, color: '#F59E0B' },
                  { label: 'Tasks Completed',    sub: 'In selected period',     value: `${analytics.tasksCompleted}`, color: '#2563EB' },
                  { label: 'Rework Count',       sub: 'Revisions required',     value: `${analytics.rework}`,  color: '#10B981' },
                  { label: 'Hours Logged',       sub: 'Total hours worked',     value: `${analytics.hoursLogged}h`,  color: '#8B5CF6' },
                ].map((c) => (
                  <Grid size={{ xs: 6, sm: 3 }} key={c.label}>
                    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: 2.5, textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ fontWeight: 900, color: c.color, mb: 0.5 }}>
                        {c.value}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.2 }}>{c.label}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{c.sub}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>Productivity Progress</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>Score</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#F59E0B' }}>{analytics.productivity}%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={analytics.productivity}
                  sx={{ height: 10, borderRadius: 5, bgcolor: 'action.hover',
                        '& .MuiLinearProgress-bar': { bgcolor: '#F59E0B', borderRadius: 5 } }} />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontWeight: 600 }}>
                  Last activity: {analytics.lastActivity}
                </Typography>
              </Box>
            </Box>
          )}

          {tab === 2 && (
            <Box>
              {periodFilter}
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 2, display: 'block' }}>
                Showing {workRows.length} SO(s) for: {period}
              </Typography>

              <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                    <TableRow>
                      {['SO ID', 'Department', 'Activity Performed', 'Date', 'Status'].map((h) => (
                        <TableCell key={h} sx={{ fontWeight: 800, fontSize: '0.8rem', py: 1.5 }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {workRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                            No work logs found for this employee.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      workRows.map((r, idx) => {
                        const st = getActStatusStyle(r.status);
                        return (
                          <TableRow key={idx} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                            <TableCell sx={{ color: '#2563EB', fontWeight: 800, fontFamily: 'ui-monospace, monospace' }}>
                              {r.soId}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{r.department}</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{r.activity}</TableCell>
                            <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>{r.date}</TableCell>
                            <TableCell>
                              <Chip label={r.status} size="small"
                                sx={{ bgcolor: st.bg, color: st.color, fontWeight: 800, fontSize: '0.75rem',
                                      border: `1px solid ${st.border}`, borderRadius: 1.5 }} />
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* ── Tab 3: Admin Actions ──────────────────────────── */}
          {tab === 3 && (
            <Grid container spacing={2}>
              {actionCards.map((card) => (
                <Grid size={{ xs: 12, sm: 6 }} key={card.label}>
                  <Box
                    onClick={() => {
                      if (card.label === 'Edit User Info' || card.label === 'Modify Role') {
                        onEditClick(user);
                        onClose();
                      } else {
                        setSnackMsg(`Action "${card.label}" executed for ${user.adminName}`);
                      }
                    }}
                    sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5,
                          border: '1px solid', borderColor: 'divider', borderRadius: 3,
                          cursor: 'pointer', transition: 'all 0.2s',
                          '&:hover': { borderColor: card.color, bgcolor: `${card.color}08`, transform: 'translateY(-1px)' } }}>
                    <Box sx={{ width: 44, height: 44, borderRadius: 2,
                                bgcolor: card.bg, color: card.color,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0 }}>
                      {card.icon}
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 800, mb: 0.3 }}>{card.label}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{card.desc}</Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

// ─── Main UserManagement Page ─────────────────────────────────────────────────
export const UserManagement: React.FC = () => {
  const { users, addNewUser, updateUser, activityLogs, salesOrders, themeMode } = useApp();

  const [search, setSearch]               = useState('');
  const [activeTab, setActiveTab]         = useState(0);
  const [selectedIds, setSelectedIds]     = useState<string[]>([]);
  const [addOpen, setAddOpen]             = useState(false);
  const [profileUser, setProfileUser]     = useState<any | null>(null);
  const [editUser, setEditUser]           = useState<any | null>(null);
  const [snackMsg, setSnackMsg]           = useState<string | null>(null);

  const handleUpdateUser = async (id: string, updatedFields: any) => {
    const ok = await updateUser(id, updatedFields);
    setSnackMsg(ok ? `User updated successfully!` : 'Failed to update user.');
  };

  // ── Filtered users ──────────────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase();
      const matchSearch = u.userId.toLowerCase().includes(q) ||
        u.adminName.toLowerCase().includes(q) || u.mobile.includes(q);

      const isActive = u.status !== 'Away' && u.status !== 'Inactive';
      let matchTab = true;
      if (activeTab === 1) matchTab = isActive;
      else if (activeTab === 2) matchTab = !isActive;

      return matchSearch && matchTab;
    });
  }, [users, search, activeTab]);

  // ── Checkbox helpers ────────────────────────────────────────────────────
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSelectedIds(e.target.checked ? filteredUsers.map((u) => u.userId) : []);

  const handleSelectRow = (id: string) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleAddUser = async (user: any) => {
    const ok = await addNewUser(user);
    setSnackMsg(ok ? `User ${user.adminName} added successfully!` : 'User ID already exists.');
  };

  const handleBulkExport = () => {
    const header = 'Employee ID,Name,Mobile,Role,Status\n';
    const rows = users.filter((u) => selectedIds.includes(u.userId))
      .map((u) => `${u.userId},${u.adminName},${u.mobile},${u.role},${u.status}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
    setSnackMsg(`Exported ${selectedIds.length} users to CSV.`);
    setSelectedIds([]);
  };

  return (
    <Box>
      <Snackbar open={Boolean(snackMsg)} autoHideDuration={3500}
        onClose={() => setSnackMsg(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="success" sx={{ fontWeight: 700, borderRadius: 2 }}>{snackMsg}</Alert>
      </Snackbar>

      {/* Add User dialog */}
      <AddUserDialog open={addOpen} onClose={() => setAddOpen(false)} onAdd={handleAddUser} />

      {/* Profile dialog */}
      <UserProfileDialog user={profileUser} open={Boolean(profileUser)}
        onClose={() => setProfileUser(null)} activityLogs={activityLogs} salesOrders={salesOrders} onEditClick={setEditUser} />

      {/* Edit User dialog */}
      <EditUserDialog user={editUser} open={Boolean(editUser)} onClose={() => setEditUser(null)} onUpdate={handleUpdateUser} />

      {/* ── Page Header ─────────────────────────────────────────────── */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 0.5 }}>
          Administrator & Workforce Registry
        </Typography>
      </Box>

      {/* ── Tabs ────────────────────────────────────────────────────── */}
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => { setActiveTab(v); setSelectedIds([]); }}
          sx={{ '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', fontSize: '0.9rem' },
                '& .MuiTabs-indicator': { bgcolor: '#2563EB' } }}>
          <Tab label="All Users" />
          <Tab label="Active Users" />
          <Tab label="Inactive Users" />
        </Tabs>
      </Box>

      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <TextField size="small" placeholder="Search ID, Name or Mobile..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              ),
              sx: { borderRadius: 3, width: { xs: '100%', sm: 300 } },
            }
          }} />

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {selectedIds.length > 0 && (
            <>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#2563EB', display: 'flex', alignItems: 'center' }}>
                {selectedIds.length} selected
              </Typography>
              <Button size="small" variant="outlined" startIcon={<ExportIcon />}
                onClick={handleBulkExport}
                sx={{ borderRadius: 2.5, fontWeight: 700, textTransform: 'none' }}>
                Export CSV
              </Button>
            </>
          )}
          <Button variant="contained" startIcon={<PersonAddIcon />}
            onClick={() => setAddOpen(true)}
            sx={{
              borderRadius: 3, fontWeight: 700, textTransform: 'none', px: 3,
              background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
              boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
              '&:hover': { background: 'linear-gradient(135deg, #1D4ED8, #0891B2)' },
            }}>
            Add New User
          </Button>
        </Box>
      </Box>

      {/* ── Table ───────────────────────────────────────────────────── */}
      <TableContainer component={Paper}
        sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <Table sx={{ minWidth: 900 }} size="small">
          <TableHead sx={{ bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selectedIds.length > 0 && selectedIds.length < filteredUsers.length}
                  checked={filteredUsers.length > 0 && selectedIds.length === filteredUsers.length}
                  onChange={handleSelectAll} />
              </TableCell>
              {['Employee ID', 'Employee Name', 'Mobile Number', 'Role', 'Status', 'Productivity %', 'Rework', 'Last Activity', 'Actions'].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 800, fontSize: '0.8rem', py: 1.5 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                    <Box
                      component="img"
                      src="/images/industrial_empty.png"
                      alt="No Workers"
                      sx={{
                        width: 260,
                        height: 'auto',
                        opacity: 0.85,
                        mb: 3,
                        borderRadius: 3,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    />
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
                      No Workers Found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, maxWidth: 360, mb: 3 }}>
                      Add new employees or adjust your search filter to begin.
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<PersonAddIcon />}
                      onClick={() => setAddOpen(true)}
                      sx={{ borderRadius: 3, fontWeight: 700, textTransform: 'none' }}
                    >
                      Register New Worker
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((row) => {
                const selected = selectedIds.includes(row.userId);
                const analytics = getUserAnalytics(row.userId);
                const isActive = row.status !== 'Away' && row.status !== 'Inactive';

                return (
                  <TableRow key={row.userId} selected={selected}
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: themeMode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' } }}>
                    <TableCell padding="checkbox">
                      <Checkbox checked={selected} onChange={() => handleSelectRow(row.userId)} onClick={(e) => e.stopPropagation()} />
                    </TableCell>

                    {/* Employee ID */}
                    <TableCell onClick={() => setProfileUser(row)}
                      sx={{ fontFamily: 'ui-monospace, monospace', fontWeight: 800, color: '#2563EB', fontSize: '0.82rem' }}>
                      {row.userId}
                    </TableCell>

                    {/* Name */}
                    <TableCell onClick={() => setProfileUser(row)}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                        <Avatar sx={{ width: 30, height: 30, fontSize: '0.75rem', fontWeight: 800,
                                      bgcolor: `hsl(${(row.userId.charCodeAt(3) || 0) * 20},60%,50%)` }}>
                          {initials(row.adminName)}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.adminName}</Typography>
                      </Box>
                    </TableCell>

                    {/* Mobile */}
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>+91 {row.mobile}</TableCell>

                    {/* Role */}
                    <TableCell>
                      <Chip label={row.role} size="small"
                        sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: 'action.hover' }} />
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Chip label={isActive ? 'Active' : 'Inactive'} size="small"
                        sx={{ fontWeight: 800, fontSize: '0.75rem',
                              bgcolor: isActive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                              color: isActive ? '#10B981' : '#EF4444' }} />
                    </TableCell>

                    {/* Productivity */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 800, minWidth: 34 }}>
                          {analytics.productivity}%
                        </Typography>
                        <LinearProgress variant="determinate" value={analytics.productivity}
                          sx={{ width: 55, height: 4, borderRadius: 2, bgcolor: 'action.hover',
                                '& .MuiLinearProgress-bar': { bgcolor: analytics.productivity > 80 ? '#10B981' : '#F59E0B' } }} />
                      </Box>
                    </TableCell>

                    {/* Rework */}
                    <TableCell sx={{ fontWeight: 700, color: analytics.rework > 3 ? '#EF4444' : 'text.primary' }}>
                      {analytics.rework}
                    </TableCell>

                    {/* Last Activity */}
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.8rem' }}>
                      {analytics.lastActivity}
                    </TableCell>

                    {/* Actions */}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <IconButton size="small" color="primary" onClick={() => setEditUser(row)}
                        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                        <EditIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
