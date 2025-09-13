import express from "express";
import { createServer } from "http";

export function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

export async function setupVite(app: express.Application, server: any) {
  // En desarrollo, simplemente servir archivos estáticos básicos
  log("Running in development mode - serving static files");
  serveStatic(app);
}

export function serveStatic(app: express.Application) {
  // Servir archivos estáticos desde la carpeta client/dist
  app.use(express.static("client/dist"));
  
  // Para todas las rutas que no sean API, servir el index.html
  app.get("*", (req, res) => {
    res.sendFile("client/dist/index.html", { root: process.cwd() });
  });
}
