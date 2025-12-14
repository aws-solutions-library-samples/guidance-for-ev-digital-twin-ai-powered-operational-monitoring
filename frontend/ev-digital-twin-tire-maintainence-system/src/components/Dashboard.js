import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MapView from './MapView';
import InteractiveMapView from './InteractiveMapView';
import ConnVehicle from './ConnVehicle';
import Vehicle1ConnVehicle from './vehicle1/Vehicle1ConnVehicle';
import Vehicle2ConnVehicle from './vehicle2/Vehicle2ConnVehicle';
import Vehicle3ConnVehicle from './vehicle3/Vehicle3ConnVehicle';
import Vehicle4ConnVehicle from './vehicle4/Vehicle4ConnVehicle';
import Vehicle5ConnVehicle from './vehicle5/Vehicle5ConnVehicle';
import Vehicle1Tires from './vehicle1/Vehicle1Tires';
import TiresPage from './Tires';
import BatteryScreen from './BatteryScreen';
import Motor from './motor';
import Vehicle2Motor from './vehicle2/Vehicle2Motor';
import Invertor from './Invertor';
import Vehicle3Inverter from './vehicle3/Vehicle3Inverter';
import EnergyManagement from './EnergyManagement';
import Charger from './Charger';
import Fleet from './fleet/FleetMgmt';
import FleetPortal from './fleet/FleetPortal';

const Dashboard = () => {
  return (
    <Routes>
      <Route path="/" element={<InteractiveMapView />} />
      <Route path="/mapview" element={<MapView />} />
      <Route path="/car/EV-1001" element={<Vehicle1ConnVehicle />} />
      <Route path="/car/2T1BURHE8JC987654" element={<Vehicle1ConnVehicle />} />
      <Route path="/car/1HGBH41JXMN109876" element={<Vehicle5ConnVehicle />} />
      <Route path="/car/3VWDX7AJ9DM456321" element={<Vehicle3ConnVehicle />} />
      <Route path="/car/WBADT43452G123789" element={<Vehicle4ConnVehicle />} />
      <Route path="/car/5YJSA1E26HF123456" element={<Vehicle2ConnVehicle />} />
      <Route path="/car/:carId" element={<ConnVehicle />} />
      <Route path="/car/2T1BURHE8JC987654/tires" element={<Vehicle1Tires />} />
      <Route path="/car/EV-1001/tires" element={<Vehicle1Tires />} />
      <Route path="/car/5YJSA1E26HF123456/motor" element={<Vehicle2Motor />} />
      <Route path="/car/3VWDX7AJ9DM456321/invertor" element={<Vehicle3Inverter />} />
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