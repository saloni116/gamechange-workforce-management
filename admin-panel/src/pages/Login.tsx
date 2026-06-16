import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  IconButton,
  InputAdornment,
  CircularProgress,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Avatar,
  Fade,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  LockOutlined as LockOutlinedIcon,
} from '@mui/icons-material';

interface ThemeProfile {
  id: string;
  name: string;
  badge: string;
  primaryColor: string;
  secondaryColor: string;
  accentGradient: string;
  glowBackground: string;
  buttonGradient: string;
  buttonHoverGradient: string;
  cardBorder: string;
  overlayGradient: string;
  brandTextGradient: string;
}

const corporateTheme: ThemeProfile = {
  id: 'corporate',
  name: 'Corporate Slate',
  badge: 'SECURE',
  primaryColor: '#3B82F6',
  secondaryColor: '#10B981',
  accentGradient: 'linear-gradient(135deg, #3B82F6 0%, #10B981 100%)',
  glowBackground: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, rgba(16, 185, 129, 0.01) 70%)',
  buttonGradient: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
  buttonHoverGradient: 'linear-gradient(135deg, #1D4ED8 0%, #1e3a8a 100%)',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  overlayGradient: 'linear-gradient(135deg, rgba(8, 9, 14, 0.95) 0%, rgba(15, 23, 42, 0.85) 100%)',
  brandTextGradient: 'linear-gradient(135deg, #60A5FA 0%, #34D399 100%)',
};

