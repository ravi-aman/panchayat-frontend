import DashboardNavbar from '../../components/dashboard/DashboardNavbar';
import Sidebar from '../../components/dashboard/Sidebar';
import Tabs from '../../components/dashboard/Tabs';
import MobileNavbar from '../../components/dashboard/MobileNavbar';
import { Outlet } from 'react-router-dom';

const DashboardLayout = () => {
  return (
    <div className="flex h-full bg-gray-100">
      <div className="flex-1 flex flex-col">
        <div className="bg-white hidden md:block">
          <DashboardNavbar />
        </div>
        <div className="md:hidden fixed top-0 left-0 right-0 z-[9999]">
          <MobileNavbar />
        </div>
        <div className="flex h-full w-full">
          <div className="hidden md:flex">
            <Sidebar />
          </div>
          <div className="flex md:mt-[5rem] md:ml-[18rem] md:w-[75%] w-full h-full max-sm:pt-14">
            <Outlet />
          </div>

          <div className="md:hidden fixed ">
            <Tabs />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
