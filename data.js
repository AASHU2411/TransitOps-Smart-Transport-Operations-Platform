/* ==========================================================================
   TransitOps — Data Layer (localStorage)
   ========================================================================== */
const DB_KEY = 'transitops_db_v1';

const ROLES = {
  FleetManager:    { label: 'Fleet Manager' },
  Driver:          { label: 'Driver' },
  SafetyOfficer:   { label: 'Safety Officer' },
  FinancialAnalyst:{ label: 'Financial Analyst' },
};

function uid(prefix){
  return prefix + '_' + Math.random().toString(36).slice(2,9);
}

function defaultData(){
  const now = Date.now();
  const day = 86400000;

  const users = [
    { id: uid('u'), name: 'Priya Nair',    email: 'fleet@transitops.io',   password: 'demo1234', role: 'FleetManager' },
    { id: uid('u'), name: 'Alex Rivera',   email: 'driver@transitops.io',  password: 'demo1234', role: 'Driver' },
    { id: uid('u'), name: 'Kabir Shah',    email: 'safety@transitops.io',  password: 'demo1234', role: 'SafetyOfficer' },
    { id: uid('u'), name: 'Meera Iyer',    email: 'finance@transitops.io', password: 'demo1234', role: 'FinancialAnalyst' },
  ];

  const vehicles = [
    { id: uid('v'), regNo:'RJ14-GB-4021', name:'Van-05 (Tata Ace)', type:'Van',    maxLoad:500,  odometer:18420, acquisitionCost:620000,  status:'Available', region:'Jaipur' },
    { id: uid('v'), regNo:'RJ14-GB-4022', name:'Truck-11 (Ashok Leyland)', type:'Truck', maxLoad:3200, odometer:54210, acquisitionCost:1850000, status:'On Trip',   region:'Jaipur' },
    { id: uid('v'), regNo:'RJ14-GB-4023', name:'Mini-Van-02',       type:'Van',    maxLoad:350,  odometer:9012,  acquisitionCost:480000,  status:'In Shop',  region:'Alwar' },
    { id: uid('v'), regNo:'RJ14-GB-4024', name:'Truck-14',          type:'Truck',  maxLoad:4000, odometer:71032, acquisitionCost:2100000, status:'Available', region:'Alwar' },
    { id: uid('v'), regNo:'RJ14-GB-4025', name:'Pickup-09',         type:'Pickup', maxLoad:900,  odometer:32210, acquisitionCost:780000,  status:'Retired',  region:'Jaipur' },
    { id: uid('v'), regNo:'RJ14-GB-4026', name:'Van-08',            type:'Van',    maxLoad:550,  odometer:5001,  acquisitionCost:640000,  status:'Available', region:'Kota' },
  ];

  const drivers = [
    { id: uid('d'), name:'Alex Rivera', licenseNumber:'RJ-DL-88213', licenseCategory:'LMV', licenseExpiry: fmtDate(now + 200*day), contact:'+91 98290 11223', safetyScore:92, status:'Available' },
    { id: uid('d'), name:'Rohit Malhotra', licenseNumber:'RJ-DL-77120', licenseCategory:'HMV', licenseExpiry: fmtDate(now + 400*day), contact:'+91 98290 33441', safetyScore:87, status:'On Trip' },
    { id: uid('d'), name:'Simran Kaur', licenseNumber:'RJ-DL-55871', licenseCategory:'HMV', licenseExpiry: fmtDate(now - 10*day), contact:'+91 98290 55123', safetyScore:74, status:'Available' },
    { id: uid('d'), name:'Dev Sharma', licenseNumber:'RJ-DL-99213', licenseCategory:'LMV', licenseExpiry: fmtDate(now + 30*day), contact:'+91 98290 90212', safetyScore:65, status:'Suspended' },
    { id: uid('d'), name:'Farah Khan', licenseNumber:'RJ-DL-44120', licenseCategory:'LMV', licenseExpiry: fmtDate(now + 550*day), contact:'+91 98290 44120', safetyScore:96, status:'Off Duty' },
  ];

  const trips = [
    { id: uid('t'), source:'Jaipur Hub', destination:'Alwar DC', vehicleId: vehicles[1].id, driverId: drivers[1].id, cargoWeight:2800, plannedDistance:150, status:'Dispatched', createdAt: now - 1*day, finalOdometer:null, fuelConsumed:null },
    { id: uid('t'), source:'Jaipur Hub', destination:'Kota Warehouse', vehicleId: vehicles[0].id, driverId: drivers[0].id, cargoWeight:420, plannedDistance:245, status:'Completed', createdAt: now - 4*day, finalOdometer:18420, fuelConsumed:22 },
    { id: uid('t'), source:'Alwar DC', destination:'Bhiwadi Plant', vehicleId: vehicles[3].id, driverId: drivers[4].id, cargoWeight:1500, plannedDistance:60, status:'Draft', createdAt: now - 0.2*day, finalOdometer:null, fuelConsumed:null },
    { id: uid('t'), source:'Jaipur Hub', destination:'Sikar Depot', vehicleId: vehicles[4].id, driverId: drivers[2].id, cargoWeight:600, plannedDistance:90, status:'Cancelled', createdAt: now - 6*day, finalOdometer:null, fuelConsumed:null },
  ];

  const maintenance = [
    { id: uid('m'), vehicleId: vehicles[2].id, type:'Oil Change', description:'Scheduled 10k service + brake pad check', cost:4200, date: fmtDate(now - 1*day), status:'Open' },
    { id: uid('m'), vehicleId: vehicles[1].id, type:'Tyre Replacement', description:'Rear tyre wear beyond threshold', cost:18500, date: fmtDate(now - 20*day), status:'Closed' },
  ];

  const fuelLogs = [
    { id: uid('f'), vehicleId: vehicles[0].id, liters:22, cost:2178, date: fmtDate(now - 4*day) },
    { id: uid('f'), vehicleId: vehicles[1].id, liters:140, cost:13860, date: fmtDate(now - 1*day) },
    { id: uid('f'), vehicleId: vehicles[3].id, liters:95, cost:9405, date: fmtDate(now - 2*day) },
    { id: uid('f'), vehicleId: vehicles[0].id, liters:18, cost:1782, date: fmtDate(now - 9*day) },
  ];

  const expenses = [
    { id: uid('e'), vehicleId: vehicles[1].id, type:'Toll', amount:640, date: fmtDate(now - 1*day), note:'NH48 toll plaza' },
    { id: uid('e'), vehicleId: vehicles[0].id, type:'Parking', amount:120, date: fmtDate(now - 3*day), note:'Kota warehouse parking' },
  ];

  return { users, vehicles, drivers, trips, maintenance, fuelLogs, expenses, session:null };
}

