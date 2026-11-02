import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { HeartHandshake, Hospital, CalendarDays, Headphones, Languages, Mic, Volume2, Search, MapPin, Clock3, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

type Lang = 'en' | 'kn' | 'hi';
type Facility = { id: string; name: string; area: string; departments: string[]; hours: string; is_demo: boolean };
type Booking = { reference: string; facility_name: string; department: string; preferred_date: string; notice: string; is_demo: boolean };

const words = {
  en: {
    tagline:'Healthcare, made easier to access.',welcome:'How can we help you today?',intro:'Choose a service. Use your voice or the buttons below.',
    find:'Find healthcare',book:'Request an appointment',learn:'Understand health services',findTitle:'Find sample healthcare centres',
    findHelp:'These are fictional demonstration records, not verified hospitals.',search:'Search by area or facility',speak:'Speak search',facilities:'Healthcare centres',
    bookTitle:'Request a demo appointment',name:'Your name',facility:'Centre',department:'Department',date:'Preferred date',choose:'Choose one',
    submit:'Submit demo request',demo:'DEMONSTRATION ONLY — no hospital is contacted and no real appointment is booked.',
    reference:'Reference',back:'Back',noResults:'No sample centres match your search.',required:'Please complete every field.',
    error:'Something went wrong. Please try again.',services:'Common services',opd:'Outpatient department (OPD)',
    opdText:'Consult a qualified clinician without an overnight stay.',lab:'Laboratory',labText:'Samples may be tested as requested by a qualified clinician.',
    emergency:'Emergency care',emergencyText:'For a life-threatening emergency, contact local emergency services immediately.',
    read:'Read this page aloud',voiceUnavailable:'Voice input is not available here. You can type instead.',
    safe:'No diagnosis • No treatment advice • Sample data only',large:'Larger text',contrast:'High contrast'
  },
  kn: {
    tagline:'ಆರೋಗ್ಯ ಸೇವೆಗಳನ್ನು ಸುಲಭವಾಗಿ ಪಡೆಯಿರಿ.',welcome:'ಇಂದು ನಾವು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?',intro:'ಒಂದು ಸೇವೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ. ಧ್ವನಿ ಅಥವಾ ಕೆಳಗಿನ ಬಟನ್‌ಗಳನ್ನು ಬಳಸಿ.',
    find:'ಆರೋಗ್ಯ ಸೇವೆ ಹುಡುಕಿ',book:'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ವಿನಂತಿಸಿ',learn:'ಆರೋಗ್ಯ ಸೇವೆಗಳ ಮಾಹಿತಿ',findTitle:'ಮಾದರಿ ಆರೋಗ್ಯ ಕೇಂದ್ರಗಳನ್ನು ಹುಡುಕಿ',
    findHelp:'ಇವು ಕಾಲ್ಪನಿಕ ಮಾದರಿ ದಾಖಲೆಗಳು; ಪರಿಶೀಲಿತ ಆಸ್ಪತ್ರೆಗಳಲ್ಲ.',search:'ಪ್ರದೇಶ ಅಥವಾ ಕೇಂದ್ರದ ಮೂಲಕ ಹುಡುಕಿ',speak:'ಧ್ವನಿಯಿಂದ ಹುಡುಕಿ',facilities:'ಆರೋಗ್ಯ ಕೇಂದ್ರಗಳು',
    bookTitle:'ಮಾದರಿ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ವಿನಂತಿ',name:'ನಿಮ್ಮ ಹೆಸರು',facility:'ಕೇಂದ್ರ',department:'ವಿಭಾಗ',date:'ಆದ್ಯತೆಯ ದಿನಾಂಕ',choose:'ಆಯ್ಕೆಮಾಡಿ',
    submit:'ಮಾದರಿ ವಿನಂತಿ ಸಲ್ಲಿಸಿ',demo:'ಮಾದರಿ ಮಾತ್ರ — ಯಾವುದೇ ಆಸ್ಪತ್ರೆಗೆ ಸಂಪರ್ಕಿಸುವುದಿಲ್ಲ ಮತ್ತು ನಿಜವಾದ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಆಗುವುದಿಲ್ಲ.',
    reference:'ಉಲ್ಲೇಖ',back:'ಹಿಂತಿರುಗಿ',noResults:'ಹುಡುಕಾಟಕ್ಕೆ ಹೊಂದುವ ಮಾದರಿ ಕೇಂದ್ರಗಳಿಲ್ಲ.',required:'ದಯವಿಟ್ಟು ಎಲ್ಲಾ ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ.',
    error:'ದೋಷ ಸಂಭವಿಸಿದೆ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',services:'ಸಾಮಾನ್ಯ ಸೇವೆಗಳು',opd:'ಹೊರರೋಗಿ ವಿಭಾಗ (OPD)',
    opdText:'ರಾತ್ರಿ ಉಳಿಯದೆ ಅರ್ಹ ವೈದ್ಯರಿಂದ ಸಲಹೆ ಪಡೆಯುವ ಸ್ಥಳ.',lab:'ಪ್ರಯೋಗಾಲಯ',labText:'ಅರ್ಹ ವೈದ್ಯರ ಸೂಚನೆಯಂತೆ ಮಾದರಿಗಳನ್ನು ಪರೀಕ್ಷಿಸಬಹುದು.',
    emergency:'ತುರ್ತು ಚಿಕಿತ್ಸೆ',emergencyText:'ಜೀವಕ್ಕೆ ಅಪಾಯವಿದ್ದರೆ ತಕ್ಷಣ ಸ್ಥಳೀಯ ತುರ್ತು ಸೇವೆಗಳನ್ನು ಸಂಪರ್ಕಿಸಿ.',
    read:'ಈ ಪುಟವನ್ನು ಓದಿ',voiceUnavailable:'ಇಲ್ಲಿ ಧ್ವನಿ ಇನ್‌ಪುಟ್ ಲಭ್ಯವಿಲ್ಲ. ಬದಲಿಗೆ ಟೈಪ್ ಮಾಡಬಹುದು.',
    safe:'ರೋಗನಿರ್ಣಯವಿಲ್ಲ • ಚಿಕಿತ್ಸೆ ಸಲಹೆಯಿಲ್ಲ • ಮಾದರಿ ಮಾಹಿತಿ ಮಾತ್ರ',large:'ದೊಡ್ಡ ಅಕ್ಷರಗಳು',contrast:'ಹೆಚ್ಚಿನ ಕಾಂಟ್ರಾಸ್ಟ್'
  },
  hi: {
    tagline:'स्वास्थ्य सेवाएँ पाना अब आसान।',welcome:'आज हम आपकी कैसे मदद कर सकते हैं?',intro:'एक सेवा चुनें। आवाज़ या नीचे दिए बटन इस्तेमाल करें।',
    find:'स्वास्थ्य केंद्र खोजें',book:'अपॉइंटमेंट का अनुरोध करें',learn:'स्वास्थ्य सेवाओं को समझें',findTitle:'नमूना स्वास्थ्य केंद्र खोजें',
    findHelp:'ये काल्पनिक डेमो रिकॉर्ड हैं, सत्यापित अस्पताल नहीं।',search:'क्षेत्र या केंद्र से खोजें',speak:'आवाज़ से खोजें',facilities:'स्वास्थ्य केंद्र',
    bookTitle:'डेमो अपॉइंटमेंट अनुरोध',name:'आपका नाम',facility:'केंद्र',department:'विभाग',date:'पसंदीदा तारीख',choose:'चुनें',
    submit:'डेमो अनुरोध भेजें',demo:'केवल डेमो — किसी अस्पताल से संपर्क नहीं किया जाता और वास्तविक अपॉइंटमेंट नहीं होता।',
    reference:'संदर्भ',back:'वापस',noResults:'आपकी खोज से मेल खाने वाला नमूना केंद्र नहीं मिला।',required:'कृपया सभी जानकारी भरें।',
    error:'कुछ गलत हुआ। फिर कोशिश करें।',services:'आम सेवाएँ',opd:'बाह्य रोगी विभाग (OPD)',
    opdText:'रात में रुके बिना योग्य चिकित्सक से परामर्श लें।',lab:'प्रयोगशाला',labText:'योग्य चिकित्सक के निर्देश पर नमूनों की जाँच हो सकती है।',
    emergency:'आपातकालीन देखभाल',emergencyText:'जानलेवा आपात स्थिति में तुरंत स्थानीय आपातकालीन सेवाओं से संपर्क करें।',
    read:'यह पृष्ठ सुनें',voiceUnavailable:'यहाँ आवाज़ से इनपुट उपलब्ध नहीं है। आप टाइप कर सकते हैं।',
    safe:'निदान नहीं • उपचार सलाह नहीं • केवल नमूना डेटा',large:'बड़ा टेक्स्ट',contrast:'अधिक कंट्रास्ट'
  }
} as const;

const locales: Record<Lang,string> = {en:'en-IN',kn:'kn-IN',hi:'hi-IN'};
const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/,'');

