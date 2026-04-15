import DashboardSummary from "./DashboardSummary";
import DashboardCharts from "./DashboardCharts";
import CustomerList from "./CustomerList";

const DashBoardLayerOne = () => {
  return (
    <>
      <DashboardSummary />
      <DashboardCharts />
      <section className='row gy-4 mt-1'>
        <CustomerList />
      </section>
    </>
  );
};

export default DashBoardLayerOne;
