import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isConnected: false,
  walletAddress: null,
  refresher: false,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setAddress: (state, action) => {
      state.walletAddress = action.payload;
    },
    setConnection: (state, action) => {
      state.isConnected = action.payload;
    },
    refresh: (state, action) => {
      state.refresher = action.payload;
    },
  },
});

export const { setAddress, setConnection, refresh } = userSlice.actions;
export default userSlice.reducer;
