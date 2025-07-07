import { Request, Response, NextFunction } from "express";
import prisma from "../lib/db";

export const checkPremium = async (req, res, next) => {
  const userId = req.body?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const activeSub = await prisma.userSubscription.findFirst({
    where: {
      userId,
      paymentStatus: "SUCCESS",
      endDate: {
        gte: new Date(),
      },
    },
  });

  if (!activeSub) {
    return res.status(403).json({ error: "Premium access required." });
  }

  next();
};
