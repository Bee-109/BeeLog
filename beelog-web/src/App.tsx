import { useMemo, useState } from "react";
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, CalendarDays, Check,
  ChevronDown, ChevronLeft, ChevronRight, Code2, Command, Folder, FolderOpen,
  Image as ImageIcon, LayoutDashboard, MessageCircle, MoreHorizontal, Play,
  Plus, Search, Settings2, Tag, Video, X, Sun, Moon, Clock3, Flame, Pin,
  ExternalLink, Filter, Pencil, Trash2, FileText, CircleHelp
} from "lucide-react";
import "./index.css";

type Project = { name: string; color: string; count: number; icon: string };
type Devlog = {
  id: number; title: string; project: string; date: string; description: string;
  image: string; images: number; comments: number; videos?: number; time: string;
};

const projects: Project[] = [
  { name: "Blender", color: "#f5a34d", count: 42, icon: "◉" },
  { name: "Roblox Studio", color: "#4da9ff", count: 31, icon: "◆" },
  { name: "Unreal Engine", color: "#dededb", count: 18, icon: "U" },
  { name: "Art & Design", color: "#e8b85a", count: 24, icon: "✎" },
  { name: "Miscellaneous", color: "#e7b04c", count: 13, icon: "▰" },
];

const initialDevlogs: Devlog[] = [
  { id: 1, title: "Low Poly Tree Variations", project: "Blender", date: "Oct 19, 2026", description: "Created multiple low poly tree variations for the forest environment. Tested different shapes and textures.", image: "/ex-image-1", images: 6, comments: 1, time: "2 hours ago" },
  { id: 2, title: "Forest Ruins – Lighting Test", project: "Unreal Engine", date: "Oct 18, 2026", description: "Experimented with volumetric fog and directional lighting. Adjusted exposure and added foliage.", image: "/ex-image-2", images: 8, comments: 2, time: "1 day ago" },
  { id: 3, title: "Drill Farm – UI Progress", project: "Roblox Studio", date: "Oct 17, 2026", description: "Working on upgrade UI and currency system. Tested different layouts.", image: "/ex-image-3", images: 4, comments: 0, videos: 1, time: "2 days ago" },
  { id: 4, title: "Cat Companion Concept", project: "Art & Design", date: "Oct 16, 2026", description: "Concept sketches and colour palette for the bee-themed cat companion. Planning for 3D model next.", image: "/ex-image-4", images: 5, comments: 3, time: "3 days ago" },
];
const mediaImages = ["/ex-image-2", "/ex-image-5", "/ex-image-4", "/ex-image-1", "/ex-image-3", "/ex-image-2", "/ex-image-1"];

