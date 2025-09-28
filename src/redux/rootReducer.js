import { combineReducers } from "@reduxjs/toolkit";
import transactionReducer from "./slice/transactionSlice";
import showModalReducer from "./slice/modalSlice";
import userReducer from "./slice/userDetails";
import constReducer from "./slice/constSlices";

const rootReducer = combineReducers({
  transaction: transactionReducer,
  user: userReducer,
  showModal: showModalReducer,
  global: constReducer,
});

export default rootReducer;
