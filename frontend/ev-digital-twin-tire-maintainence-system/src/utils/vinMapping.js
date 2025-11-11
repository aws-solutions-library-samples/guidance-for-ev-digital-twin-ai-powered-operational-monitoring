// VIN Mapping for Anonymized Demo
// Maps vehicle IDs to VIN numbers

export const VIN_MAPPING = {
  1: 'EV-1001',
  2: 'EV-1002',
  3: 'EV-1003',
  4: 'EV-1004',
  5: 'EV-1005'
};

export const VEHICLE_INFO = {
  'EV-1001': {
    vin: 'EV-1001',
    type: 'Electric Sedan',
    year: 2023,
    tireSize: '215/55R17'
  },
  'EV-1002': {
    vin: 'EV-1002',
    type: 'Electric Sedan',
    year: 2023,
    tireSize: '215/55R17'
  },
  'EV-1003': {
    vin: 'EV-1003',
    type: 'Electric SUV',
    year: 2023,
    tireSize: '235/55R18'
  },
  'EV-1004': {
    vin: 'EV-1004',
    type: 'Electric Sedan',
    year: 2023,
    tireSize: '215/55R17'
  },
  'EV-1005': {
    vin: 'EV-1005',
    type: 'Electric SUV',
    year: 2023,
    tireSize: '235/55R18'
  }
};

export const getVehicleDisplay = (vehicleData) => {
  const vin = vehicleData.make || VIN_MAPPING[vehicleData.vehicle_id];
  const info = VEHICLE_INFO[vin];
  return info ? `${vin} - ${info.type} (${info.year})` : vin;
};