function App() {
  const [activeNav, setActiveNav] = useState("Home");
  const [activeProject, setActiveProject] = useState("All");
  const [activeMedia, setActiveMedia] = useState("Images");
  const [search, setSearch] = useState("");
  const [dark, setDark] = useState(true);
  const [month, setMonth] = useState(new Date(2026, 9, 1));
  const [logs, setLogs] = useState(initialDevlogs);
  const [showCreate, setShowCreate] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newProject, setNewProject] = useState("Blender");
  const [newDescription, setNewDescription] = useState("");
  const [toast, setToast] = useState("");

  const filteredLogs = useMemo(() => logs.filter(log => {
    const projectMatch = activeProject === "All" || log.project === activeProject;
    const q = search.toLowerCase();
    return projectMatch && (!q || `${log.title} ${log.description} ${log.project}`.toLowerCase().includes(q));
  }), [logs, activeProject, search]);

  const calendarMonths = useMemo(() => {
    // Show four consecutive months, ending with the selected month.
    return Array.from({ length: 4 }, (_, offset) => {
      const date = new Date(month.getFullYear(), month.getMonth() - 3 + offset, 1);
      const year = date.getFullYear();
      const monthIndex = date.getMonth();
      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
      // Convert Sunday-first JS weekdays to Monday-first calendar rows.
      const firstWeekday = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
      const weekCount = Math.ceil((firstWeekday + daysInMonth) / 7);
      const weeks = Array.from({ length: weekCount }, (_, week) =>
        Array.from({ length: 7 }, (_, weekday) => {
          const day = week * 7 + weekday - firstWeekday + 1;
          if (day < 1 || day > daysInMonth) return null;
          const seed = (day * 13 + monthIndex * 7 + year) % 11;
          const level = seed < 4 ? 0 : seed < 6 ? 1 : seed < 8 ? 2 : seed < 10 ? 3 : 4;
          return { day, level, month: monthIndex, year };
        })
      );
      return {
        key: `${year}-${monthIndex}`,
        label: date.toLocaleDateString("en-US", { month: "short" }),
        fullLabel: date.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        weeks,
      };
    });
  }, [month]);
  const monthLabel = month.toLocaleDateString("en-US", { month: "short", year: "numeric" });

  function createLog(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const now = new Date();
    const item: Devlog = {
      id: Date.now(), title: newTitle.trim(), project: newProject,
      date: now.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      description: newDescription.trim() || "A new development log. Add more details when you're ready.",
      image: projects.find(p => p.name === newProject)?.name === "Blender" ? "/ex-image-1" : newProject === "Roblox Studio" ? "/ex-image-3" : newProject === "Unreal Engine" ? "/ex-image-2" : "/ex-image-4",
      images: 0, comments: 0, time: "Just now"
    };
    setLogs(old => [item, ...old]);
    setNewTitle(""); setNewDescription(""); setShowCreate(false);
    setActiveProject("All"); setActiveNav("Home");
    setToast("Devlog added to this dashboard");
    window.setTimeout(() => setToast(""), 2600);
  }

  return (
    <div className={`app-shell ${dark ? "theme-dark" : "theme-light"}`}>
      <aside className="sidebar">
        <button className="brand" onClick={() => setActiveNav("Home")} aria-label="BeeLog home">
          <span className="brand-bee">✿</span><span className="brand-copy"><strong>BeeLog</strong><small>DEVELOPMENT ARCHIVE</small></span>
        </button>
        <nav className="primary-nav">
          {[
            [HomeIcon, "Home"], [FileText, "Timeline"], [Folder, "Projects"],
            [ImageIcon, "Media"], [Search, "Search"], [Activity, "Activity"], [Tag, "Tags"]
          ].map(([Icon, label]) => {
            const I = Icon as typeof Home;
            const name = label as string;
            return <button key={name} className={`nav-item ${activeNav === name ? "selected" : ""}`} onClick={() => { setActiveNav(name); if (name === "Search") document.getElementById("global-search")?.focus(); }}>
              <I size={18} strokeWidth={1.8} /><span>{name}</span>
            </button>;
          })}
        </nav>
        <div className="sidebar-divider" />
        <div className="side-section-head"><span>PROJECTS</span><button className="tiny-icon" onClick={() => setShowCreate(true)} aria-label="Create devlog"><Plus size={16}/></button></div>
        <div className="project-list">
          {projects.map(p => <button key={p.name} className={`project-link ${activeProject === p.name ? "project-active" : ""}`} onClick={() => { setActiveProject(p.name); setActiveNav("Projects"); }}>
            <span className="project-mark" style={{ color: p.color }}>{p.icon}</span><span>{p.name}</span>
          </button>)}
        </div>
        <div className="sidebar-art" style={{ backgroundImage: "linear-gradient(0deg,rgba(11,11,10,.94),rgba(11,11,10,.1)),url('/ex-image-5')" }}>
          <span className="sidebar-art-icon">☻</span><p>Building ideas,<br/>one step at a time.</p>
        </div>
        <button className="side-profile" onClick={() => setToast("Profile settings coming soon")}>
          <span className="profile-avatar">B</span><span className="profile-text"><strong>Bee</strong><small>Creator workspace</small></span><ChevronDown size={15}/>
        </button>
      </aside>

      <header className="topbar">
        <div className="topbar-crumb"><span>BeeLog</span><span className="crumb-slash">/</span><strong>{activeNav}</strong></div>
        <label className="global-search"><Search size={16}/><input id="global-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search devlogs, projects, tags..."/><kbd>Ctrl K</kbd><button aria-label="Clear search" onClick={() => setSearch("")} className="clear-search">{search && <X size={13}/>}</button></label>
        <div className="topbar-right"><button className="top-icon" onClick={() => setDark(v => !v)} aria-label="Toggle theme">{dark ? <Sun size={20}/> : <Moon size={20}/>}</button><button className="avatar-button" onClick={() => setToast("You're viewing Bee's workspace")}><span>B</span><ChevronDown size={14}/></button></div>
      </header>

      <main className="main-content">
        <div className="dashboard-grid">
          <div className="center-column">
            <section className="hero" style={{ backgroundImage: "linear-gradient(90deg,rgba(10,10,9,.94) 0%,rgba(10,10,9,.70) 42%,rgba(10,10,9,.05) 100%),url('/ex-image-5')" }}>
              <div className="hero-copy"><span className="eyebrow"><span className="live-dot"/> A PERSONAL DEVELOPMENT ARCHIVE</span>
                <h1>A personal archive of my<br/><em>development journey.</em></h1>
                <p>Games, 3D art, environments, experiments,<br className="desktop-break"/> ideas and everything in between.</p>
                <div className="hero-actions"><button className="gold-button" onClick={() => { setActiveNav("Timeline"); setActiveProject("All"); }}>Explore Devlogs <ArrowRight size={15}/></button><button className="dark-button" onClick={() => setActiveNav("Projects")}>View Projects</button></div>
              </div><span className="hero-index">BEELOG / 001</span>
            </section>

            <section className="stats-row">
              {[
                {icon:FileText,value:String(logs.length + 124),label:"Total Devlogs"},
                {icon:Folder,value:"5",label:"Projects"},
                {icon:ImageIcon,value:"642",label:"Images"},
                {icon:Play,value:"37",label:"Videos"},
                {icon:CalendarDays,value:"74",label:"Active Days"}
              ].map((s,i) => <article className="stat-card" key={s.label}><span className="stat-icon"><s.icon size={20}/></span><div><strong>{s.value}</strong><small>{s.label}</small></div></article>)}
            </section>

            <section className="section-block devlogs-section">
              <div className="section-title-row"><div><h2>Recent Devlogs</h2><p className="section-subtitle">A little progress, captured.</p></div><button className="text-link" onClick={() => { setShowAll(v => !v); setActiveProject("All"); }}>{showAll ? "Show less" : "View all"} <ArrowRight size={14}/></button></div>
              <div className="filter-row">
                {["All", ...projects.map(p => p.name)].map(name => <button key={name} className={`filter-chip ${activeProject === name ? "chip-active" : ""}`} onClick={() => {setActiveProject(name); setShowAll(name !== "All");}}>{name}</button>)}
                <button className="filter-more" onClick={() => setToast("More filters coming soon")}><Filter size={14}/> Filters</button>
              </div>
              {filteredLogs.length ? <div className="devlog-grid">{(showAll ? filteredLogs : filteredLogs.slice(0,4)).map(log => <article className="devlog-card" key={log.id}>
                <div className="devlog-image"><img src={log.image} alt="" onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = "0"; }}/><span className={`project-pill pill-${projects.findIndex(p => p.name === log.project)}`}>{log.project}</span><button className="card-more" aria-label="More options" onClick={() => setToast(`Options for ${log.title}`)}><MoreHorizontal size={17}/></button></div>
                <div className="devlog-body"><h3>{log.title}</h3><time>{log.date}</time><p>{log.description}</p><div className="card-meta"><span><ImageIcon size={14}/> {log.images} images</span>{log.videos ? <span><Video size={14}/> {log.videos} video</span> : <span><MessageCircle size={14}/> {log.comments} {log.comments === 1 ? "comment" : "comments"}</span>}</div></div>
              </article>)}</div> : <div className="no-results"><Search size={22}/><strong>No devlogs found</strong><span>Try another project or search term.</span><button onClick={() => {setSearch("");setActiveProject("All");}}>Clear filters</button></div>}
            </section>

            <div className="lower-grid">
              <section className="section-block projects-section"><div className="section-title-row"><div><h2>Projects</h2><p className="section-subtitle">The worlds you're building.</p></div><button className="text-link" onClick={() => setActiveNav("Projects")}>View all <ArrowRight size={14}/></button></div>
                <div className="project-cards">{projects.map((p,i) => <button className="project-card" key={p.name} onClick={() => {setActiveProject(p.name);setActiveNav("Projects");}}>
                  <div className="project-cover"><img src={["/ex-image-2","/ex-image-5","/ex-image-1","/ex-image-4","/ex-image-3"][i]} alt="" onError={e => {(e.currentTarget as HTMLImageElement).style.opacity="0"}}/><span className="project-cover-mark" style={{color:p.color}}>{p.icon}</span></div><div className="project-card-copy"><strong>{p.name}</strong><p>{["3D modelling, environments, assets and renders.","Game development, systems and builds.","Level design, lighting, environments and gameplay.","UI concepts, textures, illustrations and graphics.","Random ideas, tools, learning and everything else."][i]}</p><small><FileText size={12}/> {p.count} devlogs</small></div>
                </button>)}</div>
              </section>

              <section className="section-block media-section"><div className="section-title-row media-title"><div><h2>Latest Media</h2><p className="section-subtitle">Snapshots from the process.</p></div><button className="text-link" onClick={() => setActiveNav("Media")}>View all <ArrowRight size={14}/></button></div>
                <div className="media-tabs">{["All","Images","Videos"].map(tab => <button key={tab} className={activeMedia===tab?"media-tab-active":""} onClick={() => setActiveMedia(tab)}>{tab}</button>)}</div>
                <div className="media-mosaic">{mediaImages.slice(0, activeMedia === "Videos" ? 3 : 6).map((src,i) => <button key={`${src}-${i}`} className={`media-thumb media-thumb-${i}`} onClick={() => setToast("Media preview will open here")}><img src={src} alt={`Development media ${i+1}`} onError={e => {(e.currentTarget as HTMLImageElement).style.opacity="0"}}/>{activeMedia==="Videos" && i===0 && <span className="play-overlay"><Play size={18} fill="currentColor"/></span>}</button>)}<button className="media-more" onClick={() => setActiveNav("Media")}>+8</button></div>
                <div className="calendar-head">
                  <div><h3>Activity Calendar</h3><span className="section-subtitle">Your consistency over time.</span></div>
                  <div className="month-control">
                    <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Previous month"><ChevronLeft size={16}/></button>
                    <strong>{new Date(month.getFullYear(), month.getMonth() - 3, 1).toLocaleDateString("en-US", { month: "short" })} – {monthLabel}</strong>
                    <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Next month"><ChevronRight size={16}/></button>
                  </div>
                </div>
                <div className="heatmap-legend"><span>Less</span>{[0,1,2,3,4].map(n=><i key={n} className={`heat heat-${n}`}/>)}<span>More</span></div>
                <div className="heatmap">
                  <div className="weekday-labels"><span>Mon</span><span>Wed</span><span>Fri</span></div>
                  <div className="heatmap-months">
                    {calendarMonths.map(monthGroup => (
                      <section className="heatmap-month" key={monthGroup.key} aria-label={monthGroup.fullLabel}>
                        <h4>{monthGroup.label}</h4>
                        <div className="heatmap-month-grid">
                          {monthGroup.weeks.map((week, weekIndex) => (
                            <div className="heatmap-week" key={weekIndex}>
                              {week.map((cell, dayIndex) => cell ? (
                                <button
                                  key={dayIndex}
                                  title={`${monthGroup.fullLabel} ${cell.day}: ${cell.level ? cell.level * 2 : 0} contributions`}
                                  aria-label={`${monthGroup.fullLabel} ${cell.day}: ${cell.level ? cell.level * 2 : 0} contributions`}
                                  className={`heat heat-${cell.level}`}
                                  onClick={() => setToast(`${monthGroup.fullLabel} ${cell.day}: activity details coming soon`)}
                                />
                              ) : <span className="heat-empty" key={dayIndex} />)}
                            </div>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </div>

          <aside className="right-column">
            <section className="quote-card" style={{backgroundImage:"linear-gradient(90deg,rgba(19,17,13,.88),rgba(19,17,13,.30)),url('/ex-image-2')"}}><span className="quote-mark">“</span><blockquote>Ideas today,<br/>worlds tomorrow.</blockquote><span className="quote-credit">— Bee</span><span className="quote-doodle">✿</span></section>
            <section className="right-panel"><div className="panel-heading"><h3>Pinned Projects</h3><button onClick={() => setActiveNav("Projects")} aria-label="View projects"><ArrowRight size={15}/></button></div>
              {projects.slice(0,3).map((p,i)=><button className="pinned-project" key={p.name} onClick={() => {setActiveProject(p.name);setActiveNav("Projects");}}><span className={`pinned-logo pinned-${i}`} style={{color:p.color}}>{p.icon}</span><span className="pinned-info"><strong>{p.name}</strong><span className="pinned-progress"><i style={{width:`${[72,55,35][i]}%`,background:p.color}}/></span><small>{p.count} devlogs</small></span><ChevronRight size={15}/></button>)}
            </section>
            <section className="right-panel activity-panel"><div className="panel-heading"><h3>Recent Activity</h3><button onClick={() => setActiveNav("Activity")} aria-label="View activity"><ArrowRight size={15}/></button></div>
              {[...logs].slice(0,5).map((log,i)=><button className="activity-item" key={log.id} onClick={() => setToast(`Opened ${log.title}`)}><span className={`activity-icon activity-${i%4}`}>{i===0?<Code2 size={17}/>:i===1?<Activity size={17}/>:i===2?<MessageCircle size={17}/>:i===3?<Pencil size={17}/>:<FolderOpen size={17}/>}</span><span className="activity-copy"><small>{i===2?"You commented":"You added a devlog"}</small><strong>{log.title}</strong><time>{log.time}</time></span></button>)}
            </section>
            <section className="month-summary"><span className="summary-label">THIS MONTH</span><div className="summary-grid"><div><strong>18</strong><small>Devlogs</small></div><div><strong>96</strong><small>Images</small></div><div><strong>7</strong><small>Videos</small></div><div><strong>12</strong><small>Days active</small></div></div><div className="summary-note"><Flame size={14}/> You're building momentum.</div></section>
          </aside>
        </div>
        <footer className="page-footer"><span>✿ BeeLog</span><span>Ideas today, worlds tomorrow.</span><button onClick={() => setToast("Help centre coming soon")}><CircleHelp size={13}/> Help</button></footer>
      </main>

      {showCreate && <div className="modal-backdrop" onMouseDown={e => {if(e.target===e.currentTarget)setShowCreate(false)}}><form className="create-modal" onSubmit={createLog}><div className="modal-head"><div><span className="eyebrow">CAPTURE YOUR PROGRESS</span><h2>New devlog</h2></div><button type="button" className="tiny-icon" onClick={() => setShowCreate(false)} aria-label="Close"><X size={18}/></button></div><label>Title<input autoFocus value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="What did you work on?" required maxLength={100}/></label><label>Project<select value={newProject} onChange={e=>setNewProject(e.target.value)}>{projects.map(p=><option key={p.name}>{p.name}</option>)}</select></label><label>Description<textarea value={newDescription} onChange={e=>setNewDescription(e.target.value)} placeholder="What did you build, learn, or fix?" rows={4}/></label><div className="modal-actions"><button type="button" className="dark-button" onClick={()=>setShowCreate(false)}>Cancel</button><button className="gold-button" type="submit"><Plus size={15}/> Add devlog</button></div></form></div>}
      {toast && <div className="toast"><Check size={16}/>{toast}<button onClick={()=>setToast("")} aria-label="Dismiss"><X size={14}/></button></div>}
      <button className="floating-create" onClick={() => setShowCreate(true)} aria-label="Create devlog"><Plus size={22}/></button>
    </div>
  );
}

function HomeIcon(props: React.ComponentProps<typeof LayoutDashboard>) { return <LayoutDashboard {...props}/>; }

export default App;
