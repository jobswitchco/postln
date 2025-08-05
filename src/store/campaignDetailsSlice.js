// src/redux/campaignDetailsSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  showDetails: false,
  selectedCampaignId: null,
};

const campaignDetailsSlice = createSlice({
  name: 'campaignDetails',
  initialState,
  reducers: {
    setShowDetails: (state, action) => {
      state.showDetails = action.payload;
    },
    setSelectedCampaignId: (state, action) => {
      state.selectedCampaignId = action.payload;
    },
  },
});

export const { setShowDetails, setSelectedCampaignId } = campaignDetailsSlice.actions;
export default campaignDetailsSlice.reducer;
