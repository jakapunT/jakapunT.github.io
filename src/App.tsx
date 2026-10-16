import { useEffect, useState } from 'react';
import { ArrowUpRight, Download, Lock, Menu, X } from 'lucide-react';
import { courses, findCourse, type Course } from './courseData';

const research = [
  ['Large Language Models', 'Building and adapting language models, with a particular focus on Thai.'],
  ['Retrieval-Augmented Generation', 'Connecting generative systems with trustworthy, domain-specific information.'],
  ['Sentiment & social behaviour', 'Measuring opinion, stance, trends, and behaviour in online discussion.'],
  ['Applied language technology', 'Conversational AI, information extraction, summarisation, multilingual and healthcare NLP.'],
];
const publications = [
  ['2024', "Investigating the Influence of Psychologists' Recommendations on Thai Juvenile Court Judgements", 'Praingcharoenkit, C., Sangkhao, S., Kawto, W., Rutherford, A. T., & Tachaiya, J.', '21st International Joint Conference on Computer Science and Software Engineering (JCSSE) · Bangkok, Thailand', 'https://doi.org/10.1109/jcsse61278.2024.10613718'],
  ['2022', 'IKEA: Unsupervised domain-specific keyword-expansion', 'Tachaiya, J., Gharibshah, J., Imani, A., Papalexakis, E. E., & Faloutsos, M.', 'IEEE/ACM International Conference on Advances in Social Networks Analysis and Mining (ASONAM) · Istanbul, Turkey', 'https://doi.org/10.1109/asonam55973.2022.10088556'],
  ['2021', 'SentiStance: quantifying the intertwined changes of sentiment and stance in response to an event in online forums', 'Tachaiya, J., Gharibshah, J., Irani, A., Esterling, K. M., & Faloutsos, M.', 'IEEE/ACM International Conference on Advances in Social Networks Analysis and Mining (ASONAM) · The Hague, Netherlands', 'https://doi.org/10.1145/3467351.3490966'],
  ['2020', 'RAFFMAN: Measuring and Analyzing Sentiment in Online Political Forum Discussions with an Application to the Trump Impeachment', 'Tachaiya, J., Gharibshah, J., & Esterling, K. M.', 'International AAAI Conference on Web and Social Media (ICWSM) · Atlanta, Georgia', 'https://doi.org/10.1609/icwsm.v15i1.18096'],
  ['2020', 'RThread: A thread-centric analysis of security forums', 'Tachaiya, J., Gharibshah, J., Papalexakis, E. E., & Faloutsos, M.', 'IEEE/ACM International Conference on Advances in Social Networks Analysis and Mining (ASONAM) · The Hague, Netherlands', 'https://doi.org/10.1109/asonam49781.2020.9381312'],
];
const current = [['Thanawat Traipat','LangTech BA student'],['Kawinna Boontos','Linguistics MA student']];
const alumni = [
  ['Chinjuta Sa-Ngasaeng','LangTech BA',''],['Thanete Wutiwan','LangTech BA',''],['Jirapach Rungruengsrisang','LangTech BA',''],['Phurichaya Hongsuparuk','LangTech BA',''],['Benyapa Phlaiduang','LangTech BA',''],
  ['Nanthipat Kongborrirak','LangTech BA · 2024','Assessment of a Large Language Model’s Reading and Comprehension Proficiency in the Thai Language'],
  ['Tayawat Songcharoensuk','ComSci, KMITL · 2024','Developing Aspect-Based Sentiment Analysis Methods Through Prompt Engineering'],['Witchaya Panpradit','ComSci, KMITL · 2024','Developing Aspect-Based Sentiment Analysis Methods Through Prompt Engineering'],
  ['Chonnasat Gunngam','ComSci, KMITL · 2024','Evaluating Techniques and Methods for Text-to-Image Generation'],['Chaichan Sampaosong','ComSci, KMITL · 2024','Evaluating Techniques and Methods for Text-to-Image Generation'],
  ['Rachata Phuphirom','ComSci, KMITL · 2024','Developing Chatbot for School of Science KMITL With Retrieval Augmented Generation'],['Akesila Potong','ComSci, KMITL · 2024','Developing Chatbot for School of Science KMITL With Retrieval Augmented Generation'],
  ['Chadathip Prangkulcharoenkit','ComSci, KMITL · 2023','Court Verdict Classification and Prediction in Thai Juvenile and Family Courts'],['Sirirat Sanghkao','ComSci, KMITL · 2023','Court Verdict Classification and Prediction in Thai Juvenile and Family Courts'],
  ['Wanwisa Kawto','ComSci, KMITL · 2023','Automated Expert Recommendation Generation for Thai Juvenile Cases using Natural Language Processing'],['Tanawat Kaewmanee','ComSci, KMITL · 2023','Headlines Generation for Thai News: Engaging Readers with AI-Generated Titles with Emotions'],['Tuntorn Chongsakul','ComSci, KMITL · 2023','Headlines Generation for Thai News: Engaging Readers with AI-Generated Titles with Emotions'],
];
// Students who shared a project appear together on one row; members without a listed project share one row too.
const alumniByProject = [...alumni.reduce((m,[n,meta,p])=>m.set(p,{names:[...(m.get(p)?.names??[]),n],meta,p}),new Map<string,{names:string[],meta:string,p:string}>()).values()];
const nameList = (names:string[]) => names.length<2 ? names.join('') : `${names.slice(0,-1).join(', ')} & ${names[names.length-1]}`;
const teaching = [
  ['Fall 2026','Natural Language Processing','ISE, Chulalongkorn','Undergrad · International'],['Fall 2026','Statistics for Digital Humanities','LangTech, Chulalongkorn','Undergrad · Thai'],['Fall 2026','Programming for Natural Language Processing','LangTech, Chulalongkorn','Undergrad · Thai'],['Spring 2026','Large language model','LangTech, Chulalongkorn','Graduate · Thai'],
  ['Fall 2025','Natural Language Processing','ISE, Chulalongkorn','Undergrad · International'],['Fall 2025','Statistics for Digital Humanities','LangTech, Chulalongkorn','Undergrad · Thai'],['Fall 2025','Programming for Natural Language Processing','LangTech, Chulalongkorn','Undergrad · Thai'],['Spring 2025','Large language model','LangTech, Chulalongkorn','Graduate · Thai'],
  ['Fall 2024','Foundation of Programming','KMITL','Undergrad · International'],['Fall 2024','Intro to Natural Language Processing','KMITL','Undergrad · Thai'],['Fall 2024','Data Science Programming & Tools','KMITL','Graduate · Thai'],['Fall 2024','Generative AI','KMITL','Graduate · Thai'],['Fall 2024','Programming for Natural Language Processing','LangTech, Chulalongkorn','Undergrad · Thai'],
  ['Spring 2024','Intro to Natural Language Processing','KMITL','Undergrad · Thai'],['Spring 2024','Database Programming in Practice','KMITL','Undergrad · International'],['Spring 2024','Intro to data science','KMITL','Undergrad · International'],['Fall 2023','Intro to Natural Language Processing','KMITL','Undergrad · Thai'],['Fall 2023','Foundation of Programming','KMITL','Undergrad · International'],['Spring 2023','Intro to Natural Language Processing','KMITL','Undergrad · Thai'],['Spring 2023','Intro to data science','KMITL','Undergrad · International'],['Fall 2022','Web mining','KMITL','Undergrad · Thai'],['Fall 2022','Intro to Natural Language Processing','KMITL','Undergrad · Thai'],
];
// One row per course: the year range, then every term it ran in the meta line.
const termKey = (term:string) => { const [season,year] = term.split(' '); return Number(year)*2 + (season==='Fall'?1:0); };
const groupTeaching = (items:string[][]) => {
  const groups = new Map<string,string[][]>();
  items.forEach((row)=>{ const key=`${row[1].toLowerCase()}|${row[2]}`; groups.set(key,[...(groups.get(key)??[]),row]); });
  return [...groups.values()].map((rows)=>{
    const terms=rows.map(([t])=>t).sort((a,b)=>termKey(b)-termKey(a));
    const years=terms.map((t)=>t.split(' ')[1]); const first=years[years.length-1], last=years[0];
    return {latest:termKey(terms[0]), row:[first===last?last:`${first}–${last}`, rows[0][1], rows[0][2], `${rows[0][3]} · ${terms.join(', ')}`]};
  }).sort((a,b)=>b.latest-a.latest).map(({row})=>row);
};
const teachingByCourse = groupTeaching(teaching);
const talks = [['April 2025','Generative AI for daily work','Thailand Institute of Scientific and Technological Research','Workshop · Thailand'],['Feb 2025','Generative AI for daily work','EC GROUP Head Office','Workshop · Thailand'],['July 2025','Intro to LLM and Gen AI workshop','Thammasat medical school','Workshop · Thailand'],['Sep 2024','Accelerating Machine Learning Process with LLMs: Beyond Traditional Task-Specific Training','KMITL Virtual Workshop','Virtual Workshop · Thailand'],['Sep 2024','Generative AI for daily work','Thailand Institute of Scientific and Technological Research','Workshop · Thailand']];
const education = [['2017–2022','Ph.D. in Computer Science','University of California, Riverside','USA · Advisor: Michalis Faloutsos'],['2014–2016','M.S. in Computer Science','University of Southern California','USA'],['2009–2012','B.E. in Computer Engineering','Chulalongkorn University','Thailand']];
const experience = [['2025–ongoing','Full-time lecturer','Linguistics Department, Chulalongkorn University','Thailand'],['2023–2025','Full-time lecturer','Computer Science Department, KMITL','Thailand'],['2021–2022','Research Lab Leader','UC Riverside','USA · Led student data-science projects on social media and contributed to an NSF-funded grant.'],['2016–2017','Research Assistant','Spatial Sciences Institute, USC','USA · Interpreted and analysed spatial data using advanced NoSQL techniques.']];

