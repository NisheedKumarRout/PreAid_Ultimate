// Comprehensive Tamil Nadu Hospital Database with Ambulance Services
const hospitals = [
  // Chennai Hospitals
  {
    id: 1,
    name: "Apollo Hospitals",
    lat: 13.0569,
    lng: 80.2091,
    address: "21, Greams Lane, Off Greams Road, Chennai, Tamil Nadu 600006",
    contact: "+91-44-2829-3333",
    ambulanceContact: "+91-44-2829-4444",
    type: "Multi-specialty Hospital",
    rating: 9.2,
    emergencyServices: true,
    specialties: ["Cardiology", "Neurology", "Oncology", "Emergency Medicine", "Trauma Care"]
  },
  {
    id: 2,
    name: "SRM Global Hospital",
    lat: 12.8230,
    lng: 80.0444,
    address: "SRM Nagar, Kattankulathur, Chennai, Tamil Nadu 603203",
    contact: "+91-44-4743-9999",
    ambulanceContact: "+91-44-4743-9108",
    type: "Multi-specialty Hospital",
    rating: 8.9,
    emergencyServices: true,
    specialties: ["Cardiology", "Neurology", "Orthopedics", "Emergency Care", "Trauma Surgery"]
  },
  {
    id: 3,
    name: "Fortis Malar Hospital",
    lat: 13.0569,
    lng: 80.2500,
    address: "52, 1st Main Rd, Gandhi Nagar, Adyar, Chennai, Tamil Nadu 600020",
    contact: "+91-44-4289-2222",
    ambulanceContact: "+91-44-4289-2200",
    type: "Multi-specialty Hospital",
    rating: 8.8,
    emergencyServices: true,
    specialties: ["Cardiology", "Orthopedics", "Gastroenterology", "Emergency Care"]
  },
  {
    id: 4,
    name: "MIOT International",
    lat: 12.9823,
    lng: 80.1948,
    address: "4/112, Mount Poonamalle Road, Manapakkam, Chennai, Tamil Nadu 600089",
    contact: "+91-44-4200-1000",
    ambulanceContact: "+91-44-4200-2000",
    type: "Multi-specialty Hospital",
    rating: 9.0,
    emergencyServices: true,
    specialties: ["Orthopedics", "Cardiology", "Neurology", "Transplant Surgery"]
  },
  {
    id: 5,
    name: "Government General Hospital",
    lat: 13.0878,
    lng: 80.2785,
    address: "EVR Periyar Salai, Park Town, Chennai, Tamil Nadu 600003",
    contact: "+91-44-2819-2231",
    ambulanceContact: "+91-44-2819-2108",
    type: "Government Hospital",
    rating: 7.5,
    emergencyServices: true,
    specialties: ["General Medicine", "Surgery", "Emergency Care", "Trauma"]
  },
  {
    id: 6,
    name: "Sri Ramachandra Medical Centre",
    lat: 12.9019,
    lng: 80.0564,
    address: "No.1, Ramachandra Nagar, Porur, Chennai, Tamil Nadu 600116",
    contact: "+91-44-4528-1000",
    ambulanceContact: "+91-44-4528-1108",
    type: "Medical College Hospital",
    rating: 8.5,
    emergencyServices: true,
    specialties: ["All Specialties", "Medical Education", "Research"]
  },
  {
    id: 7,
    name: "Vijaya Hospital",
    lat: 13.0338,
    lng: 80.2297,
    address: "No. 439, N.S.K. Salai, Vadapalani, Chennai, Tamil Nadu 600026",
    contact: "+91-44-2471-9999",
    ambulanceContact: "+91-44-2471-9911",
    type: "Multi-specialty Hospital",
    rating: 8.3,
    emergencyServices: true,
    specialties: ["Cardiology", "Neurology", "Orthopedics", "Emergency Medicine"]
  },
  {
    id: 8,
    name: "Gleneagles Global Health City",
    lat: 12.8230,
    lng: 80.2275,
    address: "439, Cheran Nagar, Perumbakkam, Chennai, Tamil Nadu 600100",
    contact: "+91-44-4444-1000",
    ambulanceContact: "+91-44-4444-1108",
    type: "Multi-specialty Hospital",
    rating: 9.1,
    emergencyServices: true,
    specialties: ["Cardiology", "Oncology", "Neurology", "Transplant"]
  },
  {
    id: 9,
    name: "Stanley Medical College Hospital",
    lat: 13.0878,
    lng: 80.2785,
    address: "Old Jail Road, Royapuram, Chennai, Tamil Nadu 600001",
    contact: "+91-44-2819-3200",
    ambulanceContact: "+91-44-2819-3108",
    type: "Government Medical College",
    rating: 7.8,
    emergencyServices: true,
    specialties: ["All Medical Specialties", "Teaching Hospital"]
  },
  {
    id: 10,
    name: "Madras Medical College & Rajiv Gandhi Government General Hospital",
    lat: 13.0878,
    lng: 80.2785,
    address: "EVR Periyar Salai, Park Town, Chennai, Tamil Nadu 600003",
    contact: "+91-44-2819-2000",
    ambulanceContact: "+91-44-108",
    type: "Government Medical College",
    rating: 8.0,
    emergencyServices: true,
    specialties: ["All Specialties", "Trauma Care", "Emergency Medicine"]
  },
  // Coimbatore Hospitals
  {
    id: 11,
    name: "Kovai Medical Center and Hospital",
    lat: 11.0168,
    lng: 76.9558,
    address: "99, Avinashi Road, Coimbatore, Tamil Nadu 641014",
    contact: "+91-422-4324-000",
    ambulanceContact: "+91-422-4324-108",
    type: "Multi-specialty Hospital",
    rating: 8.7,
    emergencyServices: true,
    specialties: ["Cardiology", "Neurology", "Oncology", "Emergency Care"]
  },
  {
    id: 12,
    name: "PSG Hospitals",
    lat: 11.0168,
    lng: 76.9558,
    address: "Avinashi Road, Peelamedu, Coimbatore, Tamil Nadu 641004",
    contact: "+91-422-4345-000",
    ambulanceContact: "+91-422-4345-108",
    type: "Multi-specialty Hospital",
    rating: 8.5,
    emergencyServices: true,
    specialties: ["Cardiology", "Orthopedics", "Neurology", "Emergency Medicine"]
  },
  // Madurai Hospitals
  {
    id: 13,
    name: "Apollo Specialty Hospitals Madurai",
    lat: 9.9252,
    lng: 78.1198,
    address: "80 Feet Road, Mattuthavani, Madurai, Tamil Nadu 625020",
    contact: "+91-452-4370-200",
    ambulanceContact: "+91-452-4370-108",
    type: "Multi-specialty Hospital",
    rating: 8.6,
    emergencyServices: true,
    specialties: ["Cardiology", "Neurology", "Oncology", "Emergency Care"]
  },
  {
    id: 14,
    name: "Meenakshi Mission Hospital & Research Centre",
    lat: 9.9252,
    lng: 78.1198,
    address: "Lake Area, Melur Main Road, Madurai, Tamil Nadu 625107",
    contact: "+91-452-4581-000",
    ambulanceContact: "+91-452-4581-108",
    type: "Multi-specialty Hospital",
    rating: 8.4,
    emergencyServices: true,
    specialties: ["Cardiology", "Orthopedics", "Neurology", "Emergency Medicine"]
  },
  // Salem Hospitals
  {
    id: 15,
    name: "Manipal Hospital Salem",
    lat: 11.6643,
    lng: 78.1460,
    address: "Dalmia Board, Salem, Tamil Nadu 636013",
    contact: "+91-427-2677-000",
    ambulanceContact: "+91-427-2677-108",
    type: "Multi-specialty Hospital",
    rating: 8.3,
    emergencyServices: true,
    specialties: ["Cardiology", "Neurology", "Orthopedics", "Emergency Care"]
  },
  // Tirunelveli Hospitals
  {
    id: 16,
    name: "Tirunelveli Medical College Hospital",
    lat: 8.7139,
    lng: 77.7567,
    address: "Tirunelveli Medical College, Tirunelveli, Tamil Nadu 627011",
    contact: "+91-462-2572-000",
    ambulanceContact: "+91-462-108",
    type: "Government Medical College",
    rating: 7.9,
    emergencyServices: true,
    specialties: ["All Medical Specialties", "Emergency Medicine", "Trauma Care"]
  },
  // Trichy Hospitals
  {
    id: 17,
    name: "Apollo Specialty Hospitals Trichy",
    lat: 10.7905,
    lng: 78.7047,
    address: "Collector Office Road, Trichy, Tamil Nadu 620018",
    contact: "+91-431-4077-000",
    ambulanceContact: "+91-431-4077-108",
    type: "Multi-specialty Hospital",
    rating: 8.5,
    emergencyServices: true,
    specialties: ["Cardiology", "Neurology", "Oncology", "Emergency Care"]
  },
  // Vellore Hospitals
  {
    id: 18,
    name: "Christian Medical College Vellore",
    lat: 12.9165,
    lng: 79.1325,
    address: "Ida Scudder Road, Vellore, Tamil Nadu 632004",
    contact: "+91-416-2282-000",
    ambulanceContact: "+91-416-2282-108",
    type: "Medical College Hospital",
    rating: 9.3,
    emergencyServices: true,
    specialties: ["All Specialties", "Research", "Medical Education", "Trauma Care"]
  },
  // Thanjavur Hospitals
  {
    id: 19,
    name: "Thanjavur Medical College Hospital",
    lat: 10.7870,
    lng: 79.1378,
    address: "Medical College Road, Thanjavur, Tamil Nadu 613004",
    contact: "+91-4362-282-000",
    ambulanceContact: "+91-4362-108",
    type: "Government Medical College",
    rating: 7.7,
    emergencyServices: true,
    specialties: ["General Medicine", "Surgery", "Emergency Care", "Pediatrics"]
  },
  // Erode Hospitals
  {
    id: 20,
    name: "Erode Government Hospital",
    lat: 11.3410,
    lng: 77.7172,
    address: "Collectorate Complex, Erode, Tamil Nadu 638001",
    contact: "+91-424-2255-000",
    ambulanceContact: "+91-424-108",
    type: "Government Hospital",
    rating: 7.4,
    emergencyServices: true,
    specialties: ["General Medicine", "Surgery", "Emergency Care", "Obstetrics"]
  }
];

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
}

// Get hospitals within specified radius (only those with ambulance services)
function getHospitalsWithinRadius(userLat, userLng, radiusKm) {
  return hospitals
    .filter(hospital => hospital.emergencyServices === true) // Only hospitals with ambulance services
    .map(hospital => ({
      ...hospital,
      distance: calculateDistance(userLat, userLng, hospital.lat, hospital.lng)
    }))
    .filter(hospital => hospital.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
}

// Get all hospitals with ambulance services in Tamil Nadu
function getAllTamilNaduHospitals() {
  return hospitals.filter(hospital => hospital.emergencyServices === true);
}

console.log('Tamil Nadu Hospital database loaded with', hospitals.length, 'hospitals with ambulance services');
console.log('Hospitals include major cities: Chennai, Coimbatore, Madurai, Salem, Vellore, Trichy, Thanjavur, Tirunelveli, Erode');
console.log('SRM Global Hospital added at Kattankulathur coordinates:', hospitals.find(h => h.name === 'SRM Global Hospital'));