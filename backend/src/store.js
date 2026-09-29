// Development fallback store. Replace with PostgreSQL repository calls for production.
export const store = {
  facilities: [
    { id: 'FAC-001', name: 'District General Hospital', district: 'Nagpur', capabilities: ['Emergency','General Medicine','Diagnostics'], bedsAvailable: 18, specialistAvailable: true, latitude: 21.1458, longitude: 79.0882 },
    { id: 'FAC-002', name: 'Regional Specialty Centre', district: 'Nagpur', capabilities: ['Cardiology','ICU','Diagnostics'], bedsAvailable: 7, specialistAvailable: true, latitude: 21.1600, longitude: 79.1000 },
    { id: 'FAC-003', name: 'Rural Community Hospital', district: 'Bhandara', capabilities: ['Emergency','General Medicine'], bedsAvailable: 11, specialistAvailable: false, latitude: 21.1700, longitude: 79.6500 }
  ],
  referrals: [],
  notifications: []
};
