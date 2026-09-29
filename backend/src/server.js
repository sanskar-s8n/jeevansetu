import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { z } from 'zod';
import { pool } from './db.js';

const app = express();
const httpServer = createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const ALLOWED_ORIGINS = [
  CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175'
];
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS
  }
});

app.use(helmet());

app.use(cors({
  origin: ALLOWED_ORIGINS
}));

app.use(express.json());
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS database_time');

    res.json({
      service: 'JeevanSetu API',
      status: 'online',
      database: 'connected',
      databaseTime: result.rows[0].database_time,
      frontend: 'http://localhost:5174',
      endpoints: {
        health: '/api/health',
        facilities: '/api/facilities',
        referrals: '/api/referrals'
      }
    });
  } catch (error) {
    res.status(500).json({
      service: 'JeevanSetu API',
      status: 'online',
      database: 'disconnected',
      error: error.message
    });
  }
});
/* =========================================================
   VALIDATION
========================================================= */

const referralSchema = z.object({
  patientAge: z.number().int().min(0).max(120),
  urgency: z.enum(['ROUTINE', 'URGENT', 'CRITICAL']),
  requiredService: z.string().min(2).max(200),
  location: z.string().min(2).max(200),
  notes: z.string().max(2000).optional(),
  sourceFacilityId: z.string().uuid()
});

const facilitySchema = z.object({
  name: z.string().min(2).max(200),
  district: z.string().min(2).max(100),
  capabilities: z.array(z.string().min(2)).min(1),
  bedsAvailable: z.number().int().min(0),
  specialistAvailable: z.boolean(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional()
});

const statusSchema = z.object({
  status: z.enum([
    'SUBMITTED',
    'ACCEPTED',
    'REJECTED',
    'TRANSFERRED',
    'COMPLETED',
    'ESCALATED'
  ])
});

/* =========================================================
   AUTHENTICATION
========================================================= */

const auth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      message: 'Authentication required'
    });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({
      message: 'Invalid or expired token'
    });
  }
};

/* =========================================================
   HEALTH
========================================================= */

app.get('/api/health', async (_, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS database_time');

    res.json({
      ok: true,
      service: 'JeevanSetu API',
      database: 'connected',
      databaseTime: result.rows[0].database_time
    });
  } catch (error) {
    console.error('Database health check failed:', error);

    res.status(503).json({
      ok: false,
      service: 'JeevanSetu API',
      database: 'disconnected'
    });
  }
});

/* =========================================================
   FACILITY REGISTRY
========================================================= */

/*
   GET ALL FACILITIES
   Source: PostgreSQL
*/

app.get('/api/facilities', async (_, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        district,
        capabilities,
        beds_available AS "bedsAvailable",
        specialist_available AS "specialistAvailable",
        latitude,
        longitude,
        updated_at AS "updatedAt"
      FROM facilities
      ORDER BY name ASC;
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Failed to load facilities:', error);

    res.status(500).json({
      message: 'Failed to load facilities'
    });
  }
});

/*
   GET ONE FACILITY
*/

app.get('/api/facilities/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        district,
        capabilities,
        beds_available AS "bedsAvailable",
        specialist_available AS "specialistAvailable",
        latitude,
        longitude,
        updated_at AS "updatedAt"
      FROM facilities
      WHERE id = $1;
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Facility not found'
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to load facility:', error);

    res.status(500).json({
      message: 'Failed to load facility'
    });
  }
});

/*
   REGISTER NEW FACILITY

   This is the backend endpoint that the
   frontend onboarding form will use.
*/