const Timeline = ({items,cols}:{items:string[][],cols?:boolean}) => <div className={cols?'timeline cols':'timeline'}>{items.map(([date,title,place,meta],i)=><article key={`${date}-${title}-${i}`}><time>{date}</time><div><h4>{title}</h4><p>{place}</p><span>{meta}</span></div></article>)}</div>;
const Label = ({n,children}:{n:string,children:string}) => <div className="label"><span>{n}</span><h2>{children}</h2></div>;
const CoursePage = ({course}:{course:Course}) => {
  useEffect(()=>{document.title=`${course.title} — Jakapun Tachaiya`; return()=>{document.title='Jakapun Tachaiya — NLP Researcher'}},[course.title]);
  return <div className="course-page">
    <header><div className="header-inner"><a className="wordmark" href="./">Jakapun Tachaiya</a><nav className="course-nav"><a href="./#teaching">← All teaching</a><a href="mailto:jakapun.t@chula.ac.th">Contact</a></nav></div></header>
    <main>
      <section className="course-hero"><p className="eyebrow">Course · Department of Linguistics · Chulalongkorn University</p><h1>{course.title}</h1><p className="lead">{course.shortDescription}</p>{course.materials&&<div className="buttons"><a className="button primary" href={course.materials.href}><Lock/>Class materials</a><a className="button" href="?materials">All class materials</a></div>}</section>
      <section className="course-layout"><aside><span>Course overview</span></aside><div className="course-description">{course.description.map((paragraph)=><p key={paragraph}>{paragraph}</p>)}</div></section>
      <section className="course-layout topics-section"><aside><span>Learning path</span></aside><div><p className="progression">{course.progression}</p><h2>Major topics</h2><div className="course-topics">{course.topics.map((topic)=><article key={topic.title}><h3>{topic.title}</h3><ul>{topic.items.map((item)=><li key={item}>{item}</li>)}</ul></article>)}</div></div></section>
    </main>
    <footer><div className="course-footer"><div><p className="footer-kicker">Questions about this course?</p><a className="footer-email" href="mailto:jakapun.t@chula.ac.th">jakapun.t@chula.ac.th</a></div><a href="./#teaching">Return to all teaching →</a></div></footer>
  </div>;
};

