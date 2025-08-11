import { useState, useEffect } from 'react'
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Link,
  Grid,
  Rating, 
  Avatar, 
  Stack,
  Button
} from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import logo from "../../images/postln_logo.svg";
import { toast } from "react-toastify";
import LinkedInIcon from '@mui/icons-material/LinkedIn';









function LinkedInUserLogin() {

  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  // const baseUrl = "http://localhost:8001/usersOn";
      const baseUrl="/api/usersOn";

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const CLIENT_ID = "867k4359a94ps3";
  // const REDIRECT_URI = "http://localhost:4700/auth/linkedin/callback";
  const REDIRECT_URI = "http://www.postln.com/auth/linkedin/callback";
  const STATE = "DCEEFWF45453sdffef424";
  const SCOPE = "openid profile email w_member_social";


   useEffect(() => {
            const verifyToken = async () => {
              setLoading(true);
            
              try {
                const res = await axios.get(`${baseUrl}/verify-login-token`, { withCredentials: true });
            
                if (res.data.valid) {

                   await isWorkmailVerified();
                  
                } else {
                }
              } catch (error) {
                if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                } else {
                }
              } finally {
                setLoading(false);
              }
            };
            
        
            verifyToken();
          }, []);
  

   const handleSignIn = () => {
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}&state=${STATE}&scope=${encodeURIComponent(SCOPE)}`;
    window.location.href = authUrl;
  };

   async function isWorkmailVerified() {
        try {
      
          const res = await axios.post(`${baseUrl}/are-topics-added`, { }, {withCredentials : true});
  
          if (res.data.added) {
              navigate("/professional/dashboard");
         
          } else {
            navigate("/select/category");
          }
        } catch (error) {
          if (error.response?.status === 401 || 400 || 403) {
            toast.error("Session expired. Please log in again.");
          } else {
            toast.error("Network Error. Please log in again.");
          }
        } finally {
          setIsLoading(false);
        }
      }
  



  return (
    <>
{/* <Grid container spacing='2'> */}

{isSmallScreen ? ( 

<Grid item xs={12} paddingX={2}>
  

{loading ? (
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', marginTop: '30%' }}>
<CircularProgress color= 'success' />
</div>
) : ( <>

<Box position="relative" minHeight="100vh">
  {/* Top-left Logo */}
  <Box position="absolute" top={15}>
    <Typography variant="h4">
      <a href="/">
        <img
          className="img-fluid"
          src={logo}
          alt="postln"
          width={110}
        />
      </a>
    </Typography>
  </Box>

  {/* Centered Login Box */}
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="100vh"
  >
    <Box
      display="flex"
      flexDirection="column"
      maxWidth={450}
      padding={1}
    >
     <button onClick={handleSignIn} style={{ padding: '10px 20px', fontSize: '16px' }}>
      Sign in with LinkedIn
    </button>

      <Typography variant="body2" sx={{ marginTop: '5px' }}>
        I agree to{" "}
        <Link
          href="https://postln.com/terms"
          target="_blank"
          underline="none"
          sx={{ color: '#362FD9' }}
        >
          PostLn's Terms of Service
        </Link>
      </Typography>
    </Box>
  </Box>
</Box>



    </>)}


</Grid> ) : (

<Grid container sx={{ height: '100vh', overflow: 'hidden', p : 1}}>
  {/* Left Section */}
  <Grid item xs={5} md={5} lg={5} sx={{ background: '#362FD9', borderRadius: '26px', overflowY: 'auto' }}>
    <Box display="flex" flexDirection="column" margin="auto" p={1}>
      <Typography textAlign="start" sx={{
        fontSize: '46px',
        fontWeight: '500',
        color: 'white',
        paddingX: '20px',
        pt: 10
      }}>
        Welcome to your Next Career Move.
      </Typography>

      <Typography textAlign="start" sx={{ fontSize: '22px', color: 'white', paddingX: '20px' }}>
        Unlock new opportunities for unmatched visibility and growth.
      </Typography>
    </Box>

    <Box display="flex" flexDirection="column" margin="auto" padding={1}>
      <Rating
        sx={{ paddingX: '20px' }}
        name="half-rating-read"
        defaultValue={4.5}
        precision={0.5}
        readOnly
      />

      <Typography textAlign="start" sx={{
        fontSize: '14px',
        color: 'white',
        paddingX: '20px',
        paddingTop: '2%'
      }}>
        "We're excited about this game-changing platform for job switching..."
      </Typography>

      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        sx={{ marginTop: '5%', paddingX: '20px' }}
      >
        <Avatar alt="Karan Jaiswal" sx={{ width: 40, height: 40 }} />
        <Box>
          <Typography sx={{ fontSize: '14px', color: 'white' }}>
            Karan Jaiswal
          </Typography>
          <Typography sx={{ fontSize: '12px', color: '#E4F1FF' }}>
            Recruitment, BuzzerStudio
          </Typography>
        </Box>
      </Stack>
    </Box>
  </Grid>

  {/* Right Section */}
  <Grid item xs={7} md={7} lg={7} sx={{ position: 'relative' }}>
    {isLoading ? (
      <Box display="flex" alignItems="center" justifyContent="center" height="100%">
        <CircularProgress color='success' />
      </Box>
    ) : (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100%"
        position="relative"
      >
        {/* Logo absolute */}
        <Box position="absolute" top={16} left={24}>
          <a href="/">
            <img className="img-fluid" src={logo} alt="postln" width={120} />
          </a>
        </Box>

        {/* Center content */}
        <Box
      minHeight="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      textAlign="center"
      sx={{
        px: 2,
      }}
    >

      {/* Headline */}
      <Typography gutterBottom sx={{ fontSize : '28px', fontWeight : 600, mb: 2}}>
        Let's get started
      </Typography>

      {/* Subtext */}
      <Typography variant="subtitle1" color="text.secondary" maxWidth={400} mb={4}>
        Instantly create AI-powered LinkedIn content tailored to your voice and audience.
      </Typography>

      {/* LinkedIn Button */}
      <Button
        variant="contained"
        onClick={handleSignIn}
        startIcon={<LinkedInIcon />}
        sx={{
          backgroundColor: '#1B56FD',
          textTransform: 'none',
          fontSize: '16px',
          fontWeight: 400,
          px: 4,
          py: 0.8,
          borderRadius: 2,
          '&:hover': {
            backgroundColor: '#004182',
          },
        }}
      >
        Continue with LinkedIn
      </Button>

      {/* Subtext */}
      <Typography
        variant="body2"
        color="text.secondary"
        mt={3}
        maxWidth={380}
      >
        Connect with LinkedIn to unlock smart scheduling and AI-personalized content creation.
      </Typography>
    </Box>
      </Box>
    )}
  </Grid>
</Grid>

)}




    </>
  )
}

export default LinkedInUserLogin