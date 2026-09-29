import React from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowRight, Building2, Check, ChevronDown, ClipboardList, Globe2, HeartPulse, Hospital, Languages, LockKeyhole, MapPin, Menu, Route, Search, ShieldCheck, Sparkles, UserRound, X, Zap } from 'lucide-react';
import './styles.css';

const navItems = ['Home', 'About', 'How It Works', 'For Hospitals', 'Contact'];

function App() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [languageOpen, setLanguageOpen] = React.useState(false);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
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
              <button key={item} className={index === 0 ? 'nav-link active' : 'nav-link'} onClick={() => scrollTo(index === 0 ? 'home' : item.toLowerCase().replaceAll(' ', '-'))}>
                {item}
              </button>
            ))}
          </nav>

          <div className="nav-actions">
            <div className="language-wrap">
              <button className="language-btn" onClick={() => setLanguageOpen(v => !v)}>
                <Languages size={16} /> EN <ChevronDown size={14} />
              </button>
              {languageOpen && <div className="language-menu"><button>English</button><button>हिन्दी</button><button>मराठी</button></div>}
            </div>
            <button className="login-btn" onClick={() => alert('Hospital Login will connect to the authentication system.') }>
              <UserRound size={17} /> Hospital Login
            </button>
            <button className="mobile-toggle" onClick={() => setMobileOpen(v => !v)} aria-label="Toggle navigation">
              {mobileOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>

      <main>
        <section id="home" className="hero">
          <div className="hero-inner">
            <div className="hero-copy">
              <div className="eyebrow"><span className="eyebrow-dot" /> AI-assisted healthcare coordination</div>
              <h1>Connecting Patients to<br />the Right Healthcare Facility<br /><span>When It Matters Most</span></h1>
              <p>JeevanSetu is an AI-assisted healthcare referral and coordination platform that connects healthcare requirements with the most suitable available facility based on capability, availability, urgency and location.</p>

              <div className="hero-actions">
                <button className="feature-card blue" onClick={() => scrollTo('how-it-works')}>
                  <span className="feature-icon"><ClipboardList size={28} /></span>
                  <span className="feature-content"><strong>Refer a Patient</strong><small>Find the most suitable facility for a patient</small><em>Create a referral request</em></span>
                  <span className="round-arrow"><ArrowRight size={20} /></span>
                </button>
                <button className="feature-card green" onClick={() => scrollTo('for-hospitals')}>
                  <span className="feature-icon"><Building2 size={28} /></span>
                  <span className="feature-content"><strong>Manage Facilities</strong><small>Update your hospital’s services and availability</small><em>Keep your information up to date</em></span>
                  <span className="round-arrow"><ArrowRight size={20} /></span>
                </button>
              </div>
            </div>

            <ReferralMap />
          </div>
        </section>

        <section className="benefits-strip" aria-label="Platform benefits">
          <Benefit icon={<Zap />} title="Faster Referrals" text="Reduce delays in patient care" />
          <Benefit icon={<ShareIcon />} title="Better Coordination" text="Connect healthcare facilities" />
          <Benefit icon={<ShieldCheck />} title="Intelligent Matching" text="Beyond nearest hospital" />
          <Benefit icon={<Route />} title="Track Till Completion" text="Closed-loop referral system" />
        </section>

        <section id="how-it-works" className="workflow-section page-section">
          <div className="section-card">
            <div className="section-heading"><span>HOW IT WORKS</span><h2>How JeevanSetu Works</h2><p>From the initial healthcare requirement to referral completion, every step stays connected.</p></div>
            <div className="workflow-grid">
              <Step number="1" icon={<ClipboardList />} title="Submit Requirement" text="Create a patient referral request with key details" />
              <Step number="2" icon={<Search />} title="Find Best Match" text="AI identifies the most suitable available facility" />
              <Step number="3" icon={<Hospital />} title="Coordinate & Transfer" text="Connect with the selected facility and manage the transfer" />
              <Step number="4" icon={<ClipboardList />} title="Track to Completion" text="Monitor the referral until patient care is completed" />
            </div>
          </div>
        </section>

        <section id="for-hospitals" className="hospital-section page-section">
          <div className="split-card">
            <div><div className="eyebrow">FOR HEALTHCARE FACILITIES</div><h2>Keep your facility visible when it matters.</h2><p>Maintain your services, capabilities, capacity and availability so the referral engine can make better context-aware recommendations.</p><button className="primary-btn" onClick={() => alert('Facility onboarding will connect to the hospital registration flow.')}>Register Facility <ArrowRight size={17} /></button></div>
            <div className="facility-list"><FacilityItem icon={<HeartPulse />} title="Clinical capabilities" /><FacilityItem icon={<Building2 />} title="Available services & resources" /><FacilityItem icon={<MapPin />} title="Location & catchment" /><FacilityItem icon={<LockKeyhole />} title="Verified facility access" /></div>
          </div>
        </section>

        <section id="about" className="about-section page-section">
          <div className="about-grid">
            <div><div className="eyebrow">WHY JEEVANSETU</div><h2>Not just the nearest hospital — the most suitable available facility.</h2><p>JeevanSetu considers capability, availability, urgency and location together. It is designed to reduce fragmented referrals and create a closed-loop coordination workflow.</p></div>
            <div className="check-list"><CheckItem text="Context-aware facility matching" /><CheckItem text="Real-time referral coordination" /><CheckItem text="Escalation for delayed or rejected referrals" /><CheckItem text="Referral tracking through completion" /></div>
          </div>
        </section>

        <section id="contact" className="contact-section page-section">
          <div className="contact-card"><div><div className="eyebrow">CONTACT</div><h2>Build a more connected healthcare network.</h2><p>For hospital onboarding, demonstrations and project information, reach out to the JeevanSetu team.</p></div><button className="primary-btn" onClick={() => alert('Contact flow will be connected to the backend.')}>Contact Team <ArrowRight size={17} /></button></div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand"><BrandMark small /><div><strong>Jeevan<span>Setu</span></strong><small>Connecting Healthcare. Bridging Lives.</small></div></div>
          <div className="footer-links"><button>About</button><button>Privacy</button><button>Terms</button><button>Contact</button></div>
          <p>Designed to improve access to quality healthcare for everyone.</p>
        </div>
      </footer>
    </div>
  );
}

