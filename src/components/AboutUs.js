import { Box, Typography, useMediaQuery, Grid, Card, CardContent, Avatar } from '@mui/material';
import Navbar from './Navbar';
import Footer from './Footer';
import CodeIcon from '@mui/icons-material/Code';
import FavoriteIcon from '@mui/icons-material/Favorite';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';

const AboutUs = () => {
  const isMobile = useMediaQuery('(max-width:600px)');

  return (
    <>
      <Navbar />
      <Box sx={{ padding: isMobile ? 3 : 8, mt: 10 }}>
        <Typography sx={{ fontWeight: 600, fontSize: isMobile ? '32px' : '36px', mb: 2 }}>
          About Us
        </Typography>

        <Typography sx={{ fontWeight: 400, fontSize: isMobile ? '18px' : '22px', mb: 6 }}>
          PostLn was born from a simple frustration: most AI tools either sound robotic or lack the finesse of personal tone. We set out to build something different — a platform that helps creators, founders, and thought leaders sound like themselves, just smarter. With PostLn, your content isn’t just AI-generated — it's enhanced to reflect your voice, your rhythm, your intent.
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 4, boxShadow: 3, height: '100%' }}>
              <CardContent>
                <Avatar sx={{ bgcolor: '#1976d2', mb: 2 }}>
                  <CodeIcon />
                </Avatar>
                <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>
                  Crafted With Purpose
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  Every line of code in PostLn was written with one mission in mind: help professionals express themselves better on LinkedIn. No outsourced fluff — just a tool made by creators, for creators.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 4, boxShadow: 3, height: '100%' }}>
              <CardContent>
                <Avatar sx={{ bgcolor: '#388e3c', mb: 2 }}>
                  <EmojiObjectsIcon />
                </Avatar>
                <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>
                  Creator-First Design
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  We built PostLn by stepping into the shoes of public speakers, entrepreneurs, and creators. The result? A frictionless writing experience designed to enhance — not override — your unique voice.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 4, boxShadow: 3, height: '100%' }}>
              <CardContent>
                <Avatar sx={{ bgcolor: '#d32f2f', mb: 2 }}>
                  <FavoriteIcon />
                </Avatar>
                <Typography sx={{ fontSize: '18px', fontWeight: 600 }}>
                  Built with Intent
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  PostLn isn't just another AI writing tool. Every feature is shaped by real feedback, thoughtful UX, and the belief that content should still feel human — even when AI helps.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 8, maxWidth: 1000 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            A Message From Us
          </Typography>
          <Typography sx={{ fontSize: '18px' }}>
            We know how hard it is to consistently show up on LinkedIn and sound like yourself — especially when time is short and inspiration runs dry. <br />That's why we built PostLn: to take your ideas, your tone, and your structure — and elevate them with the help of AI.<br /><br /> Whether you're a public speaker or a quiet builder, we’re here to help your words reach the right people. Thank you for being part of this journey.
          </Typography>
        </Box>
      </Box>
      <Footer />
    </>
  );
};

export default AboutUs;
