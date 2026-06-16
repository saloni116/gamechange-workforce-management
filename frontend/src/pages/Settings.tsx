import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  Divider,
  Switch,
  FormControlLabel,
  Checkbox,
  Snackbar,
  Alert,
  MenuItem,
  Avatar,
  Paper,
} from '@mui/material';
import {
  Save as SaveIcon,
  Business as CompanyIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  VpnKey as KeyIcon,
  PhotoCamera as CameraIcon,
} from '@mui/icons-material';

export const Settings: React.FC = () => {
  const { toggleTheme, themeMode } = useApp();

  // Dialog & Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // 1. Company Settings State
  const [companyName, setCompanyName] = useState('Game Change BoS');

  // 2. User Permissions State (Access Matrices)
  const [rolePermissions, setRolePermissions] = useState({
    adminAll: true,
    workerAddUser: false,
    workerEditUser: false,
    techAddActivity: true,
    techEditActivity: true,
  });

  const [pageAccess, setPageAccess] = useState({
    dashboard: true,
    addUser: true,
    userManagement: true,
    reports: true,
    settings: true,
  });

  // 3. Notification Settings State
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [systemAlerts, setSystemAlerts] = useState(true);

  // 4. Password Policy State
  const [passwordPolicy, setPasswordPolicy] = useState({
    min8Chars: true,
    reqNumber: true,
    reqSpecial: true,
  });
  const [resetRule, setResetRule] = useState('90'); // 90 days expiration

  const handleSave = () => {
    setSnackbarOpen(true);
  };

  const handleRolePermChange = (key: keyof typeof rolePermissions) => {
    setRolePermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePageAccessChange = (key: keyof typeof pageAccess) => {
    setPageAccess((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePolicyChange = (key: keyof typeof passwordPolicy) => {
    setPasswordPolicy((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%', borderRadius: 3, fontWeight: 600 }}>
          System security and configuration settings updated successfully!
        </Alert>
      </Snackbar>

      {/* Header Info Panel */}
      <Card sx={{ p: 3, mb: 4, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 1 }}>
          System Settings & Control Preferences
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
          Manage global corporate branding, configure granular security matrices, set password expiration policies, and toggle notification logs.
        </Typography>
      </Card>

      <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          
          {/* Section 1: Company Settings */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <Avatar sx={{ bgcolor: 'rgba(37, 99, 235, 0.08)', color: '#2563EB', width: 36, height: 36 }}>
              <CompanyIcon sx={{ fontSize: 20 }} />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Company Branding Settings
            </Typography>
          </Box>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Company Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                slotProps={{
                  input: { sx: { borderRadius: 3 } },
                }}
              />
            </Grid>

            {/* Logo Select */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, border: '1px solid', borderColor: 'divider', p: 1, px: 2, borderRadius: 3, bgcolor: 'background.default', height: '100%', boxSizing: 'border-box' }}>
                <Avatar sx={{ bgcolor: 'primary.main', background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)', width: 36, height: 36, fontWeight: 800, fontSize: '0.9rem' }}>
                  {companyName.charAt(0)}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>Logo Graphic</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{companyName.split(' ')[0]}_logo.png</Typography>
                </Box>
                <Button size="small" variant="outlined" startIcon={<CameraIcon />} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
                  Upload
                </Button>
              </Box>
            </Grid>

            {/* Theme override */}
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={<Switch checked={themeMode === 'dark'} onChange={toggleTheme} />}
                label={
                  <Box sx={{ ml: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>Enable Cyber Dark Mode Theme</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                      Switches the visual frame template between high-fidelity dark slate and light indigo templates.
                    </Typography>
                  </Box>
                }
              />
            </Grid>
          </Grid>

          <Divider sx={{ borderStyle: 'dashed', mb: 4 }} />

          {/* Section 2: User Permissions Access Matrix */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.08)', color: '#10B981', width: 36, height: 36 }}>
              <SecurityIcon sx={{ fontSize: 20 }} />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Granular Role & Page Access Matrices
            </Typography>
          </Box>

          <Grid container spacing={4} sx={{ mb: 4 }}>
            {/* Role Permissions */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>Role Function Access Rules</Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <FormControlLabel
                    control={<Checkbox checked={rolePermissions.adminAll} onChange={() => handleRolePermChange('adminAll')} disabled />}
                    label={<Typography variant="body2" sx={{ fontWeight: 700 }}>Administrators possess full read/write</Typography>}
                  />
                  <FormControlLabel
                    control={<Checkbox checked={rolePermissions.techAddActivity} onChange={() => handleRolePermChange('techAddActivity')} />}
                    label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Technicians permit Activity Registration</Typography>}
                  />
                  <FormControlLabel
                    control={<Checkbox checked={rolePermissions.techEditActivity} onChange={() => handleRolePermChange('techEditActivity')} />}
                    label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Technicians permit Activity Modifications</Typography>}
                  />
                  <FormControlLabel
                    control={<Checkbox checked={rolePermissions.workerAddUser} onChange={() => handleRolePermChange('workerAddUser')} />}
                    label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Workers permit user registry additions</Typography>}
                  />
                </Box>
              </Paper>
            </Grid>

            {/* Page Access */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>Authorized Navigation Screens</Typography>
                
                <Grid container spacing={1}>
                  <Grid size={{ xs: 6 }}>
                    <FormControlLabel
                      control={<Checkbox checked={pageAccess.dashboard} onChange={() => handlePageAccessChange('dashboard')} />}
                      label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Dashboard</Typography>}
                    />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <FormControlLabel
                      control={<Checkbox checked={pageAccess.addUser} onChange={() => handlePageAccessChange('addUser')} />}
                      label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Add User</Typography>}
                    />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <FormControlLabel
                      control={<Checkbox checked={pageAccess.userManagement} onChange={() => handlePageAccessChange('userManagement')} />}
                      label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Registry Grid</Typography>}
                    />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <FormControlLabel
                      control={<Checkbox checked={pageAccess.reports} onChange={() => handlePageAccessChange('reports')} />}
                      label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Analytics</Typography>}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <FormControlLabel
                      control={<Checkbox checked={pageAccess.settings} onChange={() => handlePageAccessChange('settings')} disabled />}
                      label={<Typography variant="body2" sx={{ fontWeight: 700 }}>Settings (Root Restricted)</Typography>}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>

          <Divider sx={{ borderStyle: 'dashed', mb: 4 }} />

          {/* Section 3: Notification Settings */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <Avatar sx={{ bgcolor: 'rgba(6, 182, 212, 0.08)', color: '#06B6D4', width: 36, height: 36 }}>
              <NotificationsIcon sx={{ fontSize: 20 }} />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              System & Telemetry Alerts Settings
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
            <FormControlLabel
              control={<Switch checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} />}
              label={
                <Box sx={{ ml: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>Primary Email Notifications</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                    Sends automated daily summaries and compliance flags directly to the root administration inbox.
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={<Switch checked={systemAlerts} onChange={(e) => setSystemAlerts(e.target.checked)} />}
              label={
                <Box sx={{ ml: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>System Telemetry Logs Ticker</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                    Permits real-time notification alerts, task updates, and dynamic activity triggers in the navbar trays.
                  </Typography>
                </Box>
              }
            />
          </Box>

          <Divider sx={{ borderStyle: 'dashed', mb: 4 }} />

          {/* Section 4: Password Policy */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <Avatar sx={{ bgcolor: 'rgba(239, 68, 68, 0.08)', color: '#EF4444', width: 36, height: 36 }}>
              <KeyIcon sx={{ fontSize: 20 }} />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Master Security & Password Policies
            </Typography>
          </Box>

          <Grid container spacing={3} sx={{ mb: 5 }}>
            {/* Rules Checkboxes */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>Complexity Rule Enforcement</Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={<Checkbox checked={passwordPolicy.min8Chars} onChange={() => handlePolicyChange('min8Chars')} />}
                    label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Enforce minimum 8 characters</Typography>}
                  />
                  <FormControlLabel
                    control={<Checkbox checked={passwordPolicy.reqNumber} onChange={() => handlePolicyChange('reqNumber')} />}
                    label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Require at least one numeric digit</Typography>}
                  />
                  <FormControlLabel
                    control={<Checkbox checked={passwordPolicy.reqSpecial} onChange={() => handlePolicyChange('reqSpecial')} />}
                    label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Require at least one special character</Typography>}
                  />
                </Box>
              </Paper>
            </Grid>

            {/* Reset Rules */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', boxSizing: 'border-box' }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>Expiration & Reset Interval</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 2 }}>
                    Forces credentials expiration rosters to reset administrative passwords periodically.
                  </Typography>
                </Box>

                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Reset Expiration Rule"
                  value={resetRule}
                  onChange={(e) => setResetRule(e.target.value)}
                  slotProps={{
                    input: { sx: { borderRadius: 3, fontWeight: 600 } },
                  }}
                >
                  <MenuItem value="30" sx={{ fontWeight: 600 }}>Expire every 30 days</MenuItem>
                  <MenuItem value="90" sx={{ fontWeight: 600 }}>Expire every 90 days</MenuItem>
                  <MenuItem value="180" sx={{ fontWeight: 600 }}>Expire every 180 days</MenuItem>
                  <MenuItem value="0" sx={{ fontWeight: 600 }}>Never expire (Not recommended)</MenuItem>
                </TextField>
              </Paper>
            </Grid>
          </Grid>

          <Divider sx={{ borderStyle: 'dashed', mb: 4 }} />

          {/* Action Row */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              sx={{
                py: 1.2,
                px: 4.5,
                borderRadius: 3.5,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                boxShadow: '0 8px 24px rgba(37, 99, 235, 0.3)',
              }}
            >
              Save System Preferences
            </Button>
          </Box>

        </CardContent>
      </Card>
    </Box>
  );
};
