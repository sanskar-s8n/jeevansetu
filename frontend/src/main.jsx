import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowRight, Building2, Check, ChevronDown, ClipboardList, HeartPulse,
  Hospital, Languages, LockKeyhole, MapPin, Menu, Route, Search,
  ShieldCheck, UserRound, X, Zap, RefreshCw, Activity, Clock3,
  AlertTriangle, CheckCircle2, CircleDot, LogOut, BedDouble,
  Stethoscope, FileText, BarChart3, Settings2, Bell, ChevronRight
} from 'lucide-react';
import './styles.css';
import './auth-modal.css';
import './core-upgrade.css';
import { api } from './api.js';

const navItems = ['Home', 'About', 'How It Works', 'For Hospitals', 'Contact'];
const STATUS_FLOW = ['SUBMITTED', 'ACCEPTED', 'TRANSFERRED', 'COMPLETED'];

function App() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [languageOpen, setLanguageOpen] = React.useState(false);
  const [facilities, setFacilities] = React.useState([]);
  const [facilityLoading, setFacilityLoading] = React.useState(true);
  const [facilityError, setFacilityError] = React.useState('');

  const [loggedInUser, setLoggedInUser] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('jeevansetu_user') || 'null'); }
    catch { return null; }
  });
  const [token, setToken] = React.useState(() => localStorage.getItem('jeevansetu_token') || '');

  const [loginOpen, setLoginOpen] = React.useState(false);
  const [loginEmail, setLoginEmail] = React.useState(
    localStorage.getItem('jeevansetu_demo_email') || 'demo@jeevansetu.in'
  );
  const [loginLoading, setLoginLoading] = React.useState(false);
  const [loginError, setLoginError] = React.useState('');

  const [dashboardOpen, setDashboardOpen] = React.useState(false);
  const [dashboardTab, setDashboardTab] = React.useState('overview');
  const [referrals, setReferrals] = React.useState([]);
  const [referralsLoading, setReferralsLoading] = React.useState(false);
  const [referralError, setReferralError] = React.useState('');

  const [referralOpen, setReferralOpen] = React.useState(false);
  const [referralSubmitting, setReferralSubmitting] = React.useState(false);
  const [referralErrorForm, setReferralErrorForm] = React.useState('');
  const [selectedReferral, setSelectedReferral] = React.useState(null);

  const [facilityEditorOpen, setFacilityEditorOpen] = React.useState(false);
  const [facilityEditing, setFacilityEditing] = React.useState(null);
  const [facilitySaving, setFacilitySaving] = React.useState(false);
  const [facilitySaveError, setFacilitySaveError] = React.useState('');

  const [toast, setToast] = React.useState('');

  const sourceFacility = facilities[0] || null;

  const [referralForm, setReferralForm] = React.useState({
    patientAge: 35,
    urgency: 'URGENT',
    requiredService: 'General Medicine',
    location: 'Nagpur',
    notes: ''
  });

  React.useEffect(() => {
    loadFacilities();
  }, []);

  React.useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(''), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  async function loadFacilities() {
    try {
      setFacilityLoading(true);
      setFacilityError('');
      const data = await api.getFacilities();
      setFacilities(Array.isArray(data) ? data : []);
    } catch (error) {
      setFacilityError(error.message || 'Unable to connect to JeevanSetu API');
    } finally {
      setFacilityLoading(false);
    }
  }

  async function loadReferrals() {
    try {
      setReferralsLoading(true);
      setReferralError('');
      const data = await api.getReferrals(token);
      setReferrals(Array.isArray(data) ? data : []);
    } catch (error) {
      setReferralError(error.message || 'Unable to load referrals');
    } finally {
      setReferralsLoading(false);
    }
  }

  async function handleDemoLogin(event) {
    event.preventDefault();
    try {
      setLoginLoading(true);
      setLoginError('');
      const result = await api.demoLogin(loginEmail.trim() || 'demo@jeevansetu.in');
      if (!result?.token || !result?.user) throw new Error('Authentication response was incomplete.');

      localStorage.setItem('jeevansetu_token', result.token);
      localStorage.setItem('jeevansetu_user', JSON.stringify(result.user));
      localStorage.setItem('jeevansetu_demo_email', result.user.email);

      setToken(result.token);
      setLoggedInUser(result.user);
      setLoginOpen(false);
      setDashboardOpen(true);
      setDashboardTab('overview');
      setToast('Hospital portal connected successfully.');
      loadReferrals();
    } catch (error) {
      setLoginError(error.message || 'Unable to connect to the authentication service.');
    } finally {
      setLoginLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('jeevansetu_token');
    localStorage.removeItem('jeevansetu_user');
    localStorage.removeItem('jeevansetu_demo_email');
    setToken('');
    setLoggedInUser(null);
    setDashboardOpen(false);
  }

  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
  }

  function openReferral() {
    if (!loggedInUser) {
      setLoginError('');
      setLoginOpen(true);
      return;
    }
    setReferralErrorForm('');
    setReferralOpen(true);
  }

  async function submitReferral(event) {
    event.preventDefault();
    if (!sourceFacility) {
      setReferralErrorForm('No source facility is available. Add a facility first.');
      return;
    }

    try {
      setReferralSubmitting(true);
      setReferralErrorForm('');

      const payload = {
        ...referralForm,
        patientAge: Number(referralForm.patientAge),
        sourceFacilityId: sourceFacility.id
      };

      const result = await api.createReferral(payload, token);
      setReferralOpen(false);
      setToast('Referral created. Matching recommendations are ready.');
      await loadReferrals();

      if (result?.referral) {
        setSelectedReferral(result.referral);
        setDashboardOpen(true);
        setDashboardTab('referrals');
      }
    } catch (error) {
      setReferralErrorForm(error.message || 'Unable to create referral.');
    } finally {
      setReferralSubmitting(false);
    }
  }

  async function changeReferralStatus(referralId, status) {
    try {
      const updated = await api.updateReferralStatus(referralId, status, token);
      setReferrals(current => current.map(item => item.id === referralId ? { ...item, ...updated } : item));
      setSelectedReferral(current => current?.id === referralId ? { ...current, ...updated } : current);
      setToast(`Referral marked ${status.toLowerCase()}.`);
    } catch (error) {
      setToast(error.message || 'Unable to update referral.');
    }
  }

  async function saveFacility(event) {
    event.preventDefault();
    if (!facilityEditing) return;

    try {
      setFacilitySaving(true);
      setFacilitySaveError('');

      const payload = {
        name: facilityEditing.name,
        district: facilityEditing.district,
        capabilities: facilityEditing.capabilities,
        bedsAvailable: Number(facilityEditing.bedsAvailable),
        specialistAvailable: Boolean(facilityEditing.specialistAvailable),
        latitude: facilityEditing.latitude === '' ? undefined : Number(facilityEditing.latitude),
        longitude: facilityEditing.longitude === '' ? undefined : Number(facilityEditing.longitude)
      };

      await api.updateFacility(facilityEditing.id, payload, token);
      await loadFacilities();
      setFacilityEditorOpen(false);
      setToast('Facility availability updated.');
    } catch (error) {
      setFacilitySaveError(error.message || 'Unable to update facility.');
    } finally {
      setFacilitySaving(false);
    }
  }

  function openFacilityEditor() {
    const facility = sourceFacility;
    if (!facility) return;
    setFacilitySaveError('');
    setFacilityEditing({
      ...facility,
      capabilities: [...(facility.capabilities || [])],
      bedsAvailable: facility.bedsAvailable ?? 0,
      specialistAvailable: Boolean(facility.specialistAvailable),
      latitude: facility.latitude ?? '',
      longitude: facility.longitude ?? ''
    });
    setFacilityEditorOpen(true);
  }

  const stats = {
    total: referrals.length,
    submitted: referrals.filter(r => r.status === 'SUBMITTED').length,
    accepted: referrals.filter(r => r.status === 'ACCEPTED').length,
    transferred: referrals.filter(r => r.status === 'TRANSFERRED').length,
    completed: referrals.filter(r => r.status === 'COMPLETED').length,
    escalated: referrals.filter(r => r.status === 'ESCALATED').length
  };

  return (
    <div className="app">
      <header className="navbar">
        <div className="nav-inner">
          <button className="brand" onClick={() => scrollTo('home')} aria-label="JeevanSetu home">
            <BrandMark />
            <span className="brand-copy">
              <strong>Jeevan<span>Setu</span></strong>
              <small>Connecting Healthcare. Bridging Lives.</small>
            </span>
          </button>

          <nav className={mobileOpen ? 'nav-links open' : 'nav-links'}>
            {navItems.map((item, index) => (
              <button
                key={item}
                className={index === 0 ? 'nav-link active' : 'nav-link'}
                onClick={() => scrollTo(index === 0 ? 'home' : item.toLowerCase().replaceAll(' ', '-'))}
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="nav-actions">
            <div className="language-wrap">
              <button className="language-btn" onClick={() => setLanguageOpen(v => !v)}>
                <Languages size={16} /> EN <ChevronDown size={14} />
              </button>
              {languageOpen && (
                <div className="language-menu">
                  <button>English</button>
                  <button>हिन्दी</button>
                  <button>मराठी</button>
                </div>
              )}
            </div>

            {loggedInUser ? (
              <div className="logged-in-wrap">
                <button className="login-btn logged-in-btn" onClick={() => { setDashboardOpen(true); loadReferrals(); }}>
                  <UserRound size={17} /> Hospital Portal
                </button>
                <button className="logout-btn" onClick={handleLogout}>Logout</button>
              </div>
            ) : (
              <button className="login-btn" onClick={() => { setLoginError(''); setLoginOpen(true); }}>
                <UserRound size={17} /> Hospital Login
              </button>
            )}

            <button className="mobile-toggle" onClick={() => setMobileOpen(v => !v)} aria-label="Toggle navigation">
              {mobileOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>

      {loginOpen && (
        <div className="login-overlay" role="presentation">
          <section className="login-modal" role="dialog" aria-modal="true">
            <button className="login-modal-close" onClick={() => setLoginOpen(false)} aria-label="Close login"><X size={20} /></button>
            <div className="login-modal-icon"><Hospital size={28} /></div>
            <div className="login-modal-heading">
              <span>JEEVANSETU HOSPITAL PORTAL</span>
              <h2>Hospital Login</h2>
              <p>Sign in to manage referrals, facility availability and coordination.</p>
            </div>
            <form onSubmit={handleDemoLogin} className="login-form">
              <label htmlFor="hospital-email">Hospital email</label>
              <input
                id="hospital-email"
                type="email"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                placeholder="demo@jeevansetu.in"
                required
                disabled={loginLoading}
              />
              {loginError && <div className="login-error" role="alert">{loginError}</div>}
              <button className="login-submit" type="submit" disabled={loginLoading}>
                {loginLoading ? 'Connecting…' : 'Continue to Hospital Portal'}
                {!loginLoading && <ArrowRight size={18} />}
              </button>
            </form>
            <div className="login-demo-note"><ShieldCheck size={16} /><span>Connected to the JeevanSetu authentication API.</span></div>
          </section>
        </div>
      )}

      {referralOpen && (
        <Modal title="Create Patient Referral" icon={<ClipboardList />} onClose={() => !referralSubmitting && setReferralOpen(false)}>
          <form className="product-form" onSubmit={submitReferral}>
            <div className="form-grid two">
              <Field label="Patient age">
                <input type="number" min="0" max="120" value={referralForm.patientAge} onChange={e => setReferralForm({...referralForm, patientAge: e.target.value})} required />
              </Field>
              <Field label="Urgency">
                <select value={referralForm.urgency} onChange={e => setReferralForm({...referralForm, urgency: e.target.value})}>
                  <option value="ROUTINE">Routine</option>
                  <option value="URGENT">Urgent</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </Field>
            </div>
            <Field label="Required service">
              <input value={referralForm.requiredService} onChange={e => setReferralForm({...referralForm, requiredService: e.target.value})} placeholder="e.g. Cardiology" required />
            </Field>
            <Field label="Patient location">
              <input value={referralForm.location} onChange={e => setReferralForm({...referralForm, location: e.target.value})} placeholder="District / city" required />
            </Field>
            <Field label="Clinical notes">
              <textarea rows="4" value={referralForm.notes} onChange={e => setReferralForm({...referralForm, notes: e.target.value})} placeholder="Relevant information for the receiving facility" />
            </Field>
            {referralErrorForm && <div className="form-error">{referralErrorForm}</div>}
            <div className="form-actions">
              <button type="button" className="secondary-btn" onClick={() => setReferralOpen(false)}>Cancel</button>
              <button type="submit" className="primary-btn" disabled={referralSubmitting}>
                {referralSubmitting ? 'Matching…' : 'Create & Find Best Match'} <ArrowRight size={17} />
              </button>
            </div>
          </form>
        </Modal>
      )}

      {facilityEditorOpen && facilityEditing && (
        <Modal title="Facility Availability" icon={<Settings2 />} onClose={() => !facilitySaving && setFacilityEditorOpen(false)}>
          <form className="product-form" onSubmit={saveFacility}>
            <Field label="Facility name"><input value={facilityEditing.name} onChange={e => setFacilityEditing({...facilityEditing, name: e.target.value})} required /></Field>
            <Field label="District"><input value={facilityEditing.district} onChange={e => setFacilityEditing({...facilityEditing, district: e.target.value})} required /></Field>
            <div className="form-grid two">
              <Field label="Beds available"><input type="number" min="0" value={facilityEditing.bedsAvailable} onChange={e => setFacilityEditing({...facilityEditing, bedsAvailable: e.target.value})} required /></Field>
              <Field label="Specialist available">
                <select value={facilityEditing.specialistAvailable ? 'YES' : 'NO'} onChange={e => setFacilityEditing({...facilityEditing, specialistAvailable: e.target.value === 'YES'})}>
                  <option value="YES">Yes</option><option value="NO">No</option>
                </select>
              </Field>
            </div>
            <Field label="Capabilities (comma separated)">
              <input
                value={(facilityEditing.capabilities || []).join(', ')}
                onChange={e => setFacilityEditing({...facilityEditing, capabilities: e.target.value.split(',').map(v => v.trim()).filter(Boolean)})}
              />
            </Field>
            {facilitySaveError && <div className="form-error">{facilitySaveError}</div>}
            <div className="form-actions">
              <button type="button" className="secondary-btn" onClick={() => setFacilityEditorOpen(false)}>Cancel</button>
              <button type="submit" className="primary-btn" disabled={facilitySaving}>{facilitySaving ? 'Saving…' : 'Save Availability'} <Check size={17} /></button>
            </div>
          </form>
        </Modal>
      )}

      {dashboardOpen && loggedInUser && (
        <div className="portal-overlay">
          <section className="portal-shell">
            <aside className="portal-sidebar">
              <div className="portal-brand"><Hospital size={22} /><div><strong>Hospital Portal</strong><small>{loggedInUser.email}</small></div></div>
              <button className={dashboardTab === 'overview' ? 'portal-nav active' : 'portal-nav'} onClick={() => setDashboardTab('overview')}><BarChart3 size={18} /> Overview</button>
              <button className={dashboardTab === 'referrals' ? 'portal-nav active' : 'portal-nav'} onClick={() => { setDashboardTab('referrals'); loadReferrals(); }}><ClipboardList size={18} /> Referrals</button>
              <button className={dashboardTab === 'facility' ? 'portal-nav active' : 'portal-nav'} onClick={() => setDashboardTab('facility')}><Building2 size={18} /> Facility</button>
              <button className={dashboardTab === 'availability' ? 'portal-nav active' : 'portal-nav'} onClick={() => setDashboardTab('availability')}><Activity size={18} /> Availability</button>
              <button className="portal-nav" onClick={loadFacilities}><RefreshCw size={18} /> Refresh Registry</button>
              <div className="portal-sidebar-bottom">
                <button className="portal-nav" onClick={handleLogout}><LogOut size={18} /> Logout</button>
                <button className="portal-close" onClick={() => setDashboardOpen(false)}>Close Portal</button>
              </div>
            </aside>

            <main className="portal-main">
              <div className="portal-topbar">
                <div><span>JEEVANSETU NETWORK</span><h1>{dashboardTab === 'overview' ? 'Hospital Overview' : dashboardTab === 'referrals' ? 'Referral Coordination' : dashboardTab === 'facility' ? 'Facility Profile' : 'Live Availability'}</h1></div>
                <button className="icon-btn" onClick={() => setDashboardOpen(false)}><X size={20} /></button>
              </div>

              {dashboardTab === 'overview' && (
                <div className="portal-content">
                  <div className="portal-actions">
                    <button className="portal-primary" onClick={openReferral}><ClipboardList size={18} /> Create Patient Referral</button>
                    <button className="portal-secondary" onClick={openFacilityEditor}><Settings2 size={18} /> Update Facility</button>
                  </div>
                  <div className="metric-grid">
                    <Metric icon={<ClipboardList />} label="Total referrals" value={stats.total} />
                    <Metric icon={<Clock3 />} label="Pending" value={stats.submitted} />
                    <Metric icon={<Activity />} label="Active" value={stats.accepted + stats.transferred} />
                    <Metric icon={<CheckCircle2 />} label="Completed" value={stats.completed} />
                  </div>
                  <div className="portal-grid">
                    <div className="portal-panel">
                      <div className="panel-heading"><div><span>REFERRAL PIPELINE</span><h3>Current coordination status</h3></div><button onClick={() => {setDashboardTab('referrals'); loadReferrals();}}>View all <ChevronRight size={15}/></button></div>
                      <StatusBars stats={stats} />
                    </div>
                    <div className="portal-panel">
                      <div className="panel-heading"><div><span>FACILITY STATUS</span><h3>{sourceFacility?.name || 'No facility'}</h3></div></div>
                      {sourceFacility ? <div className="facility-health">
                        <HealthRow icon={<BedDouble />} label="Beds available" value={sourceFacility.bedsAvailable} />
                        <HealthRow icon={<Stethoscope />} label="Specialist" value={sourceFacility.specialistAvailable ? 'Available' : 'Not listed'} />
                        <HealthRow icon={<MapPin />} label="District" value={sourceFacility.district} />
                      </div> : <EmptyState text="No facility data available." />}
                    </div>
                  </div>
                  <RecentReferrals referrals={referrals.slice(0, 4)} loading={referralsLoading} onOpen={r => {setSelectedReferral(r); setDashboardTab('referrals');}} />
                </div>
              )}

              {dashboardTab === 'referrals' && (
                <ReferralWorkspace
                  referrals={referrals}
                  loading={referralsLoading}
                  error={referralError}
                  onRefresh={loadReferrals}
                  onCreate={openReferral}
                  onOpen={setSelectedReferral}
                  onStatus={changeReferralStatus}
                />
              )}

              {dashboardTab === 'facility' && (
                <div className="portal-content">
                  <div className="portal-panel">
                    <div className="panel-heading"><div><span>FACILITY PROFILE</span><h3>{sourceFacility?.name || 'Facility'}</h3></div><button className="panel-action" onClick={openFacilityEditor}><Settings2 size={16}/> Edit</button></div>
                    {sourceFacility ? <div className="profile-grid">
                      <ProfileItem label="District" value={sourceFacility.district} />
                      <ProfileItem label="Beds available" value={sourceFacility.bedsAvailable} />
                      <ProfileItem label="Specialist" value={sourceFacility.specialistAvailable ? 'Available' : 'Not listed'} />
                      <ProfileItem label="Capabilities" value={(sourceFacility.capabilities || []).join(', ')} />
                    </div> : <EmptyState text="No facility available." />}
                  </div>
                  <div className="portal-panel"><div className="panel-heading"><div><span>REGISTRY</span><h3>Connected facilities</h3></div></div><div className="mini-facility-list">{facilities.map(f => <div key={f.id} className="mini-facility"><Hospital size={18}/><div><strong>{f.name}</strong><small>{f.district} · {f.bedsAvailable} beds</small></div><span>{f.specialistAvailable ? 'Specialist' : 'General'}</span></div>)}</div></div>
                </div>
              )}

              {dashboardTab === 'availability' && (
                <div className="portal-content">
                  <div className="availability-hero"><div><span>LIVE CAPACITY</span><h2>{sourceFacility?.bedsAvailable ?? '—'} beds currently listed</h2><p>Facility availability feeds the referral matching engine.</p></div><button className="portal-primary" onClick={openFacilityEditor}><Settings2 size={18}/> Update capacity</button></div>
                  <div className="portal-panel"><div className="panel-heading"><div><span>MATCHING INPUTS</span><h3>What the engine uses</h3></div></div><div className="input-grid"><InputPill icon={<HeartPulse/>} title="Capability" text={(sourceFacility?.capabilities || []).join(', ') || 'Not configured'} /><InputPill icon={<BedDouble/>} title="Availability" text={`${sourceFacility?.bedsAvailable ?? 0} beds`} /><InputPill icon={<Stethoscope/>} title="Specialist" text={sourceFacility?.specialistAvailable ? 'Available' : 'Not listed'} /><InputPill icon={<MapPin/>} title="Location" text={sourceFacility?.district || 'Not configured'} /></div></div>
                </div>
              )}
            </main>
          </section>
        </div>
      )}

      {selectedReferral && (
        <ReferralDetail
          referral={selectedReferral}
          facilities={facilities}
          onClose={() => setSelectedReferral(null)}
          onStatus={changeReferralStatus}
        />
      )}

      {toast && <div className="toast"><CheckCircle2 size={17}/>{toast}</div>}

      <main>
        <section id="home" className="hero">
          <div className="hero-inner">
            <div className="hero-copy">
              <div className="eyebrow"><span className="eyebrow-dot" /> AI-assisted healthcare coordination</div>
              <h1>Connecting Patients to<br />the Right Healthcare Facility<br /><span>When It Matters Most</span></h1>
              <p>JeevanSetu connects healthcare requirements with the most suitable available facility based on capability, availability, urgency and location — then tracks the referral through completion.</p>
              <div className="hero-actions">
                <button className="feature-card blue" onClick={openReferral}>
                  <span className="feature-icon"><ClipboardList size={28} /></span>
                  <span className="feature-content"><strong>Refer a Patient</strong><small>Find the most suitable facility</small><em>Create a real referral request</em></span>
                  <span className="round-arrow"><ArrowRight size={20} /></span>
                </button>
                <button className="feature-card green" onClick={() => { if (loggedInUser) {setDashboardOpen(true); setDashboardTab('facility');} else setLoginOpen(true); }}>
                  <span className="feature-icon"><Building2 size={28} /></span>
                  <span className="feature-content"><strong>Manage Facilities</strong><small>Update services and availability</small><em>Open hospital portal</em></span>
                  <span className="round-arrow"><ArrowRight size={20} /></span>
                </button>
              </div>
            </div>
            <ReferralMap />
          </div>
        </section>

        <section className="benefits-strip" aria-label="Platform benefits">
          <Benefit icon={<Zap />} title="Faster Referrals" text="Reduce delays in patient care" />
          <Benefit icon={<Route />} title="Better Coordination" text="Connect healthcare facilities" />
          <Benefit icon={<ShieldCheck />} title="Intelligent Matching" text="Beyond nearest hospital" />
          <Benefit icon={<Activity />} title="Track Till Completion" text="Closed-loop referral system" />
        </section>

        <section id="how-it-works" className="workflow-section page-section">
          <div className="section-card">
            <div className="section-heading"><span>HOW IT WORKS</span><h2>From requirement to outcome</h2><p>The live workflow now creates and tracks actual referrals.</p></div>
            <div className="workflow-grid">
              <Step number="1" icon={<ClipboardList />} title="Submit Requirement" text="Create a patient referral with urgency, service and location." />
              <Step number="2" icon={<Search />} title="Find Best Match" text="The backend scores facilities using capability, availability, urgency and location." />
              <Step number="3" icon={<Hospital />} title="Coordinate & Transfer" text="Review recommendations and update referral status." />
              <Step number="4" icon={<CheckCircle2 />} title="Track to Completion" text="Follow the referral through submitted, accepted, transferred and completed." />
            </div>
          </div>
        </section>

        <section id="for-hospitals" className="hospital-section page-section">
          <div className="split-card">
            <div>
              <div className="eyebrow">FOR HEALTHCARE FACILITIES</div>
              <h2>Keep your facility visible when it matters.</h2>
              <p>Maintain services, capabilities, capacity and availability so the referral engine can make better context-aware recommendations.</p>
              <div className="api-status"><span className={facilityError ? 'api-dot error' : facilityLoading ? 'api-dot loading' : 'api-dot'} /><strong>{facilityError ? 'Backend connection failed' : facilityLoading ? 'Connecting…' : 'Live facility registry connected'}</strong></div>
              {facilityError && <p className="api-error">{facilityError}</p>}
              <button className="primary-btn" onClick={() => { if (loggedInUser) {setDashboardOpen(true); setDashboardTab('facility');} else setLoginOpen(true); }}>Open Hospital Portal <ArrowRight size={17} /></button>
            </div>
            <div className="facility-list">
              <FacilityItem icon={<HeartPulse />} title="Clinical capabilities" />
              <FacilityItem icon={<Building2 />} title="Available services & resources" />
              <FacilityItem icon={<MapPin />} title="Location & catchment" />
              <FacilityItem icon={<LockKeyhole />} title="Verified facility access" />
            </div>
          </div>
        </section>

        <section id="facility-registry" className="registry-section page-section">
          <div className="section-card">
            <div className="section-heading"><span>LIVE FACILITY REGISTRY</span><h2>Connected Healthcare Facilities</h2><p>Loaded directly from the JeevanSetu backend and PostgreSQL database.</p></div>
            {facilityLoading ? <div className="registry-state">Loading facilities…</div> :
             facilityError ? <div className="registry-state error">{facilityError}</div> :
             facilities.length === 0 ? <div className="registry-state">No facilities found.</div> :
             <div className="registry-grid">{facilities.map(facility => (
              <article className="registry-card" key={facility.id}>
                <div className="registry-card-head"><div className="registry-icon"><Hospital size={22}/></div><div><h3>{facility.name}</h3><span><MapPin size={13}/> {facility.district}</span></div></div>
                <div className="registry-tags">{(facility.capabilities || []).map(c => <span key={c}>{c}</span>)}</div>
                <div className="registry-meta"><span><strong>{facility.bedsAvailable}</strong> beds</span><span>{facility.specialistAvailable ? 'Specialist available' : 'General capacity'}</span></div>
              </article>
            ))}</div>}
          </div>
        </section>

        <section id="about" className="about-section page-section">
          <div className="about-grid">
            <div><div className="eyebrow">WHY JEEVANSETU</div><h2>Not just the nearest hospital — the most suitable available facility.</h2><p>JeevanSetu considers capability, availability, urgency and location together to reduce fragmented referrals.</p></div>
            <div className="check-list"><CheckItem text="Context-aware facility matching" /><CheckItem text="Live facility availability" /><CheckItem text="Referral status tracking" /><CheckItem text="Hospital coordination workspace" /></div>
          </div>
        </section>

        <section id="contact" className="contact-section page-section">
          <div className="contact-card"><div><div className="eyebrow">CONTACT</div><h2>Build a more connected healthcare network.</h2><p>Use the hospital portal for onboarding and coordination workflows.</p></div><button className="primary-btn" onClick={() => { if (loggedInUser) setDashboardOpen(true); else setLoginOpen(true); }}>Open Portal <ArrowRight size={17}/></button></div>
        </section>
      </main>

      <footer className="footer"><div className="footer-inner"><div className="footer-brand"><BrandMark small/><div><strong>Jeevan<span>Setu</span></strong><small>Connecting Healthcare. Bridging Lives.</small></div></div><p>Designed to improve access to quality healthcare for everyone.</p></div></footer>
    </div>
  );
}

function Modal({ title, icon, onClose, children }) {
  return <div className="upgrade-modal-overlay"><section className="upgrade-modal"><button className="upgrade-close" onClick={onClose}><X size={19}/></button><div className="upgrade-title"><span>{icon}</span><div><small>JEEVANSETU</small><h2>{title}</h2></div></div>{children}</section></div>;
}
function Field({ label, children }) { return <label className="form-field"><span>{label}</span>{children}</label>; }
function Metric({ icon, label, value }) { return <div className="metric-card"><span>{icon}</span><div><strong>{value}</strong><small>{label}</small></div></div>; }
function HealthRow({ icon, label, value }) { return <div className="health-row"><span>{icon}</span><strong>{label}</strong><em>{value}</em></div>; }
function ProfileItem({ label, value }) { return <div className="profile-item"><span>{label}</span><strong>{value}</strong></div>; }
function InputPill({ icon, title, text }) { return <div className="input-pill"><span>{icon}</span><div><strong>{title}</strong><small>{text}</small></div><CheckCircle2 size={16}/></div>; }
function EmptyState({ text }) { return <div className="empty-state"><CircleDot size={20}/>{text}</div>; }
function StatusBars({ stats }) {
  const items = [['Submitted', stats.submitted], ['Accepted', stats.accepted], ['Transferred', stats.transferred], ['Completed', stats.completed], ['Escalated', stats.escalated]];
  const max = Math.max(1, ...items.map(x => x[1]));
  return <div className="status-bars">{items.map(([name, value]) => <div className="status-bar" key={name}><div><span>{name}</span><strong>{value}</strong></div><i><b style={{width: `${Math.max(4, (value/max)*100)}%`}}/></i></div>)}</div>;
}
function RecentReferrals({ referrals, loading, onOpen }) {
  return <div className="portal-panel"><div className="panel-heading"><div><span>RECENT REFERRALS</span><h3>Latest coordination activity</h3></div></div>{loading ? <EmptyState text="Loading referrals…"/> : referrals.length ? <div className="recent-list">{referrals.map(r => <button key={r.id} className="recent-row" onClick={() => onOpen(r)}><span className={`urgency ${r.urgency.toLowerCase()}`}>{r.urgency}</span><div><strong>{r.requiredService}</strong><small>{r.location} · {r.patientAge} yrs</small></div><em>{r.status}</em><ChevronRight size={17}/></button>)}</div> : <EmptyState text="No referrals yet. Create the first referral."/>}</div>;
}
function ReferralWorkspace({ referrals, loading, error, onRefresh, onCreate, onOpen, onStatus }) {
  const [filter, setFilter] = React.useState('ALL');
  const visible = filter === 'ALL' ? referrals : referrals.filter(r => r.status === filter);
  return <div className="portal-content"><div className="portal-actions"><button className="portal-primary" onClick={onCreate}><ClipboardList size={18}/> Create Referral</button><button className="portal-secondary" onClick={onRefresh}><RefreshCw size={18}/> Refresh</button></div><div className="filter-row">{['ALL','SUBMITTED','ACCEPTED','TRANSFERRED','ESCALATED','COMPLETED'].map(s => <button key={s} className={filter===s?'filter active':'filter'} onClick={()=>setFilter(s)}>{s === 'ALL' ? 'All' : s}</button>)}</div>{error && <div className="form-error">{error}</div>}{loading ? <EmptyState text="Loading referrals…"/> : visible.length ? <div className="referral-table">{visible.map(r => <div className="referral-row" key={r.id}><div><span className={`urgency ${r.urgency.toLowerCase()}`}>{r.urgency}</span><strong>{r.requiredService}</strong><small>{r.location} · Patient {r.patientAge}</small></div><div><span className="status-chip">{r.status}</span><small>{new Date(r.createdAt).toLocaleString()}</small></div><button className="row-view" onClick={()=>onOpen(r)}>View <ChevronRight size={15}/></button></div>)}</div> : <EmptyState text="No referrals match this filter."/>}</div>;
}
function ReferralDetail({ referral, facilities, onClose, onStatus }) {
  const matches = Array.isArray(referral.matches) ? referral.matches : [];
  return <div className="upgrade-modal-overlay"><section className="upgrade-modal detail-modal"><button className="upgrade-close" onClick={onClose}><X size={19}/></button><div className="detail-head"><span className={`urgency ${referral.urgency.toLowerCase()}`}>{referral.urgency}</span><div><small>REFERRAL</small><h2>{referral.requiredService}</h2><p>{referral.location} · Patient age {referral.patientAge}</p></div><span className="status-chip">{referral.status}</span></div><div className="timeline">{['SUBMITTED','ACCEPTED','TRANSFERRED','COMPLETED'].map((s,i)=>{const done=STATUS_FLOW.indexOf(referral.status)>=i;return <div className={done?'timeline-step done':'timeline-step'} key={s}><span>{done?<Check/>:i+1}</span><strong>{s}</strong>{i<3&&<i/>}</div>})}</div><div className="match-heading"><div><span>EXPLAINABLE MATCHING</span><h3>Recommended facilities</h3></div><small>Scored by the JeevanSetu engine</small></div>{matches.length ? <div className="match-list">{matches.map((m,index)=>{const f=facilities.find(x=>x.id===m.facilityId);return <div className="match-row" key={m.facilityId}><div className="rank">{index+1}</div><div><strong>{f?.name || 'Recommended facility'}</strong><small>{f?.district || 'District unavailable'} · {f?.bedsAvailable ?? '—'} beds</small></div><div className="score">{Number(m.score).toFixed(0)}<small>score</small></div></div>})}</div> : <EmptyState text="No stored recommendations for this referral."/>}<div className="detail-actions">{referral.status === 'SUBMITTED' && <><button className="secondary-btn" onClick={()=>onStatus(referral.id,'REJECTED')}>Reject</button><button className="primary-btn" onClick={()=>onStatus(referral.id,'ACCEPTED')}>Accept Referral <Check size={17}/></button></>}{referral.status === 'ACCEPTED' && <button className="primary-btn" onClick={()=>onStatus(referral.id,'TRANSFERRED')}>Mark Transfer Started <Route size={17}/></button>}{referral.status === 'TRANSFERRED' && <button className="primary-btn" onClick={()=>onStatus(referral.id,'COMPLETED')}>Mark Completed <CheckCircle2 size={17}/></button>}{['SUBMITTED','ACCEPTED'].includes(referral.status) && <button className="warning-btn" onClick={()=>onStatus(referral.id,'ESCALATED')}><AlertTriangle size={17}/> Escalate</button>}</div></section></div>;
}
function BrandMark({ small = false }) { return <span className={small ? 'brand-mark small' : 'brand-mark'}><HeartPulse size={small ? 22 : 28} strokeWidth={2.4}/><span className="brand-plus">+</span></span>; }
function Benefit({ icon, title, text }) { return <div className="benefit"><span className="benefit-icon">{icon}</span><div><strong>{title}</strong><small>{text}</small></div></div>; }
function Step({ number, icon, title, text }) { return <div className="step"><div className="step-number">{number}</div><div className="step-icon">{icon}</div><h3>{title}</h3><p>{text}</p></div>; }
function FacilityItem({ icon, title }) { return <div className="facility-item"><span>{icon}</span><strong>{title}</strong><Check size={17}/></div>; }
function CheckItem({ text }) { return <div className="check-item"><span><Check size={15}/></span>{text}</div>; }
function ReferralMap() { return <div className="map-wrap" aria-label="Healthcare facility network illustration"><div className="map-bg"><div className="hill h1"/><div className="hill h2"/><div className="road road1"/><div className="road road2"/><div className="road road3"/><div className="tree t1"/><div className="tree t2"/><div className="tree t3"/><svg className="route-svg" viewBox="0 0 620 470" preserveAspectRatio="none"><path d="M90 365 C150 315,205 345,250 270 S365 205,405 125 S495 115,535 60" fill="none" stroke="#fff" strokeWidth="15" strokeLinecap="round"/><path d="M90 365 C150 315,205 345,250 270 S365 205,405 125 S495 115,535 60" fill="none" stroke="#2a9df4" strokeWidth="8" strokeLinecap="round"/></svg><MapPin className="map-pin p1"/><MapPin className="map-pin p2"/><MapPin className="map-pin p3"/></div><MapCard className="map-card district" icon={<Hospital/>} title="District Hospital" tags={['General','Diagnostics','Emergency']}/><MapCard className="map-card specialist" icon={<Building2/>} title="Specialized Hospital" tags={['Cardiology','ICU','Diagnostics']}/><MapCard className="map-card rural" icon={<Building2/>} title="Rural Hospital" tags={['General Medicine','Referrals']}/><div className="match-card"><span className="match-icon"><MapPin size={20}/></span><div><strong>Context-aware matching</strong><ul><li>Capability</li><li>Availability</li><li>Urgency</li><li>Location</li></ul></div></div></div>; }
function MapCard({ className, icon, title, tags }) { return <div className={className}><span className="mini-hospital">{icon}</span><div><strong>{title}</strong><div className="tags">{tags.map(t=><span key={t}>{t}</span>)}</div></div></div>; }

createRoot(document.getElementById('root')).render(<App />);
