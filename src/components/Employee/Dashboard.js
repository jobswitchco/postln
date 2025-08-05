import { useState, useEffect } from 'react';
import {
  Grid,
  useTheme,
} from '@mui/material';
import useMediaQuery from "@mui/material/useMediaQuery";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";
import PostComposer from './PostComposer';
import TopicNewsGrid from './TopicNewsGrid';
import TopicPostComposer from './TopicPostComposer';




const DashboardOverview = () => {
  // const baseUrl = "http://localhost:8001/usersOn";
      const baseUrl="/api/usersOn";

    const navigate = useNavigate();
    const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
       const [ loading, setLoading ] = useState(false);
     


    const handleSessionExpired = () => {
            toast.error("Session expired. Please log in again.");
            setTimeout(() => {
  
              navigate('/professional/login');
              
            }, 1500);
          };
  

            useEffect(() => {
                    const verifyToken = async () => {
                      setLoading(true);
                    
                      try {
                        const res = await axios.get(`${baseUrl}/verify-login-token`, { withCredentials: true });

                        if (res.data.valid) {
                          // await fetchData();
                        } else {
                          handleSessionExpired();
                        }
                      } catch (error) {
                        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                          handleSessionExpired();
                        } else {
                          toast.error("Network error, please try again later.");
                        }
                      } finally {
                        setLoading(false);
                      }
                    };
                    
                
                    verifyToken();
                  }, []);


  return (

<>

{isMobile ? (
<>
    <Grid
  container
  spacing={{ xs: 2, sm: 4, md: 5 }}
  sx={{ mb: 6 }}
>
  

  <Grid item xs={12} md={6} lg={6}>
   <PostComposer />

  </Grid>

</Grid>
   <TopicNewsGrid />
   </>

) : (
  <>
    <Grid
  container
  spacing={{ xs: 2, sm: 4, md: 5 }}
  sx={{ mb: 6 }}
>
  

  <Grid item xs={12} md={6} lg={6}>
   <PostComposer />

  </Grid>

  <Grid item xs={12} md={6} lg={6}>
   <TopicPostComposer />
    
  </Grid>

</Grid>
   <TopicNewsGrid />
   </>
)}

   </>
  );
};

export default DashboardOverview;
