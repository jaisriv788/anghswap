import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  routerAddress: "0x33c2CAdA17d2F0a11aE9c71c3e981F3Ef2355993",
  factoryAddress: "0x0B8E8aD33C2531445cB8F53f51bf309929968EDa",
  usdtAddress: "0xd1b7916d20F3b9D439B66AF25FC45f6A28c157d0",
  rpc_one: "https://rpc.anghscan.org/",
};
// 0x7a96720Ce8600E52E0b61e175e48fC33716f8781
// 0xB0FBB6b2d81D2Eb75982e6d9c733B52e18ddE561
const constSlice = createSlice({
  name: "router",
  initialState,
  reducers: {},
});

// export const {  } = modalSlice.actions;
export default constSlice.reducer;