app.post('/api/facilities', auth, async (req, res) => {
  const parsed = facilitySchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid facility data',
      errors: parsed.error.flatten()
    });
  }

  const facility = parsed.data;

  try {
    const result = await pool.query(`
      INSERT INTO facilities (
        name,
        district,
        capabilities,
        beds_available,
        specialist_available,
        latitude,
        longitude
      )
      VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7)
      RETURNING
        id,
        name,
        district,
        capabilities,
        beds_available AS "bedsAvailable",
        specialist_available AS "specialistAvailable",
        latitude,
        longitude,
        updated_at AS "updatedAt";
    `, [
      facility.name,
      facility.district,
      JSON.stringify(facility.capabilities),
      facility.bedsAvailable,
      facility.specialistAvailable,
      facility.latitude ?? null,
      facility.longitude ?? null
    ]);

    const createdFacility = result.rows[0];

    await pool.query(`
      INSERT INTO audit_events (
        actor_id,
        event_type,
        entity_type,
        entity_id,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5::jsonb);
    `, [
      req.user.sub,
      'FACILITY_CREATED',
      'FACILITY',
      createdFacility.id,
      JSON.stringify({
        name: createdFacility.name,
        district: createdFacility.district
      })
    ]);

    io.emit('facility:created', createdFacility);

    res.status(201).json(createdFacility);
  } catch (error) {
    console.error('Failed to create facility:', error);

    res.status(500).json({
      message: 'Failed to create facility'
    });
  }
});

/*
   UPDATE FACILITY AVAILABILITY / REGISTRY DATA
*/

app.patch('/api/facilities/:id', auth, async (req, res) => {
  const parsed = facilitySchema.partial().safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid facility update',
      errors: parsed.error.flatten()
    });
  }

  const updates = parsed.data;

  try {
    const current = await pool.query(
      'SELECT * FROM facilities WHERE id = $1',
      [req.params.id]
    );

    if (current.rows.length === 0) {
      return res.status(404).json({
        message: 'Facility not found'
      });
    }

    const existing = current.rows[0];

    const updated = {
      name: updates.name ?? existing.name,
      district: updates.district ?? existing.district,
      capabilities: updates.capabilities ?? existing.capabilities,
      bedsAvailable: updates.bedsAvailable ?? existing.beds_available,
      specialistAvailable:
        updates.specialistAvailable ?? existing.specialist_available,
      latitude: updates.latitude ?? existing.latitude,
      longitude: updates.longitude ?? existing.longitude
    };

    const result = await pool.query(`
      UPDATE facilities
      SET
        name = $1,
        district = $2,
        capabilities = $3::jsonb,
        beds_available = $4,
        specialist_available = $5,
        latitude = $6,
        longitude = $7,
        updated_at = NOW()
      WHERE id = $8
      RETURNING
        id,
        name,
        district,
        capabilities,
        beds_available AS "bedsAvailable",
        specialist_available AS "specialistAvailable",
        latitude,
        longitude,
        updated_at AS "updatedAt";
    `, [
      updated.name,
      updated.district,
      JSON.stringify(updated.capabilities),
      updated.bedsAvailable,
      updated.specialistAvailable,
      updated.latitude,
      updated.longitude,
      req.params.id
    ]);

    const facility = result.rows[0];

    await pool.query(`
      INSERT INTO audit_events (
        actor_id,
        event_type,
        entity_type,
        entity_id,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5::jsonb);
    `, [
      req.user.sub,
      'FACILITY_UPDATED',
      'FACILITY',
      facility.id,
      JSON.stringify({
        bedsAvailable: facility.bedsAvailable,
        specialistAvailable: facility.specialistAvailable
      })
    ]);

    io.emit('facility:updated', facility);

    res.json(facility);
  } catch (error) {
    console.error('Failed to update facility:', error);

    res.status(500).json({
      message: 'Failed to update facility'
    });
  }
});

/* =========================================================
   REFERRAL CREATION
========================================================= */

