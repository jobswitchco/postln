import { createSlice } from "@reduxjs/toolkit";

const storedState = JSON.parse(localStorage.getItem("employerDetails"));


const employerUserSlice = createSlice({
    name: 'employerUser',

      
    initialState: {
        isLoggedIn: storedState?.isLoggedIn || false,
        user_email: storedState?.user_email || '',
        user_id: storedState?.user_id || '',
    },

    reducers: {

        login: (state, action) => {
            state.isLoggedIn = true;
            state.user_email = action.payload.user_email;
            state.user_id = action.payload.user_id;
        
            const employerDetails = {
              isLoggedIn: state.isLoggedIn,
              user_email: state.user_email,
              user_id: state.user_id,
             
            };
        
            localStorage.setItem("employerDetails", JSON.stringify(employerDetails));
          },

        logout: (state) => {
            state.isLoggedIn = false;
            state.user_email = '';
            state.user_id = '';
           
            localStorage.removeItem("employerDetails");
        },
    },

});

export const { login, logout } = employerUserSlice.actions;
export default employerUserSlice.reducer;