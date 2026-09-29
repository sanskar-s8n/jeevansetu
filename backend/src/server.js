import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { z } from 'zod';
import { store } from './store.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173' } });
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

const referralSchema = z.object({
  patientAge: z.number().int().min(0).max(120),
  urgency: z.enum(['ROUTINE','URGENT','CRITICAL']),
  requiredService: z.string().min(2),
  location: z.string().min(2),
  notes: z.string().max(2000).optional(),
  sourceFacilityId: z.string().min(2)
});

const auth = (req,res,next)=>{
  const token = req.headers.authorization?.replace('Bearer ','');
  if (!token) return res.status(401).json({message:'Authentication required'});
  try { req.user = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret'); next(); }
  catch { return res.status(401).json({message:'Invalid token'}); }
};

app.get('/api/health', (_,res)=>res.json({ok:true, service:'JeevanSetu API'}));
app.get('/api/facilities', (_,res)=>res.json(store.facilities));
app.get('/api/facilities/:id', (req,res)=>{
  const f=store.facilities.find(x=>x.id===req.params.id);
  f ? res.json(f) : res.status(404).json({message:'Facility not found'});
});

app.post('/api/referrals', (req,res)=>{
  const parsed=referralSchema.safeParse(req.body);
  if(!parsed.success) return res.status(400).json({message:'Invalid referral data', errors:parsed.error.flatten()});
  const referral={ id:`REF-${String(store.referrals.length+1).padStart(4,'0')}`, status:'SUBMITTED', createdAt:new Date().toISOString(), ...parsed.data };
  store.referrals.push(referral);
  const matches = store.facilities
    .filter(f=>f.id!==referral.sourceFacilityId)
    .map(f=>({facility:f, score:scoreReferral(referral,f)}))
    .sort((a,b)=>b.score-a.score)
    .slice(0,3);
  referral.matches=matches.map(m=>({facilityId:m.facility.id, score:m.score}));
  io.emit('referral:created', referral);
  matches.forEach(m=>io.to(`facility:${m.facility.id}`).emit('referral:match',{referral,facility:m.facility,score:m.score}));
  res.status(201).json({referral, matches:matches.map(m=>({facility:m.facility,score:m.score}))});
});

app.get('/api/referrals', (_,res)=>res.json(store.referrals));
app.get('/api/referrals/:id', (req,res)=>{
  const r=store.referrals.find(x=>x.id===req.params.id);
  r ? res.json(r) : res.status(404).json({message:'Referral not found'});
});
app.patch('/api/referrals/:id/status', (req,res)=>{
  const r=store.referrals.find(x=>x.id===req.params.id);
  if(!r) return res.status(404).json({message:'Referral not found'});
  const allowed=['SUBMITTED','ACCEPTED','REJECTED','TRANSFERRED','COMPLETED','ESCALATED'];
  if(!allowed.includes(req.body.status)) return res.status(400).json({message:'Invalid status'});
  r.status=req.body.status; r.updatedAt=new Date().toISOString();
  io.emit('referral:updated',r);
  res.json(r);
});

app.post('/api/auth/demo-login',(req,res)=>{
  const email=req.body.email || 'demo@jeevansetu.in';
  const token=jwt.sign({sub:'demo-user',email,role:'HOSPITAL_COORDINATOR'},process.env.JWT_SECRET || 'dev-secret',{expiresIn:'8h'});
  res.json({token,user:{email,role:'HOSPITAL_COORDINATOR'}});
});

function scoreReferral(r,f){
  let score=0;
  if(f.capabilities.some(c=>c.toLowerCase()===r.requiredService.toLowerCase())) score+=55;
  if(r.urgency==='CRITICAL' && f.capabilities.includes('Emergency')) score+=20;
  if(r.urgency==='URGENT' && f.specialistAvailable) score+=10;
  if(f.bedsAvailable>0) score+=10;
  return Math.min(100,score+5);
}

io.on('connection', socket=>{
  socket.on('facility:join', facilityId=>socket.join(`facility:${facilityId}`));
});

const port=Number(process.env.PORT||5000);
httpServer.listen(port,()=>console.log(`JeevanSetu API running on http://localhost:${port}`));
