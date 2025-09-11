import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import MapView from './components/MapView';
import CarDetail from './components/CarDetail';
import TiresPage from './components/Tires';
import BatteryScreen from './components/BatteryScreen';
import Motor from './components/motor';
import Invertor from './components/Invertor';
import EnergyManagement from './components/EnergyManagement';
import Charger from './components/Charger';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<MapView />} />
        <Route path="/car/:carId" element={<CarDetail />} />
        <Route path="/car/:carId/tires" element={<TiresPage />} />
        <Route path="/car/:carId/battery" element={<BatteryScreen />} />
        <Route path="/car/:carId/motor" element={<Motor />} />
        <Route path="/car/:carId/invertor" element={<Invertor />} />
        <Route path="/car/:carId/energymanagement" element={<EnergyManagement />} />
        <Route path="/car/:carId/charger" element={<Charger />} />
      </Routes>
    </div>
  );
}

export default App;