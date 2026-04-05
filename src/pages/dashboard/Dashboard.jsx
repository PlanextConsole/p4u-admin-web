import DashboardSummary from "./DashboardSummary"; 
import UsersOverviewOne from "../../components/child/UsersOverviewOne";
import CustomerList from "./CustomerList"; 
import GeneratedContent from "../../components/child/GeneratedContent"; 

const DashBoardLayerOne = () => {
  return (
    <> 
        <DashboardSummary />
      <section className='row gy-4 mt-1'>  
        <CustomerList />  
      </section>
    </>
  );
};

export default DashBoardLayerOne;