export const Login: React.FC = () => {
  const { login } = useApp();
  const activeTheme = corporateTheme;

  // Form Fields
  const [userId, setUserId] = useState('ADMIN001');
  const [password, setPassword] = useState('SYS001');

  // UI Control States
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Forgot Password simulated modal
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Validation Error States
  const [userIdError, setUserIdError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Toggle Visibility
  const handleClickShowPassword = () => setShowPassword(!showPassword);

  // Client-side validations
  const validateForm = (): boolean => {
    let isValid = true;

    // Validate User ID / Email
    if (!userId.trim()) {
      setUserIdError('User ID or Email is required');
      isValid = false;
    } else if (userId.length < 3) {
      setUserIdError('User ID must be at least 3 characters');
      isValid = false;
    } else {
      setUserIdError(null);
    }

    // Validate Password
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 4) {
      setPasswordError('Password must be at least 4 characters');
      isValid = false;
    } else {
      setPasswordError(null);
    }

    return isValid;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Simulate credential checks
      const success = await login(userId, password);
      if (!success) {
        setLoginError('Invalid credentials. Please verify your User ID or Password.');
      }
    } catch {
      setLoginError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      return;
    }
    setForgotSuccess(true);
    setTimeout(() => {
      setForgotOpen(false);
      setForgotSuccess(false);
      setForgotEmail('');
    }, 2000);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'row',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1200,
        boxSizing: 'border-box',
        overflow: 'hidden',
        background: '#0B0F19',
        fontFamily: '"Outfit", sans-serif',
      }}
    >
      {/* Left side: Beautiful industrial branding panel with dynamic dark overlays */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          width: '50%',
          minHeight: '100vh',
          position: 'relative',
          backgroundImage: 'url(/images/transformer_login.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          p: 8,
          color: '#ffffff',
          boxSizing: 'border-box',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: activeTheme.overlayGradient,
            zIndex: 1,
          }
        }}
      >
        <Box sx={{ zIndex: 2, maxWidth: 520, position: 'relative' }}>
          {/* Active portal badge */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              bgcolor: 'rgba(255, 255, 255, 0.06)',
              border: `1px solid rgba(255, 255, 255, 0.12)`,
              borderRadius: 5,
              py: 0.6,
              px: 1.8,
              mb: 3,
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: activeTheme.primaryColor,
              }}
            />
            <Typography variant="caption" sx={{ letterSpacing: '0.15em', fontWeight: 900, textTransform: 'uppercase', color: '#FFFFFF' }}>
              WORKFORCE OPERATIONS SUITE
            </Typography>
          </Box>

          <Typography
            variant="h3"
            sx={{
              fontWeight: 900,
              mb: 3,
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              textShadow: '0 2px 12px rgba(0,0,0,0.8)',
              background: activeTheme.brandTextGradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Workforce Management Portal
          </Typography>
          
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 500, mb: 4, lineHeight: 1.65, fontSize: '1.05rem', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
            Secure system administration panel for coordinating shift schedules, tracking production metrics, and managing workforce activities.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'center' }}>
            <Avatar
              sx={{
                bgcolor: `${activeTheme.primaryColor}1a`,
                border: `1.5px solid ${activeTheme.primaryColor}4d`,
                width: 54,
                height: 54,
              }}
            >
              <Typography sx={{ fontSize: '1.45rem' }}>💼</Typography>
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.02em' }}>GameChange BOS</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', fontWeight: 700, letterSpacing: '0.05em' }}>Standard Operating Suite</Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Right side: Login form container */}
      <Box
        sx={{
          width: { xs: '100%', md: '50%' },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          px: { xs: 2.5, sm: 5 },
          boxSizing: 'border-box',
          background: 'radial-gradient(circle at 50% 50%, rgba(16, 17, 24, 0.99) 0%, rgba(8, 8, 12, 0.99) 100%)',
        }}
      >
        {/* Glow circles inside the form side synced with active theme colors */}
        <Box
          sx={{
            position: 'absolute',
            width: { xs: 260, sm: 480 },
            height: { xs: 260, sm: 480 },
            borderRadius: '50%',
            background: activeTheme.glowBackground,
            top: '15%',
            right: '15%',
            filter: 'blur(75px)',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />

        <Fade in timeout={800}>
          <Card
            sx={{
              width: '100%',
              maxWidth: 440,
              borderRadius: '20px',
              backdropFilter: 'blur(30px)',
              background: 'rgba(15, 15, 23, 0.72)',
              border: `1px solid ${activeTheme.cardBorder}`,
              boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.8)',
              zIndex: 1,
              overflow: 'hidden',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: activeTheme.accentGradient,
              }
            }}
          >
            <CardContent sx={{ p: { xs: 4, sm: 5 } }}>
              {/* Logo Section */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
                <Avatar
                  sx={{
                    background: activeTheme.accentGradient,
                    width: 58,
                    height: 58,
                    mb: 2,
                    boxShadow: `0 8px 25px rgba(59, 130, 246, 0.3)`,
                  }}
                >
                  <LockOutlinedIcon sx={{ fontSize: 28, color: '#FFFFFF' }} />
                </Avatar>

                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 900,
                    letterSpacing: '-0.04em',
                    mb: 0.8,
                    textAlign: 'center',
                    background: activeTheme.brandTextGradient,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  GameChange BoS
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.55)', fontWeight: 600, textAlign: 'center', letterSpacing: '0.01em' }}>
                  Secure Administration Portal
                </Typography>
              </Box>

              {loginError && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 3, fontWeight: 500, bgcolor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#EF4444' }}>
                  {loginError}
                </Alert>
              )}

              {/* Input Form */}
              <Box component="form" onSubmit={handleLoginSubmit} noValidate>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="userId"
                  label="Employee ID or Email"
                  name="userId"
                  autoComplete="username"
                  autoFocus
                  value={userId}
                  onChange={(e) => {
                    setUserId(e.target.value);
                    if (userIdError) setUserIdError(null);
                  }}
                  error={Boolean(userIdError)}
                  helperText={userIdError}
                  slotProps={{
                    input: {
                      sx: {
                        height: 56,
                        color: '#FFFFFF',
                        bgcolor: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          border: `1.5px solid ${activeTheme.primaryColor}66`,
                        },
                        '&.Mui-focused': {
                          border: `2px solid ${activeTheme.primaryColor}`,
                          boxShadow: `0 0 12px ${activeTheme.primaryColor}26`,
                        }
                      },
                    },
                  }}
                  sx={{
                    mb: 2.5,
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.4)', fontWeight: 600 },
                    '& .MuiInputLabel-root.Mui-focused': { color: activeTheme.primaryColor },
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                  }}
                />

                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  error={Boolean(passwordError)}
                  helperText={passwordError}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleClickShowPassword}
                            edge="end"
                            sx={{ color: 'rgba(255,255,255,0.45)' }}
                          >
                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                      sx: {
                        height: 56,
                        color: '#FFFFFF',
                        bgcolor: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          border: `1.5px solid ${activeTheme.primaryColor}66`,
                        },
                        '&.Mui-focused': {
                          border: `2px solid ${activeTheme.primaryColor}`,
                          boxShadow: `0 0 12px ${activeTheme.primaryColor}26`,
                        }
                      },
                    },
                  }}
                  sx={{
                    mb: 1.5,
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.4)', fontWeight: 600 },
                    '& .MuiInputLabel-root.Mui-focused': { color: activeTheme.primaryColor },
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                  }}
                />

                {/* Forgot Password trigger */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3.5 }}>
                  <Link
                    component="button"
                    type="button"
                    variant="body2"
                    onClick={() => setForgotOpen(true)}
                    sx={{
                      fontWeight: 700,
                      color: activeTheme.primaryColor,
                      textDecoration: 'none',
                      letterSpacing: '0.02em',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    Forgot Password?
                  </Link>
                </Box>

                {/* Login Submit Button */}
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  sx={{
                    py: 1.7,
                    borderRadius: 3,
                    fontSize: '1rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    textTransform: 'none',
                    color: '#FFFFFF',
                    background: activeTheme.buttonGradient,
                    boxShadow: `0 8px 24px rgba(59, 130, 246, 0.25)`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: activeTheme.buttonHoverGradient,
                      boxShadow: `0 12px 30px rgba(59, 130, 246, 0.4)`,
                      transform: 'translateY(-1px)',
                    }
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} sx={{ color: '#FFFFFF' }} />
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </Box>

              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.02em' }}>
                  Demo Mode Active. Sign in with Employee ID: ADMIN001 & Password: SYS001.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Fade>
      </Box>

      {/* Forgot Password Simulated Modal */}
      <Dialog
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 4,
              px: 2.5,
              py: 1.5,
              maxWidth: 410,
              bgcolor: '#0f0f15',
              border: `1px solid rgba(255,255,255,0.08)`,
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              color: '#FFFFFF',
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1, color: '#FFFFFF' }}>Reset Password</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 3, fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>
            Enter your email address and we will issue reset instructions.
          </Typography>
          {forgotSuccess ? (
            <Alert severity="success" sx={{ borderRadius: 3, bgcolor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10B981' }}>
              Reset Link successfully issued! Returning...
            </Alert>
          ) : (
            <Box component="form" onSubmit={handleForgotSubmit}>
              <TextField
                autoFocus
                required
                fullWidth
                label="Email Address"
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                slotProps={{
                  input: {
                    sx: {
                      color: '#FFFFFF',
                      bgcolor: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 3,
                    }
                  }
                }}
                sx={{
                  mt: 1.5,
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.4)', fontWeight: 600 },
                  '& .MuiInputLabel-root.Mui-focused': { color: activeTheme.primaryColor },
                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ pb: 3, px: 3, gap: 1 }}>
          <Button
            onClick={() => setForgotOpen(false)}
            sx={{
              fontWeight: 700,
              color: 'rgba(255,255,255,0.6)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleForgotSubmit}
            variant="contained"
            disabled={forgotSuccess}
            sx={{
              fontWeight: 800,
              background: activeTheme.accentGradient,
              borderRadius: 3,
              px: 3,
              '&:hover': {
                background: activeTheme.buttonHoverGradient,
              }
            }}
          >
            Send Link
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