app.post('/api/referrals', auth, async (req, res) => {
  const parsed = referralSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid referral data',
      errors: parsed.error.flatten()
    });
  }

  const referral = parsed.data;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    /*
      Make sure the source facility exists.
    */

    const sourceResult = await client.query(`
      SELECT
        id,
        name,
        district,
        capabilities,
        beds_available AS "bedsAvailable",
        specialist_available AS "specialistAvailable",
        latitude,
        longitude
      FROM facilities
      WHERE id = $1;
    `, [referral.sourceFacilityId]);

    if (sourceResult.rows.length === 0) {
      await client.query('ROLLBACK');

      return res.status(400).json({
        message: 'Source facility not found'
      });
    }

    /*
      Create the referral.
    */

    const referralResult = await client.query(`
      INSERT INTO referrals (
        source_facility_id,
        patient_age,
        urgency,
        required_service,
        location,
        notes,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'SUBMITTED')
      RETURNING
        id,
        source_facility_id AS "sourceFacilityId",
        patient_age AS "patientAge",
        urgency,
        required_service AS "requiredService",
        location,
        notes,
        status,
        created_at AS "createdAt",
        updated_at AS "updatedAt";
    `, [
      referral.sourceFacilityId,
      referral.patientAge,
      referral.urgency,
      referral.requiredService,
      referral.location,
      referral.notes ?? null
    ]);

    const createdReferral = referralResult.rows[0];

    /*
      Get candidate facilities from PostgreSQL.
    */

    const facilitiesResult = await client.query(`
      SELECT
        id,
        name,
        district,
        capabilities,
        beds_available AS "bedsAvailable",
        specialist_available AS "specialistAvailable",
        latitude,
        longitude
      FROM facilities
      WHERE id <> $1;
    `, [referral.sourceFacilityId]);

    /*
      Run the JeevanSetu matching engine.
    */

    const matches = facilitiesResult.rows
      .map((facility) => ({
        facility,
        score: scoreReferral(referral, facility)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    /*
      Store the recommendations permanently.
    */

    for (const match of matches) {
      await client.query(`
        INSERT INTO referral_matches (
          referral_id,
          facility_id,
          score
        )
        VALUES ($1, $2, $3);
      `, [
        createdReferral.id,
        match.facility.id,
        match.score
      ]);
    }

    /*
      Audit event.
    */

    await client.query(`
      INSERT INTO audit_events (
        actor_id,
        event_type,
        entity_type,
        entity_id,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5::jsonb);
    `, [
      req.user.sub,
      'REFERRAL_CREATED',
      'REFERRAL',
      createdReferral.id,
      JSON.stringify({
        urgency: createdReferral.urgency,
        requiredService: createdReferral.requiredService,
        matchCount: matches.length
      })
    ]);

    await client.query('COMMIT');

    const responseMatches = matches.map((match) => ({
      facility: match.facility,
      score: match.score
    }));

    const response = {
      referral: createdReferral,
      matches: responseMatches
    };

    /*
      Real-time events.
    */

    io.emit('referral:created', response);

    for (const match of matches) {
      io
        .to(`facility:${match.facility.id}`)
        .emit('referral:match', {
          referral: createdReferral,
          facility: match.facility,
          score: match.score
        });
    }

    res.status(201).json(response);
  } catch (error) {
    await client.query('ROLLBACK');

    console.error('Failed to create referral:', error);

    res.status(500).json({
      message: 'Failed to create referral'
    });
  } finally {
    client.release();
  }
});

/* =========================================================
   REFERRAL REGISTRY
========================================================= */

