import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MapView from './MapView';
import CarDetail from './CarDetail';
import ConnVehicle from './ConnVehicle';
import TiresPage from './Tires';
import BatteryScreen from './BatteryScreen';
import Motor from './motor';
import Invertor from './Invertor';
import EnergyManagement from './EnergyManagement';
import Charger from './Charger';
import Fleet from './fleet/FleetMgmt';
import FleetPortal from './fleet/FleetPortal';

const Dashboard = () => {
  return (
    <Routes>
      <Route path="/" element={<MapView />} />
      <Route path="/car/:carId" element={<ConnVehicle />} />
      <Route path="/car/:carId/old" element={<CarDetail />} />
      <Route path="/car/:carId/tires" element={<TiresPage />} />
      <Route path="/car/:carId/battery" element={<BatteryScreen />} />
      <Route path="/car/:carId/motor" element={<Motor />} />
      <Route path="/car/:carId/invertor" element={<Invertor />} />
      <Route path="/car/:carId/energymanagement" element={<EnergyManagement />} />
      <Route path="/car/:carId/charger" element={<Charger />} />
      <Route path="/fleet" element={<Fleet />} />
      <Route path="/fleet/portal" element={<FleetPortal />} />
    </Routes>
  );
};

export default Dashboard;