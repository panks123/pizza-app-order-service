import express, { Request, Response } from "express";
import { globalErrorHandler } from "./common/middleware/globalErrorHandler";
import cookieParser from "cookie-parser";
import customerRouter from "./customer/customerRouter";
import couponRouter from "./coupon/couponRouter";
import orderRouter from "./order/orderRouter";
import paymentRouter from "./payment/paymentRouter";
import cors from "cors";
import config from "config";

const app = express();

const ALLOWED_DOMAINS = [
  String(config.get("frontend.clientUI")),
  String(config.get("frontend.adminUI")),
];

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
app.use(
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  cors({
      origin: ALLOWED_DOMAINS,
  }),
);
app.use(cookieParser());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Hello from order service service!" });
});

app.use('/customer', customerRouter);
app.use('/coupon', couponRouter);
app.use('/orders', orderRouter);
app.use('/payments', paymentRouter);

app.use(globalErrorHandler);

export default app;