function BrandMark({ small = false }) { return <span className={small ? 'brand-mark small' : 'brand-mark'}><HeartPulse size={small ? 22 : 28} strokeWidth={2.4} /><span className="brand-plus">+</span></span>; }
function Benefit({ icon, title, text }) { return <div className="benefit"><span className="benefit-icon">{icon}</span><div><strong>{title}</strong><small>{text}</small></div></div>; }
function ShareIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5"/></svg>; }
function Step({ number, icon, title, text }) { return <div className="step"><div className="step-number">{number}</div><div className="step-icon">{icon}</div><h3>{title}</h3><p>{text}</p></div>; }
function FacilityItem({ icon, title }) { return <div className="facility-item"><span>{icon}</span><strong>{title}</strong><Check size={17} /></div>; }
function CheckItem({ text }) { return <div className="check-item"><span><Check size={15} /></span>{text}</div>; }

function ReferralMap() {
  return <div className="map-wrap" aria-label="Illustration of healthcare facilities connected by a route">
    <div className="map-bg"><div className="hill h1"/><div className="hill h2"/><div className="road road1"/><div className="road road2"/><div className="road road3"/><div className="tree t1"/><div className="tree t2"/><div className="tree t3"/><div className="tree t4"/><div className="tree t5"/>
      <svg className="route-svg" viewBox="0 0 620 470" preserveAspectRatio="none"><path d="M90 365 C150 315, 205 345, 250 270 S365 205, 405 125 S495 115, 535 60" fill="none" stroke="#ffffff" strokeWidth="15" strokeLinecap="round"/><path d="M90 365 C150 315, 205 345, 250 270 S365 205, 405 125 S495 115, 535 60" fill="none" stroke="#2a9df4" strokeWidth="8" strokeLinecap="round"/></svg>
      <MapPin className="map-pin p1"/><MapPin className="map-pin p2"/><MapPin className="map-pin p3"/>
    </div>
    <MapCard className="map-card district" icon={<Hospital />} title="District Hospital" tags={['General','Diagnostics','Emergency']} />
    <MapCard className="map-card specialist" icon={<Building2 />} title="Specialized Hospital" tags={['Cardiology','Neurology','ICU']} />
    <MapCard className="map-card rural" icon={<Building2 />} title="Rural Hospital" tags={['Primary Care','Referrals']} />
    <div className="match-card"><span className="match-icon"><MapPin size={20}/></span><div><strong>AI matches with the most suitable facility based on:</strong><ul><li>Capability</li><li>Availability</li><li>Urgency</li><li>Location</li></ul></div></div>
  </div>;
}
function MapCard({ className, icon, title, tags }) { return <div className={className}><span className="mini-hospital">{icon}</span><div><strong>{title}</strong><div className="tags">{tags.map(t => <span key={t}>{t}</span>)}</div></div></div>; }

createRoot(document.getElementById('root')).render(<App />);
