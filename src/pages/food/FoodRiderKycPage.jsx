import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import FoodModuleLayer from "./FoodModuleLayer";

export default function Page() {
  return <MasterLayout><FoodModuleLayer module="kyc" /></MasterLayout>;
}