const MaterialsPage = () => {
  useEffect(()=>{document.title='Class materials — Jakapun Tachaiya'; return()=>{document.title='Jakapun Tachaiya — NLP Researcher'}},[]);
  return <div className="course-page materials-page">
    <header><div className="header-inner"><a className="wordmark" href="./">Jakapun Tachaiya</a><nav className="course-nav"><a href="./#teaching">← All teaching</a><a href="mailto:jakapun.t@chula.ac.th">Contact</a></nav></div></header>
    <main>
      <section className="course-hero"><p className="eyebrow">Class materials · For enrolled students</p><h1>Class materials</h1><p className="lead">Lecture pages for each class I teach. Every class has its own password, given out in class.</p><p className="lead-th" lang="th">เอกสารประกอบการเรียนสำหรับนิสิตที่ลงทะเบียน ใช้รหัสผ่านที่อาจารย์แจ้งในชั้นเรียน</p></section>
      <section className="course-layout"><aside><span>Classes</span></aside><div className="materials-list">{courses.map((course)=>{const m=course.materials; return <article key={course.slug} className={m?'':'unavailable'}>
        <p className="materials-meta">{m?`${m.term} · Taught in ${m.language}`:'Coming later'}</p>
        <div className="materials-row"><div><h2>{course.title}</h2><p>{course.shortDescription}</p><a className="materials-about" href={`?course=${course.slug}`}>About this course →</a></div>
        {m?<div className="materials-action"><a className="button primary" href={m.href}><Lock/>Enter</a><span>Password required</span></div>:<div className="materials-action"><span>Not yet available</span></div>}</div>
      </article>})}</div></section>
      <section className="course-layout"><aside><span>Password help</span></aside><div className="materials-help"><p>Ask for the password in class, or email <a href="mailto:jakapun.t@chula.ac.th">jakapun.t@chula.ac.th</a> from your university account. After you enter it once, each device remembers it for 30 days.</p><p lang="th">ถ้าไม่มีรหัสผ่าน ให้ถามในชั้นเรียน หรืออีเมลถึงอาจารย์จากอีเมลมหาวิทยาลัย เมื่อใส่รหัสผ่านครั้งแรกแล้ว เครื่องนั้นจะจำไว้ 30 วัน</p></div></section>
    </main>
    <footer><div className="course-footer"><div><p className="footer-kicker">Questions about a class?</p><a className="footer-email" href="mailto:jakapun.t@chula.ac.th">jakapun.t@chula.ac.th</a></div><a href="./#teaching">Return to all teaching →</a></div></footer>
  </div>;
};

