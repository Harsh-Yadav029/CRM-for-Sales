const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

dotenv.config();

connectDB();

const app = express();

app.use(helmet());
app.use(mongoSanitize());

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl) and dev environments
      if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  })
);

// Stripe webhook requires raw body payload for cryptographic signature verification
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }), require('./controllers/stripeController').handleWebhook);

app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', apiLimiter);

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/leads', require('./routes/leadRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/communication', require('./routes/communicationRoutes'));
app.use('/api/custom-fields', require('./routes/customFieldRoutes'));
app.use('/api/workflows', require('./routes/workflowRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/companies', require('./routes/companyRoutes'));
app.use('/api/contacts', require('./routes/contactRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/quotes', require('./routes/quoteRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/pipelines', require('./routes/pipelineRoutes'));
app.use('/api/assignment-rules', require('./routes/assignmentRuleRoutes'));
app.use('/api/quotas', require('./routes/quotaRoutes'));
app.use('/api/blueprints', require('./routes/blueprintRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/report-builder', require('./routes/reportBuilderRoutes'));
app.use('/api/forecast', require('./routes/forecastRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/audits', require('./routes/auditRoutes'));
app.use('/api/stripe', require('./routes/stripeRoutes'));

app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  res.json({
    status: 'UP',
    timestamp: new Date(),
    database: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
    memory: process.memoryUsage()
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'Sales CRM API is running' });
});

const http = require('http');
const { initSocket } = require('./utils/socket');

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
