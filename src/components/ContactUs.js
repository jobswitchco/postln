import { useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { Container, Typography, Grid, Paper, Divider, Link } from '@mui/material';
import { LocationOn } from '@mui/icons-material';

function SupportContact() {
  useEffect(() => {
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    gtag('js', new Date());
    gtag('config', 'G-FR7630J1YJ');
  }, []);

  return (
    <>
      <header>
        <title>Contact Us | PostLn</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-FR7630J1YJ"></script>
      </header>

      <Navbar />

      <Container sx={{ py: 10 }}>
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          Contact Us
        </Typography>
        <Typography variant="body1" mb={4}>
          Have questions, need support, or want to report a security issue? We're here to help.
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 4 }}>
              <Typography variant="h5" fontWeight="medium" gutterBottom>
                General Inquiries & Support
              </Typography>
              <Typography variant="body1">
                Email: <Link href="mailto:support@postln.com">support@postln.com</Link>
              </Typography>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h5" fontWeight="medium" gutterBottom>
                Sales Inquiries
              </Typography>
              <Typography variant="body1">
                Email: <Link href="mailto:sales@postln.com">sales@postln.com</Link>
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 4 }}>
              <Typography variant="h5" fontWeight="medium" gutterBottom>
                Office Address
              </Typography>
              <Typography variant="body1" display="flex" alignItems="center">
                <LocationOn sx={{ mr: 1 }} />
                Registered & Operational:
              </Typography>
              <Typography variant="body2" mt={1}>
                Plot no - 20, 2nd Floor, 302, <br />
                Behind Lucid Hospital, Kukatpally, <br />
                Hyderabad, Telangana 500072, India.
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="caption" color="text.secondary">
                Linck One Enterprises
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <Footer />
    </>
  );
}

export default SupportContact;