function fmtDate(ts){
  const d = new Date(ts);
  return d.toISOString().slice(0,10);
}

const DataStore = {
  load(){
    let raw = localStorage.getItem(DB_KEY);
    if(!raw){
      const seed = defaultData();
      localStorage.setItem(DB_KEY, JSON.stringify(seed));
      return seed;
    }
    try{ return JSON.parse(raw); }
    catch(e){ const seed = defaultData(); localStorage.setItem(DB_KEY, JSON.stringify(seed)); return seed; }
  },
  save(db){ localStorage.setItem(DB_KEY, JSON.stringify(db)); },
  reset(){ localStorage.removeItem(DB_KEY); return this.load(); },

  // ---- generic helpers ----
  all(collection){ return this.load()[collection] || []; },
  find(collection, id){ return this.all(collection).find(x => x.id === id); },
  insert(collection, obj){
    const db = this.load();
    obj.id = obj.id || uid(collection[0]);
    db[collection].push(obj);
    this.save(db);
    return obj;
  },
  update(collection, id, patch){
    const db = this.load();
    const idx = db[collection].findIndex(x => x.id === id);
    if(idx === -1) return null;
    db[collection][idx] = { ...db[collection][idx], ...patch };
    this.save(db);
    return db[collection][idx];
  },
  remove(collection, id){
    const db = this.load();
    db[collection] = db[collection].filter(x => x.id !== id);
    this.save(db);
  },

  // ---- session ----
  getSession(){ return this.load().session; },
  setSession(userId){
    const db = this.load();
    db.session = userId;
    this.save(db);
  },
  clearSession(){
    const db = this.load();
    db.session = null;
    this.save(db);
  },
  currentUser(){
    const sid = this.getSession();
    if(!sid) return null;
    return this.all('users').find(u => u.id === sid) || null;
  }
};

/* ==========================================================================
   Business rules
   ========================================================================== */
