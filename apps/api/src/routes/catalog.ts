import { Router } from "express";
import { marketingPages, productCards } from "@english-talks/shared";
import { prisma } from "../lib/prisma.js";

export const catalogRouter = Router();

catalogRouter.get("/products", (_req, res) => {
  return res.json(productCards);
});

catalogRouter.get("/pages", (_req, res) => {
  return res.json(marketingPages);
});

catalogRouter.get("/courses", async (_req, res) => {
  const courses = await prisma.course.findMany({
    orderBy: { title: "asc" },
  });

  return res.json(courses);
});