app.get('/api/referrals', async (_, res) => {
  try {
    const result = await pool.query(`
      SELECT
        r.id,
        r.source_facility_id AS "sourceFacilityId",
        r.patient_age AS "patientAge",
        r.urgency,
        r.required_service AS "requiredService",
        r.location,
        r.notes,
        r.status,
        r.created_at AS "createdAt",
        r.updated_at AS "updatedAt",

        COALESCE(
          json_agg(
            json_build_object(
              'facilityId', rm.facility_id,
              'score', rm.score
            )
          ) FILTER (WHERE rm.id IS NOT NULL),
          '[]'
        ) AS matches

      FROM referrals r
      LEFT JOIN referral_matches rm
        ON rm.referral_id = r.id

      GROUP BY r.id
      ORDER BY r.created_at DESC;
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Failed to load referrals:', error);

    res.status(500).json({
      message: 'Failed to load referrals'
    });
  }
});

/*
   GET ONE REFERRAL
*/

app.get('/api/referrals/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        r.id,
        r.source_facility_id AS "sourceFacilityId",
        r.patient_age AS "patientAge",
        r.urgency,
        r.required_service AS "requiredService",
        r.location,
        r.notes,
        r.status,
        r.created_at AS "createdAt",
        r.updated_at AS "updatedAt",

        COALESCE(
          json_agg(
            json_build_object(
              'facilityId', rm.facility_id,
              'score', rm.score
            )
          ) FILTER (WHERE rm.id IS NOT NULL),
          '[]'
        ) AS matches

      FROM referrals r
      LEFT JOIN referral_matches rm
        ON rm.referral_id = r.id

      WHERE r.id = $1
      GROUP BY r.id;
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Referral not found'
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to load referral:', error);

    res.status(500).json({
      message: 'Failed to load referral'
    });
  }
});

/* =========================================================
   REFERRAL STATUS
========================================================= */

app.patch('/api/referrals/:id/status', auth, async (req, res) => {
  const parsed = statusSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid referral status',
      errors: parsed.error.flatten()
    });
  }

  const { status } = parsed.data;

  try {
    const result = await pool.query(`
      UPDATE referrals
      SET
        status = $1,
        updated_at = NOW()
      WHERE id = $2
      RETURNING
        id,
        source_facility_id AS "sourceFacilityId",
        patient_age AS "patientAge",
        urgency,
        required_service AS "requiredService",
        location,
        notes,
        status,
        created_at AS "createdAt",
        updated_at AS "updatedAt";
    `, [status, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Referral not found'
      });
    }

    const referral = result.rows[0];

    await pool.query(`
      INSERT INTO audit_events (
        actor_id,
        event_type,
        entity_type,
        entity_id,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5::jsonb);
    `, [
      req.user.sub,
      'REFERRAL_STATUS_CHANGED',
      'REFERRAL',
      referral.id,
      JSON.stringify({
        status
      })
    ]);

    io.emit('referral:updated', referral);

    res.json(referral);
  } catch (error) {
    console.error('Failed to update referral status:', error);

    res.status(500).json({
      message: 'Failed to update referral status'
    });
  }
});

/* =========================================================
   DEMO AUTHENTICATION
========================================================= */

app.post('/api/auth/demo-login', (req, res) => {
  const email = req.body?.email || 'demo@jeevansetu.in';

  const token = jwt.sign(
    {
      sub: DEMO_USER_ID,
      email,
      role: 'HOSPITAL_COORDINATOR'
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    token,
    user: {
      id: DEMO_USER_ID,
      email,
      role: 'HOSPITAL_COORDINATOR'
    }
  });
});

/* =========================================================
   MATCHING ENGINE
========================================================= */

function scoreReferral(referral, facility) {
  let score = 0;

  const requiredService = referral.requiredService.toLowerCase();

  /*
    Capability match
    ----------------
    Most important factor.
  */

  const capabilityMatch = facility.capabilities.some(
    (capability) =>
      capability.toLowerCase() === requiredService
  );

  if (capabilityMatch) {
    score += 55;
  }

  /*
    Critical patient + emergency capability
  */

  if (
    referral.urgency === 'CRITICAL' &&
    facility.capabilities.some(
      (capability) =>
        capability.toLowerCase() === 'emergency'
    )
  ) {
    score += 20;
  }

  /*
    Urgent patient + specialist availability
  */

  if (
    referral.urgency === 'URGENT' &&
    facility.specialistAvailable
  ) {
    score += 10;
  }

  /*
    Current bed availability
  */

  if (facility.bedsAvailable > 0) {
    score += 10;
  }

  /*
    Location relevance
  */

  if (
    facility.district &&
    referral.location &&
    facility.district
      .toLowerCase()
      .includes(referral.location.toLowerCase())
  ) {
    score += 5;
  }

  /*
    Base score
  */

  return Math.min(100, score);
}

/* =========================================================
   SOCKET.IO
========================================================= */

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('facility:join', (facilityId) => {
    if (facilityId) {
      socket.join(`facility:${facilityId}`);
    }
  });

  socket.on('facility:leave', (facilityId) => {
    if (facilityId) {
      socket.leave(`facility:${facilityId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

/* =========================================================
   ERROR HANDLER
========================================================= */

app.use((error, _req, res, _next) => {
  console.error('Unhandled API error:', error);

  res.status(500).json({
    message: 'Internal server error'
  });
});

/* =========================================================
   SERVER
========================================================= */

const port = Number(process.env.PORT || 5000);

httpServer.listen(port, () => {
  console.log(`JeevanSetu API running on http://localhost:${port}`);
});