const Rules = {
  isLicenseExpired(driver){
    return new Date(driver.licenseExpiry) < new Date(new Date().toDateString());
  },
  dispatchableVehicles(){
    return DataStore.all('vehicles').filter(v => v.status === 'Available');
  },
  assignableDrivers(){
    return DataStore.all('drivers').filter(d => d.status === 'Available' && !Rules.isLicenseExpired(d));
  },
  vehicleTotalCost(vehicleId){
    const fuel = DataStore.all('fuelLogs').filter(f => f.vehicleId === vehicleId).reduce((s,f)=>s+Number(f.cost||0),0);
    const maint = DataStore.all('maintenance').filter(m => m.vehicleId === vehicleId).reduce((s,m)=>s+Number(m.cost||0),0);
    const exp = DataStore.all('expenses').filter(e => e.vehicleId === vehicleId).reduce((s,e)=>s+Number(e.amount||0),0);
    return { fuel, maint, exp, total: fuel+maint+exp };
  },
  vehicleFuelEfficiency(vehicleId){
    const trips = DataStore.all('trips').filter(t => t.vehicleId === vehicleId && t.status === 'Completed' && t.fuelConsumed);
    const dist = trips.reduce((s,t)=>s+Number(t.plannedDistance||0),0);
    const fuel = trips.reduce((s,t)=>s+Number(t.fuelConsumed||0),0);
    return fuel > 0 ? (dist/fuel) : 0;
  },
  fleetUtilization(){
    const vehicles = DataStore.all('vehicles').filter(v=>v.status!=='Retired');
    if(vehicles.length===0) return 0;
    const onTrip = vehicles.filter(v=>v.status==='On Trip').length;
    return Math.round((onTrip/vehicles.length)*100);
  },
  dispatchTrip(tripId){
    const trip = DataStore.find('trips', tripId);
    if(!trip) return { ok:false, msg:'Trip not found' };
    const vehicle = DataStore.find('vehicles', trip.vehicleId);
    const driver = DataStore.find('drivers', trip.driverId);
    if(!vehicle || vehicle.status !== 'Available') return { ok:false, msg:'Vehicle is not available for dispatch.' };
    if(!driver || driver.status !== 'Available') return { ok:false, msg:'Driver is not available for dispatch.' };
    if(Rules.isLicenseExpired(driver)) return { ok:false, msg:'Driver license has expired.' };
    if(Number(trip.cargoWeight) > Number(vehicle.maxLoad)) return { ok:false, msg:'Cargo weight exceeds vehicle max load capacity.' };
    DataStore.update('vehicles', vehicle.id, { status:'On Trip' });
    DataStore.update('drivers', driver.id, { status:'On Trip' });
    DataStore.update('trips', tripId, { status:'Dispatched' });
    return { ok:true };
  },
  completeTrip(tripId, finalOdometer, fuelConsumed){
    const trip = DataStore.find('trips', tripId);
    if(!trip) return { ok:false, msg:'Trip not found' };
    const vehicle = DataStore.find('vehicles', trip.vehicleId);
    const driver = DataStore.find('drivers', trip.driverId);
    DataStore.update('trips', tripId, { status:'Completed', finalOdometer:Number(finalOdometer), fuelConsumed:Number(fuelConsumed) });
    if(vehicle) DataStore.update('vehicles', vehicle.id, { status:'Available', odometer: Math.max(vehicle.odometer, Number(finalOdometer)||vehicle.odometer) });
    if(driver) DataStore.update('drivers', driver.id, { status:'Available' });
    return { ok:true };
  },
  cancelTrip(tripId){
    const trip = DataStore.find('trips', tripId);
    if(!trip) return { ok:false, msg:'Trip not found' };
    if(trip.status === 'Dispatched'){
      const vehicle = DataStore.find('vehicles', trip.vehicleId);
      const driver = DataStore.find('drivers', trip.driverId);
      if(vehicle) DataStore.update('vehicles', vehicle.id, { status:'Available' });
      if(driver) DataStore.update('drivers', driver.id, { status:'Available' });
    }
    DataStore.update('trips', tripId, { status:'Cancelled' });
    return { ok:true };
  },
  openMaintenance(vehicleId, record){
    const vehicle = DataStore.find('vehicles', vehicleId);
    DataStore.insert('maintenance', { ...record, vehicleId, status:'Open' });
    if(vehicle) DataStore.update('vehicles', vehicleId, { status:'In Shop' });
  },
  closeMaintenance(maintId){
    const rec = DataStore.find('maintenance', maintId);
    if(!rec) return;
    DataStore.update('maintenance', maintId, { status:'Closed' });
    const vehicle = DataStore.find('vehicles', rec.vehicleId);
    if(vehicle && vehicle.status !== 'Retired'){
      DataStore.update('vehicles', vehicle.id, { status:'Available' });
    }
  }
};
