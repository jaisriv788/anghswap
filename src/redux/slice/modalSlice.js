import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  showSettingModal: false,
  showErrorModal: false,
  showSuccessModal: false,
  errorMessage: "",
  successMessage: "",
};

const modalSlice = createSlice({
  name: "show_modal",
  initialState,
  reducers: {
    isSettingModalVisible: (state, action) => {
      state.showSettingModal = action.payload;
    },
    isSuccessModalVisible: (state, action) => {
      state.showSuccessModal = action.payload;
    },
    isErrorModalVisible: (state, action) => {
      state.showErrorModal = action.payload;
    },
    setSuccessMessage: (state, action) => {
      state.successMessage = action.payload;
    },
    setErrorMessage: (state, action) => {
      state.errorMessage = action.payload;
    },
  },
});

export const {
  isSettingModalVisible,
  isSuccessModalVisible,
  isErrorModalVisible,
  setSuccessMessage,
  setErrorMessage,
} = modalSlice.actions;
export default modalSlice.reducer;
