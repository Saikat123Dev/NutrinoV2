import dotenv from 'dotenv';
import express from 'express';
import process from 'process';
import webhookUserCreateRoutes from './routes/auth.route.js';
import conversation from "./routes/conversation.route.js";
import exercise from "./routes/exercise.router.cjs";
import healthFeedback from './routes/healthFeedback.route.js';
import healthProfileRoutes from './routes/healthstatus.route.js';
import meal from "./routes/mealPlanV.route.js";
import subscription from "./routes/payment.route.cjs";
const app = express();


app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

dotenv.config();
app.use((req, res, next) => {
  if (req.originalUrl === '/api/v1/auth/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});
const PORT = process.env.PORT || 3000;

app.use("/api/v1/auth", webhookUserCreateRoutes)
app.use("/api/v1/healthstatus", healthProfileRoutes)
app.use("/api/v1/feedback", healthFeedback)

app.use("/api", conversation)
app.use("/api/exercise", exercise)
app.use("/api", meal)
app.use("/api/v1/subscriptions", subscription)

const server = app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});


const gracefulShutdown = () => {
  console.log('Shutting down gracefully...');


  server.close((err) => {
    if (err) {
      console.error('Error while shutting down the server:', err);
      process.exit(1);
    }

    console.log('Server closed successfully.');
    process.exit(0);
  });
};


process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

process.on('uncaughtException', (err) => {
  console.error('There was an uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection:', reason, promise);
  process.exit(1);
});
