import mongoose from "mongoose";
import { OrderError } from "../services/orderPolicy.js";

export function text(value, label, { required = true, max = 500 } = {}) {
  if (value === undefined && !required) return "";
  if (typeof value !== "string" || (required && !value.trim()) || value.length > max) {
    throw new OrderError(400, `${label} must be ${required ? "a non-empty" : "a"} string of at most ${max} characters.`);
  }
  return value.trim();
}

export function number(value, label, { min = 0, max = 1000000, decimals = 3 } = {}) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max ||
      Math.abs(value * 10 ** decimals - Math.round(value * 10 ** decimals)) > 0.000001) {
    throw new OrderError(400, `${label} must be a number between ${min} and ${max}, with at most ${decimals} decimal places.`);
  }
  return value;
}

export function objectId(value, label = "ID") {
  if (typeof value !== "string" || !mongoose.isObjectIdOrHexString(value)) throw new OrderError(400, `Invalid ${label}.`);
  return value.toLowerCase();
}

export function requestKey(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{8,128}$/.test(value)) throw new OrderError(400, "Provide a valid Idempotency-Key header (8–128 letters, digits, underscores or hyphens).");
  return value;
}

export const roundQuantity = (value) => Math.round(value * 1000) / 1000;
export const toPaise = (value) => Math.round(value * 100);

export function sendError(res, error) {
  const status = error.status || (error.name === "ValidationError" || error.name === "CastError" ? 400 : error.code === 11000 ? 409 : 500);
  if (status === 500) console.error(error);
  return res.status(status).json({ message: status === 500 ? "Unable to complete this operation." : error.status ? error.message : "Invalid or conflicting data." });
}

export const route = (handler) => async (req, res) => {
  try { await handler(req, res); } catch (error) { sendError(res, error); }
};
