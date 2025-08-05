import { configureStore } from "@reduxjs/toolkit";
import brandReducer from './employerSlice';
import creatorReducer from './professionalSlice';

const persistedStateJSON = localStorage.getItem("professionalDetails");
const persistedState = persistedStateJSON
  ? JSON.parse(persistedStateJSON)
  : {};

  const brandPersistedStateJSON = localStorage.getItem("employerDetails");
  const brandPersistedState = brandPersistedStateJSON
    ? JSON.parse(brandPersistedStateJSON)
    : {};

const store = configureStore({
    reducer: {
        employerUser: brandReducer,
        professionalUser: creatorReducer,

    },
    preloadedState: {
        professionalUser: persistedState,
        employerUser: brandPersistedState,
    },

})

export default store;