require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes        = require('./modules/auth/auth.routes');
const vehicleRoutes     = require('./modules/vehicles/vehicles.routes');
const driverRoutes      = require('./modules/drivers/drivers.routes');
const tripRoutes        = require('./modules/trips/trips.routes');
const maintenanceRoutes = require('./modules/maintenance/maintenance.routes');
const fuelRoutes        = require('./modules/fuel/fuel.routes');
const expenseRoutes     = require('./modules/expenses/expenses.routes');
const reportRoutes      = require('./modules/reports/reports.routes');
const userRoutes        = require('./modules/users/users.routes');
const errorHandler      = require('./middleware/errorHandler');

require('./jobs/licenseReminder');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // curl, Postman, file://
    const extra = (process.env.CLIENT_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
    const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    if (isLocal || extra.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // handle preflight for all routes
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/v1/auth',        authRoutes);
app.use('/api/v1/vehicles',    vehicleRoutes);
app.use('/api/v1/drivers',     driverRoutes);
app.use('/api/v1/trips',       tripRoutes);
app.use('/api/v1/maintenance', maintenanceRoutes);
app.use('/api/v1/fuel-logs',   fuelRoutes);
app.use('/api/v1/expenses',    expenseRoutes);
app.use('/api/v1/reports',     reportRoutes);
app.use('/api/v1',             reportRoutes); // dashboard/kpis + dashboard/compliance
app.use('/api/v1/users',       userRoutes);

app.get('/api/v1/health', (_, res) => res.json({ status: 'ok', ts: new Date() }));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 TransitOps API running on port ${PORT}`));