export default function App() {
  const [open,setOpen]=useState(false);
  useEffect(()=>{const close=()=>setOpen(false); window.addEventListener('resize',close); return()=>window.removeEventListener('resize',close)},[]);
  useEffect(()=>{
    const closeOthers=(e:Event)=>{const t=e.target as HTMLElement; if(!(t instanceof HTMLDetailsElement)||!t.open||!t.classList.contains('nav-dropdown')) return; document.querySelectorAll<HTMLDetailsElement>('details.nav-dropdown[open]').forEach(d=>{if(d!==t) d.open=false;});};
    const outside=(e:MouseEvent)=>{const t=e.target as HTMLElement; document.querySelectorAll<HTMLDetailsElement>('details.nav-dropdown[open]').forEach(d=>{if(!d.contains(t)||t.closest('.dropdown-menu a')) d.open=false;});};
    document.addEventListener('toggle',closeOthers,true); document.addEventListener('click',outside);
    return()=>{document.removeEventListener('toggle',closeOthers,true); document.removeEventListener('click',outside)};
  },[]);
  const params=new URLSearchParams(window.location.search);
  if(params.has('materials')) return <MaterialsPage/>;
  const selectedCourse=findCourse(params.get('course'));
  if(selectedCourse) return <CoursePage course={selectedCourse}/>;
  return <div className="shell">
    <header><div className="header-inner"><a className="wordmark" href="#top">Jakapun Tachaiya</a><button className="menu" aria-label="Toggle navigation" aria-expanded={open} onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button><nav className={open?'open':''}>
      <a href="#research" onClick={()=>setOpen(false)}>Research</a>
      <a href="#publications" onClick={()=>setOpen(false)}>Papers</a>
      <details className="nav-dropdown"><summary>Things I Teach <span aria-hidden="true">▾</span></summary><div className="dropdown-menu course-menu">
        <a href="?course=basic-programming-nlp"><strong>Basic Programming for NLP</strong><small>Python · text processing foundations</small></a>
        <a href="?course=natural-language-processing"><strong>Natural Language Processing</strong><small>representation · models · applications</small></a>
        <a href="?course=large-language-models"><strong>Large Language Models</strong><small>training · alignment · RAG &amp; agents</small></a>
        <a href="?course=statistics-digital-humanities"><strong>Statistics for Digital Humanities</strong><small>evidence · inference · modeling</small></a>
        <a className="dropdown-all" href="#teaching" onClick={()=>setOpen(false)}>All teaching →</a>
      </div></details>
      <a href="?materials" className="nav-materials"><Lock aria-hidden="true"/>Class Materials</a>
      <details className="nav-dropdown"><summary>Interactive Lessons <span aria-hidden="true">▾</span></summary><div className="dropdown-menu lesson-menu">
        <a href="dashboard/Lab-Tokenizer.dc.html"><strong>Tokenization playground</strong><small>dashboard · type your own text</small></a>
        <a href="dashboard/Lab-Keywords.dc.html"><strong>Keyword expansion demo</strong><small>dashboard · seed → domain lexicon</small></a>
        <a href="dashboard/Lab%20-%20SynthID.html"><strong>SynthID</strong><small>word choice · hypothesis testing</small></a>
        <a href="dashboard/Lab%20-%20Neural%20Network%20Explainer.html"><strong>Neural network explainer</strong><small>forward pass · backpropagation</small></a>
      </div></details>
      <details className="nav-dropdown"><summary>Recent Work <span aria-hidden="true">▾</span></summary><div className="dropdown-menu lesson-menu">
        <a href="https://perfume-soundsymbol.vercel.app/" target="_blank" rel="noreferrer"><strong>Fragrance sound symbolism</strong><small>perfume names · sound symbolism</small></a>
      </div></details>
      <a href="#cv" onClick={()=>setOpen(false)}>CV</a><a href="mailto:jakapun.t@chula.ac.th">Contact</a>
    </nav></div></header>
    <main>
      <section className="hero" id="top"><div><p className="eyebrow">Lecturer · Department of Linguistics · Chulalongkorn University</p><h1>Teaching computers to understand what we say.</h1><p className="lead">I’m Jakapun Tachaiya, a natural language processing researcher working on Large Language Models and Thai language technology.</p><p className="note">My work spans language understanding, social trend and behaviour analysis, and practical systems that help people work with text at scale.</p><div className="buttons"><a className="button primary" href="mailto:jakapun.t@chula.ac.th">Email</a><a className="button" href="https://orcid.org/0000-0001-9779-1571" target="_blank" rel="noreferrer">ORCID <ArrowUpRight/></a><a className="button" href="https://github.com/JakapunTachaiya" target="_blank" rel="noreferrer">GitHub <ArrowUpRight/></a><a className="button" href="Jakapun CV.pdf" download>CV <Download/></a></div></div><figure><img src="IMG_5438.jpg" alt="Jakapun Tachaiya"/><figcaption>Bangkok, Thailand<br/>jakapun.t@chula.ac.th</figcaption></figure></section>
      <section className="split" id="about"><Label n="01">About</Label><div className="content prose"><p className="large">I am a faculty member in the Linguistics Department at the Faculty of Arts, Chulalongkorn University. I’m fascinated by how computers are taught to understand language—a difficult problem because even people misunderstand one another while using the same words.</p><p>This interest drives my research in Natural Language Processing: technology that helps computers answer questions, translate, and analyse text at scale. My current work focuses on NLP with Large Language Models, particularly for Thai. Please get in touch if you are interested in collaborating.</p></div></section>
      <section className="split" id="research"><Label n="02">Research</Label><div className="content"><div className="topic-grid">{research.map(([t,p])=><article key={t}><h3>{t}</h3><p>{p}</p></article>)}</div></div></section>
      <section className="split" id="lab"><Label n="03">Research Lab</Label><div className="content"><h3 className="display">NLP Research Lab <em>@Chula</em></h3><p className="large">The lab advances Thai NLP infrastructure, including automated linguistic analysis and Large Language Models designed specifically for Thai.</p><div className="admissions"><div><b>Master’s programme</b><p>Prospective students are encouraged to consider the Linguistics programme’s “แผน วิชาชีพ” for flexible training from programming fundamentals to neural language models. See the <a href="https://www.arts.chula.ac.th/ling/index.html" target="_blank" rel="noreferrer">sample study plan</a>.</p></div><div><b>Ph.D. programme</b><p>A strong background in programming and machine learning is generally expected. Potential students are also welcome to discuss projects directly by email.</p></div></div><div className="people"><h3>Principal investigator</h3><p className="person-name">Jakapun Tachaiya</p></div><div className="people"><h3>Current members</h3>{current.map(([n,m])=><div className="person" key={n}><strong>{n}</strong><span>{m}</span></div>)}</div><details className="people alumni"><summary><h3>Alumni</h3><span>{alumni.length} students · {alumniByProject.filter(({p})=>p).length} projects</span></summary>{alumniByProject.map(({names,meta,p})=><div className="alum" key={p}><div><strong>{nameList(names)}</strong><span>{meta}</span></div>{p&&<p>{p}</p>}</div>)}</details></div></section>
      <section className="split" id="publications"><div><Label n="04">Publications</Label><a className="side-link" href="https://orcid.org/0000-0001-9779-1571" target="_blank" rel="noreferrer">ORCID<br/>0000-0001-9779-1571</a></div><div className="content pubs">{publications.map(([y,t,a,v,d])=><article className="pub" key={d}><span className="year">{y}</span><div><h3><a href={d} target="_blank" rel="noreferrer">{t} <ArrowUpRight/></a></h3><p className="authors">{a}</p><p>{v}</p><span className="status">Conference paper · Published</span></div></article>)}</div></section>
      <section className="split" id="teaching"><Label n="05">Teaching & Talks</Label><div className="content"><p className="large">Contributions to education and knowledge sharing through university teaching and professional workshops.</p><h3 className="list-heading">Teaching experience</h3><Timeline items={teachingByCourse} cols/><h3 className="list-heading spaced">Talks & workshops</h3><Timeline items={talks} cols/></div></section>
      <section className="split" id="cv"><div><Label n="06">Curriculum Vitae</Label><a className="side-link" href="Jakapun CV.pdf" download>Download PDF ↓</a></div><div className="content cv-cols"><div><h3 className="list-heading">Education</h3><Timeline items={education}/></div><div><h3 className="list-heading">Work history</h3><Timeline items={experience}/></div></div></section>
    </main>
    <footer id="contact"><div className="footer-inner"><div><p className="footer-kicker">Let’s work together</p><h2>Open to collaborations and student projects.</h2><a className="footer-email" href="mailto:jakapun.t@chula.ac.th">jakapun.t@chula.ac.th</a></div><div><p className="footer-kicker">Elsewhere</p><a href="https://orcid.org/0000-0001-9779-1571" target="_blank" rel="noreferrer">ORCID</a><a href="https://github.com/JakapunTachaiya" target="_blank" rel="noreferrer">GitHub</a></div><div><p className="footer-kicker">Office</p><p>Department of Linguistics<br/>Faculty of Arts<br/>Chulalongkorn University<br/>Bangkok, Thailand</p></div></div></footer>
  </div>;
}
