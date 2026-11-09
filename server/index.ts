import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { exec, closeDb } from './db';
import { init } from './migrate';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rutas
import authRoutes from './routes/auth';
import lesionesRoutes from './routes/lesiones';
import seguimientosRoutes from './routes/seguimientos';
import codigosAccesoRoutes from './routes/codigos-acceso';
import vinculacionesRoutes from './routes/vinculaciones';
import ham10000Routes from './routes/ham10000';
import clinicaRoutes from './routes/clinica';
import superadminRoutes from './routes/superadmin';
import exportImportRoutes from './routes/export-import';
import pacientesRoutes from './routes/pacientes';
import registrosFotosRoutes from './routes/registros-fotos';
import consultasRoutes from './routes/consultas';
import profesionalesRoutes from './routes/profesionales';
import casosEstudioRoutes from './routes/casos-estudio';
import similaresRoutes from './routes/similares';
import datasetsRoutes from './routes/datasets';
import analisisRoutes from './routes/analisis';

app.use('/api/auth', authRoutes);
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/registros-fotos', registrosFotosRoutes);
app.use('/api/lesiones', lesionesRoutes);
app.use('/api/lesiones', seguimientosRoutes);
app.use('/api/codigos-acceso', codigosAccesoRoutes);
app.use('/api/vinculaciones', vinculacionesRoutes);
app.use('/api/ham10000', ham10000Routes);
app.use('/api/clinica', clinicaRoutes);
app.use('/api/consultas', consultasRoutes);
app.use('/api/profesionales', profesionalesRoutes);
app.use('/api/casos-estudio', casosEstudioRoutes);
app.use('/api/similares', similaresRoutes);
app.use('/api/datasets', datasetsRoutes);
app.use('/api/lesiones', analisisRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api', exportImportRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Manejo de errores global
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Error interno del servidor' });
});

// Ruta 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });

});

const server = app.listen(PORT, async () => {
  console.log(`Skinnor backend escuchando en http://localhost:${PORT}`);
  await init();
});

process.on('SIGTERM', () => {
  server.close();
  closeDb();
});

process.on('SIGINT', () => {
  server.close();
  closeDb();
});

export default app;
