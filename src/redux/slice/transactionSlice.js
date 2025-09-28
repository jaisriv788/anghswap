import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  slippageTolerance: 2.0,
  transactionDeadline: 2,
};

const transactionSettingSlice = createSlice({
  name: "transaction",
  initialState,
  reducers: {
    setSlippage: (state, action) => {
      state.slippageTolerance = action.payload;
    },
    setDeadline: (state, action) => {
      state.transactionDeadline = action.payload;
    },
  },
});

export const { setSlippage, setDeadline } = transactionSettingSlice.actions;
export default transactionSettingSlice.reducer;
