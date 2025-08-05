import { Box, Button, Grid, Typography, useMediaQuery } from '@mui/material';
import { Link } from 'react-router-dom';

const BannerLandpage = () => {
  const isMobile = useMediaQuery('(max-width:600px)');

  return (
    <Box
      sx={{
        background: 'linear-gradient(to right, #000000, #8b5cf6)',
        borderRadius: 4,
        px: isMobile ? 4 : 8,
        py: 10,
        textAlign: 'center',
        color: 'white',
        mx: isMobile ? 2 : 6,
        mt: 8,
        mb: 8,
      }}
    >
      <Typography
        sx={{
          fontFamily : 'Inter',
          fontWeight: 600,
          fontSize: isMobile ? '32px' : '48px',
          mb: 2,
        }}
      >
        Get Started Today!
      </Typography>

      <Typography
        sx={{
          fontSize: isMobile ? '16px' : '20px',
          mb: 5,
          fontWeight: 400,
          fontFamily: 'Inter'
        }}
      >
        Ready to transform your productivity?
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <Link to="/professional/login" style={{ textDecoration: 'none' }}>
          <Button
            variant="outlined"
            sx={{
              borderRadius: 10,
              px: isMobile ? 2 : 4,
              py: 1.5,
              color: 'white',
              borderColor: 'white',
              fontWeight: 400,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)',
              },
            }}
          >
            Try for Free
          </Button>
        </Link>

        <Link to="/how-it-works" style={{ textDecoration: 'none' }}>
          <Button
            variant="outlined"
            sx={{
              borderRadius: 10,
              px: isMobile ? 2 : 4,
              py: 1.5,
              color: 'white',
              borderColor: 'white',
              fontWeight: 400,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)',
              },
            }}
          >
            See How it Works
          </Button>
        </Link>
      </Box>
    </Box>
  );
};

export default BannerLandpage;