async function request<T>(path:string, init?:RequestInit):Promise<T> {
  const response = await fetch(apiBase + path, {
    ...init, headers: { ...(init?.body ? {'Content-Type':'application/json'} : {}), ...init?.headers }
  });
  if (!response.ok) {
    const body = await response.json().catch(()=>({}));
    throw new Error(body.detail || 'Request failed');
  }
  return response.json();
}

export default function App() {
  const [lang,setLang] = useState<Lang>('en');
  const [page,setPage] = useState<'home'|'find'|'book'|'learn'>('home');
  const [facilities,setFacilities] = useState<Facility[]>([]);
  const [query,setQuery] = useState('');
  const [name,setName] = useState('');
  const [facilityId,setFacilityId] = useState('');
  const [department,setDepartment] = useState('');
  const [date,setDate] = useState('');
  const [booking,setBooking] = useState<Booking|null>(null);
  const [error,setError] = useState('');
  const [large,setLarge] = useState(false);
  const [contrast,setContrast] = useState(false);
  const [busy,setBusy] = useState(false);
  const t = words[lang];

  useEffect(()=>{ request<Facility[]>('/api/v1/facilities').then(setFacilities).catch(()=>setError(t.error)); },[]);
  const filtered = useMemo(()=>facilities.filter(f=>(f.name+' '+f.area+' '+f.departments.join(' ')).toLowerCase().includes(query.toLowerCase())),[facilities,query]);
  const selected = facilities.find(f=>f.id===facilityId);

  function say(text:string) {
    if (!('speechSynthesis' in window)) { setError(t.voiceUnavailable); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locales[lang]; utterance.rate = 0.88;
    window.speechSynthesis.speak(utterance);
  }

  function voiceSearch() {
    type Rec = {lang:string; onresult:(e:{results:ArrayLike<{0:{transcript:string}}>})=>void; onerror:()=>void; start:()=>void};
    const w = window as Window & {SpeechRecognition?:new()=>Rec; webkitSpeechRecognition?:new()=>Rec};
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) { setError(t.voiceUnavailable); return; }
    const rec = new Ctor(); rec.lang = locales[lang];
    rec.onresult = e => setQuery(e.results[0][0].transcript);
    rec.onerror = ()=>setError(t.voiceUnavailable); rec.start();
  }

  async function submit(e:FormEvent) {
    e.preventDefault(); setError(''); setBooking(null);
    if (!name.trim() || !facilityId || !department || !date) { setError(t.required); return; }
    setBusy(true);
    try {
      const result = await request<Booking>('/api/v1/appointments',{method:'POST',body:JSON.stringify({
        participant_name:name.trim(),facility_id:facilityId,department,preferred_date:date,language:lang
      })});
      setBooking(result);
    } catch { setError(t.error); } finally { setBusy(false); }
  }

  const today = new Date().toISOString().slice(0,10);
  return <div className={`shell ${large?'large':''} ${contrast?'contrast':''}`}>
    <header className="topbar">
      <button className="brand" onClick={()=>setPage('home')}><span className="mark"><HeartHandshake/></span><span><b>SwasthyaAccess</b><small>{t.tagline}</small></span></button>
      <div className="actions">
        <label className="lang"><Languages size={18}/><span className="sr">{lang}</span>
          <select value={lang} onChange={e=>{setLang(e.target.value as Lang);setError('');}} aria-label="Language">
            <option value="en">English</option><option value="kn">ಕನ್ನಡ</option><option value="hi">हिन्दी</option>
          </select>
        </label>
        <button className="icon" onClick={()=>say(t.welcome+'. '+t.intro)} aria-label={t.read}><Volume2/></button>
      </div>
    </header>
    <main>
      <div className="notice"><ShieldCheck size={16}/>{t.safe}</div>
      <section className="hero"><div><p className="eyebrow">ACCESSIBLE HEALTHCARE NAVIGATION</p><h1>{t.welcome}</h1><p>{t.intro}</p></div>
        <div className="tools"><button onClick={()=>setLarge(!large)}>{t.large}</button><button onClick={()=>setContrast(!contrast)}>{t.contrast}</button></div>
      </section>
      {page==='home' && <section className="cards">
        <button onClick={()=>setPage('find')}><span className="tile"><Hospital/></span><b>{t.find}</b><small>{t.findHelp}</small><ArrowRight/></button>
        <button onClick={()=>{setBooking(null);setPage('book')}}><span className="tile peach"><CalendarDays/></span><b>{t.book}</b><small>{t.demo}</small><ArrowRight/></button>
        <button onClick={()=>setPage('learn')}><span className="tile purple"><Headphones/></span><b>{t.learn}</b><small>{t.services}</small><ArrowRight/></button>
      </section>}
      {page==='find' && <section className="panel">
        <button className="back" onClick={()=>setPage('home')}>← {t.back}</button><h2>{t.findTitle}</h2><p>{t.findHelp}</p>
        <div className="searchrow"><label><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t.search}/></label><button className="primary" onClick={voiceSearch}><Mic/>{t.speak}</button></div>
        <h3>{t.facilities}</h3><div className="facilitylist">{filtered.map(f=><article key={f.id}>
          <Hospital/><div><b>{f.name}</b><p><MapPin size={14}/>{f.area}</p><p><Clock3 size={14}/>{f.hours}</p><div className="chips">{f.departments.map(d=><span key={d}>{d}</span>)}</div></div>
          <button onClick={()=>{setFacilityId(f.id);setPage('book')}}>{t.book}</button>
        </article>)}{!filtered.length&&<p>{t.noResults}</p>}</div>
      </section>}
      {page==='book' && <section className="panel formpanel"><button className="back" onClick={()=>setPage('home')}>← {t.back}</button><h2>{t.bookTitle}</h2><p>{t.demo}</p>
        <form onSubmit={submit}>
          <label>{t.name}<input value={name} onChange={e=>setName(e.target.value)} autoComplete="name"/></label>
          <label>{t.facility}<select value={facilityId} onChange={e=>setFacilityId(e.target.value)}><option value="">{t.choose}</option>{facilities.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></label>
          <label>{t.department}<select value={department} onChange={e=>setDepartment(e.target.value)}><option value="">{t.choose}</option>{(selected?.departments||[]).map(d=><option key={d}>{d}</option>)}</select></label>
          <label>{t.date}<input type="date" min={today} value={date} onChange={e=>setDate(e.target.value)}/></label>
          {error&&<p className="error" role="alert">{error}</p>}
          <button className="primary submit" disabled={busy}>{busy?'…':t.submit}<ArrowRight/></button>
        </form>
        {booking&&<div className="success" role="status"><CheckCircle2/><h3>{t.reference}: {booking.reference}</h3><p>{booking.facility_name} · {booking.department} · {booking.preferred_date}</p><strong>{booking.notice}</strong></div>}
      </section>}
      {page==='learn'&&<section className="panel"><button className="back" onClick={()=>setPage('home')}>← {t.back}</button><h2>{t.services}</h2>
        {[['OPD',t.opd,t.opdText],['LAB',t.lab,t.labText],['!',t.emergency,t.emergencyText]].map(([icon,title,desc])=><article className="service" key={icon}><div><h3>{title}</h3><p>{desc}</p></div><button className="icon" onClick={()=>say(desc)} aria-label={t.read}><Volume2/></button></article>)}
      </section>}
      <footer><span><ShieldCheck size={15}/>{t.demo}</span><span>English · ಕನ್ನಡ · हिन्दी</span></footer>
    </main>
  </div>;
}
