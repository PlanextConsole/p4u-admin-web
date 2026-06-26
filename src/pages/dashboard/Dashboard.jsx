import DashboardSummary from "./DashboardSummary";
import DashboardCharts from "./DashboardCharts";
import DashboardInsights from "./DashboardInsights";

const DashBoardLayerOne = () => {
  return (
    <div className='p4u-dashboard-page'>
      <DashboardSummary />
      <DashboardCharts />
      <DashboardInsights />
    </div>
  );
};

export default DashBoardLayerOne;
