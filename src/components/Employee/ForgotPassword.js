import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { Box, TextField, Button, Typography, Grid, ClickAwayListener, Dialog, DialogTitle, DialogContent, DialogActions} from "@mui/material";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CircularProgress from '@mui/material/CircularProgress';



function ForgotPassword() {
  const navigate = useNavigate();
  const [email, getEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [password, setPassword] = useState("");
  const [confPassword, setConfPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogForPassword, setDialogForPassword] = useState(false);
  // const baseUrl = "http://localhost:8001/usersOn";
      const baseUrl="/api/usersOn";







  const handleClickAway = () => {
    //this function keeps the dialogue open, even when user clicks outside the dialogue. dont delete this function
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };

  const handleDialogClosePassword = () => {
    setDialogForPassword(false);
  };


  const checkEmail = async (e) => {
    e.preventDefault();

    setLoading(true);


    if(!email){
        toast.warning("Enter valid email address");
      }

      else {


      await axios.post(baseUrl + "/check-email-exists-sendMail",
        { email: email.toLowerCase() },
      )
      .then((res) => {


            if(!res.data.exists){

          toast.error("Email does not exists");
          setLoading(false);


            }
            else if(res.data.exists){
                
                setLoading(false);
                setIsDialogOpen(true);
                
            }

      })
      .catch((err) => {


        if (err.response && err.response.data.error === "User does not exists!") {
          toast.warning("User does not exists");
        } 

        else if (err.response && err.response.data.error === "email, password mismatch") {
          toast.warning("Invalid email or password");
        } 
        
        else {
          toast.error("An error occurred. Please try again later.");
        }
      });

    }

    
  };


  const checkPin = async (e) => {
    e.preventDefault();

    if(!emailCode){
        toast.warning("Enter valid 6-digit Pin");
      }

      else {


      await axios.post(baseUrl + "/check-resetPin-withDb",
        { email: email.toLowerCase(), pin : emailCode },
      )
      .then((res) => {

            setLoading(true);

            if(!res.data.matching){

                setLoading(false);
                toast.error("Invalid Pin");

            }
            else if(res.data.matching){
                
                setLoading(false);
                setIsDialogOpen(false);
                setDialogForPassword(true);
                
            }

      })
      .catch((err) => {


        if (err.response && err.response.data.error === "User does not exists!") {
          toast.warning("User does not exists");
        } 

        else if (err.response && err.response.data.error === "email, password mismatch") {
          toast.warning("Invalid email or password");
        } 
        
        else {
          toast.error("An error occurred. Please try again later.");
        }
      });

    }

    
  };

  const updatePassword = async (e) => {
    e.preventDefault();

    setLoading(true);


    if(!password){
        setLoading(false);
        toast.warning("Enter valid password");
      }

      else if(password !== confPassword){
        setLoading(false);
        toast.warning("Passwords are not matching");

      }

      else {


      await axios.post(baseUrl + "/update-password",
        { email: email.toLowerCase(), password : password },
        {withCredentials: true}
      )
      .then((res) => {


            if(!res.data.success){

                setLoading(false);
                toast.error("Password update failed. Please try again.");

            }
            else if(res.data.success){
                
                setLoading(false);
                setDialogForPassword(false);
                toast.success("Password updated successfully. Please login to continue...");
          
                setTimeout(() => {

                    navigate("/login");
                    
                }, 2000);

                
            }

      })
      .catch((err) => {


        if (err.response && err.response.data.error === "User does not exists!") {
          toast.warning("User does not exists");
        } 

        else if (err.response && err.response.data.error === "email, password mismatch") {
          toast.warning("Invalid email or password");
        } 
        
        else {
          toast.error("An error occurred. Please try again later.");
        }
      });

    }

    
  };


  return (
    <>
      <Grid container spacing="1" sx={{ height: '100vh' }}>


        
        
        <Grid item xs={12}>


          <form action="#" method="post">

            <Box
              display="flex"
              flexDirection={"column"}
              maxWidth={450}
              margin="auto"
              marginTop={20}
              padding={1}
            >
              <Typography variant="h5">
                Forgot Password
              </Typography>

              <Typography sx={{fontSize: '16px', color: '#A9A9A9', marginTop: '20px'}} >
                A 6 digit code will be sent over mail to reset your password.
              </Typography>

              <TextField
                type="email"
                id="email"
                onChange={(e) => {
                  getEmail(e.target.value);
                }}
                margin="normal"
                variant="outlined"
                label="Enter Email"
              />

              <Button
                type="submit"
                onClick={checkEmail}
                variant="contained"
                sx={{
                  marginTop: 2,
                  textTransform: "capitalize",
                  fontWeight: "400",
                  fontSize: 16,
                  background: '#362FD9'
                }}
                size="large"
              >
                Send Code
              </Button>
              <ToastContainer autoClose= {3000}/>


          
            </Box>
            
          </form>
        </Grid>


        

      </Grid>


      {email && (
        <ClickAwayListener onClickAway={handleClickAway}>
          <Dialog
            open={isDialogOpen}
            onClose={handleDialogClose}
            disableEscapeKeyDown
            keepMounted
          >
            <DialogTitle>Verify Email</DialogTitle>
            <DialogContent dividers>
          
            <Typography sx={{fontSize: '16px', marginTop: '5px'}} >
                Please enter 6-digit code which was sent to {email}
              </Typography>

              <TextField
                type="email"
                id="email"
                onChange={(e) => {
                    setEmailCode(e.target.value);
                }}
                margin="normal"
                variant="outlined"
                label="6-digit code"
                value={emailCode}
              ></TextField>

        </DialogContent>
            <DialogActions>
              <Button onClick={()=> setIsDialogOpen(false)} color="primary" sx={{ textTransform : 'none'}}>
                Cancel
              </Button>
              <Button color="success" onClick={checkPin}sx={{ borderRadius : '18px', backgroundColor : '#67AE6E', color : '#FFFFFF', px: 3, textTransform : 'none'}}>
                Submit
              </Button>
            </DialogActions>
          </Dialog>
        </ClickAwayListener>
      )}

            {emailCode && (
                    <ClickAwayListener onClickAway={handleClickAway}>
                    <Dialog
                        open={dialogForPassword}
                        onClose={handleDialogClosePassword}
                        disableEscapeKeyDown
                        keepMounted
                    >
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogContent dividers>
                    
                        <Typography sx={{fontSize: '16px', marginTop: '5px'}} >
                        Just type it twice and try not to forget it.
                        </Typography>

                        <div style={{ marginBottom: '10px' }}>
          <TextField
            type="password"
            id="password"
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            margin="normal"
            variant="outlined"
            label="Enter Password"
          />
        </div>

        <div>
          <TextField
            type="password"
            id="confPassword"
            onChange={(e) => {
              setConfPassword(e.target.value);
            }}
            margin="normal"
            variant="outlined"
            label="Re-enter Password"
          />
          </div>

                    </DialogContent>
                        <DialogActions>
                        <Button onClick={()=> setDialogForPassword(false)} color="primary">
                            Cancel
                        </Button>
                        <Button color="success" onClick={updatePassword} >
                            SUBMIT
                        </Button>
                        </DialogActions>
                    </Dialog>
                    </ClickAwayListener>
                )}


{loading && (
          <CircularProgress
            size={24}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              marginTop: -12, // Center the CircularProgress
              marginLeft: -12, // Center the CircularProgress
            }}
          />
        )}

    </>
  );
}

export default ForgotPassword;
