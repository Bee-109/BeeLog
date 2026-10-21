import { useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowRight, ArrowUpRight, CalendarDays, Check,
  ChevronLeft, ChevronRight, Code2, Folder, FolderOpen,
  Image as ImageIcon, MessageCircle, MoreHorizontal, Play,
  Plus, Search, Tag, Video, X, Flame,
  Filter, Pencil, Trash2, FileText, CircleHelp, House
} from "lucide-react";
import "./index.css";
import type { ActivityEntry, DevTag, Devlog, MediaRecord, Project, ProjectCategory } from "./domain/models";
import { mockPortfolioRepository, mockPortfolioSnapshot, type PortfolioRepository } from "./data/mockPortfolioRepository";
import { SupabasePortfolioRepository } from "./data/supabasePortfolioRepository";
import { isSupabaseConfigured, supabase } from "./auth/supabaseClient";
import { useAdminAuth } from "./auth/AuthProvider";
import { LoginModal } from "./auth/LoginModal";

function App() {
  const { status: authStatus, user, logout } = useAdminAuth();
  const isAdmin = authStatus === "admin";
  const repository = useMemo<PortfolioRepository>(() => isSupabaseConfigured && supabase
    ? new SupabasePortfolioRepository(supabase)
    : mockPortfolioRepository, []);
  const [showLogin, setShowLogin] = useState(false);
  const [dataLoadError, setDataLoadError] = useState("");
  const [activeNav, setActiveNav] = useState("Home");
  const [activeProject, setActiveProject] = useState("All");
  const [activeMedia, setActiveMedia] = useState("Images");
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState(new Date(2026, 9, 1));
  const [logs, setLogs] = useState<Devlog[]>(mockPortfolioSnapshot.devlogs);
  const [categories, setCategories] = useState<ProjectCategory[]>(mockPortfolioSnapshot.categories);
  const [projects, setProjects] = useState<Project[]>(mockPortfolioSnapshot.projects);
  const [media, setMedia] = useState<MediaRecord[]>(mockPortfolioSnapshot.media);

  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectCategory, setNewProjectCategory] = useState("2");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [newProjectStatus, setNewProjectStatus] = useState<"draft" | "published">("published");
  const [selectedProjectTagIds, setSelectedProjectTagIds] = useState<number[]>([]);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#e8b85a");
  const [newCategoryIcon, setNewCategoryIcon] = useState("◈");
  const [activity, setActivity] = useState<ActivityEntry[]>(mockPortfolioSnapshot.activity);
  const [tags, setTags] = useState<DevTag[]>(mockPortfolioSnapshot.tags);
  const [showCreate, setShowCreate] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newProjectId, setNewProjectId] = useState<number | null>(null);
  const [newLogStatus, setNewLogStatus] = useState<"draft" | "published">("published");
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [newDescription, setNewDescription] = useState("");
  const [toast, setToast] = useState("");
  const publicLogs = isAdmin ? logs : logs.filter((log) => log.status === "published");
  const publicCategories = categories;
  const publicProjects = isAdmin ? projects : projects.filter((project) => project.status === "published");
  const publicMedia = isAdmin ? media : media.filter((item) => item.status === "published");
  const mediaImages = publicMedia.filter((item) => item.type === "image").map((item) => item.src);

  useEffect(() => {
    let active = true;
    if (isSupabaseConfigured) {
      setLogs([]);
      setCategories([]);
      setProjects([]);
      setMedia([]);
      setTags([]);
      setActivity([]);
    }
    void repository.loadSnapshot({ isAdmin }).then((snapshot) => {
      if (!active) return;
      setLogs(snapshot.devlogs);
      setCategories(snapshot.categories);
      setProjects(snapshot.projects);
      setMedia(snapshot.media);
      setTags(snapshot.tags);
      setActivity(snapshot.activity);
      setDataLoadError("");
    }).catch((error: unknown) => {
      if (!active) return;
      setDataLoadError(error instanceof Error ? error.message : "BeeLog content could not be loaded.");
    });
    return () => { active = false; };
  }, [isAdmin, repository]);

  useEffect(() => {
    if (isAdmin || authStatus === "checking") return;
    setShowCreate(false);
    setShowCreateProject(false);
    setShowCreateCategory(false);
    if (activeNav === "Activity" || activeNav === "Tags") setActiveNav("Home");
  }, [isAdmin, authStatus, activeNav]);

  function recordActivity(action: ActivityEntry["action"], entity: ActivityEntry["entity"], title: string, project = "Workspace", details?: string) {
    if (isSupabaseConfigured) {
      void repository.loadSnapshot({ isAdmin: true }).then((snapshot) => setActivity(snapshot.activity)).catch((error: unknown) => setToast(error instanceof Error ? error.message : "Could not refresh activity history"));
      return;
    }
    setActivity((current) => [{ id: Date.now(), action, entity, title, project, details, timestamp: Date.now() }, ...current]);
  }

  async function createCategory(e: React.FormEvent) {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name || categories.some((category) => category.name.toLowerCase() === name.toLowerCase())) return;
    let item: ProjectCategory;
    try { item = await repository.createCategory({ name, color: newCategoryColor, icon: newCategoryIcon || "◈" }); }
    catch (error) { setToast(error instanceof Error ? error.message : "Could not create category"); return; }
    setCategories((current) => [...current, item]);
    recordActivity("created", "Category", name, "Categories", `Color ${item.color}`);
    setNewCategoryName("");
    setShowCreateCategory(false);
  }

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    const name = newProjectName.trim();
    if (!name) return;
    if (projects.some((project) => project.name.toLowerCase() === name.toLowerCase())) {
      setToast("A project with that name already exists");
      return;
    }
    const category = categories.find((item) => item.id === Number(newProjectCategory)) ?? categories[0];
    if (!category) { setToast("Create a project category first"); return; }
    let project: Project;
    try { project = await repository.createProject({
      name, categoryId: category.id,
      description: newProjectDescription.trim(), createdAt: Date.now(),
      coverImage: "/ex-image-5.jpg", status: newProjectStatus,
      tagIds: [...selectedProjectTagIds],
    }); } catch (error) { setToast(error instanceof Error ? error.message : "Could not create project"); return; }
    setProjects((current) => [...current, project]);
    setNewProjectName("");
    setNewProjectDescription("");
    setSelectedProjectTagIds([]);
    setNewProjectStatus("published");
    setShowCreateProject(false);
    setActiveProject(name);
    setActiveNav("Projects");
    recordActivity("created", "Project", name, category.name, `Project added to ${category.name}`);
  }

  const filteredLogs = useMemo(() => publicLogs.filter(log => {
    const projectMatch = activeProject === "All" || log.project === activeProject || categories.find((category) => category.name === activeProject)?.id === projects.find((project) => project.id === log.projectId)?.categoryId;
    const q = search.toLowerCase();
    return projectMatch && (!q || `${log.title} ${log.description} ${log.project}`.toLowerCase().includes(q));
  }), [publicLogs, activeProject, search]);

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
  

    
const timelineLogs = useMemo(() => {
  return [...filteredLogs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}, [filteredLogs]);
async function createLog(e: React.FormEvent) {
  e.preventDefault();
  if (!newTitle.trim()) return;

  const now = new Date();

  const selectedProject = projects.find((project) => project.id === newProjectId);

  const item: Omit<Devlog, "id"> = {
    title: newTitle.trim(),
    project: selectedProject?.name ?? "Unassigned",
    projectId: selectedProject?.id,
    date: now.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
    description:
      newDescription.trim() ||
      "A new development log. Add more details when you're ready.",
    image: "/ex-image-1.jpg",
    images: 0,
    comments: 0,
    time: "Just now",
    tagIds: [...selectedTagIds],
    status: newLogStatus,
  };

  let created: Devlog;
  try { created = await repository.createDevlog(item); }
  catch (error) { setToast(error instanceof Error ? error.message : "Could not create devlog"); return; }
  setLogs((old) => [created, ...old]);

  recordActivity("created", "Devlog", created.title, created.project, selectedTagIds.length ? `Tags: ${tags.filter((tag) => selectedTagIds.includes(tag.id)).map((tag) => tag.name).join(", ")}` : undefined);

  setNewTitle("");
  setNewDescription("");
  setSelectedTagIds([]);
  setNewLogStatus("published");
  setNewProjectId(null);
  setShowCreate(false);
  setActiveProject("All");
  setActiveNav("Home");

  setToast("Devlog added to this dashboard");
  window.setTimeout(() => setToast(""), 2600);
}

async function updateLog(log: Devlog, changes: Partial<Omit<Devlog, "id">>) {
  try {
    const updated = await repository.updateDevlog(log.id, changes);
    setLogs((current) => current.map((item) => item.id === log.id ? updated : item));
    recordActivity("edited", "Devlog", updated.title, updated.project, `Updated ${Object.keys(changes).join(", ")}`);
  } catch (error) { setToast(error instanceof Error ? error.message : "Could not update devlog"); }
}

async function deleteLog(log: Devlog) {
  if (!window.confirm(`Delete devlog “${log.title}”?`)) return;
  try {
    await repository.deleteDevlog(log.id);
    setLogs((current) => current.filter((item) => item.id !== log.id));
    recordActivity("deleted", "Devlog", log.title, log.project);
  } catch (error) { setToast(error instanceof Error ? error.message : "Could not delete devlog"); }
}

  return (
    <div className="app-shell theme-dark">
      <aside className="sidebar">
        <button className="brand" onClick={() => setActiveNav("Home")} aria-label="BeeLog home">
          <span className="brand-bee">✿</span><span className="brand-copy"><strong>BeeLog</strong><small>DEVELOPMENT ARCHIVE</small></span>
        </button>
        <nav className="primary-nav">
          {[ 
            [House,"Home"], [FileText, "Timeline"], [Folder, "Projects"],
            [ImageIcon, "Media"], ...(isAdmin ? [[Activity, "Activity"], [Tag, "Tags"]] : [])
          ].map(([Icon, label]) => {
            const I = Icon as typeof House;
            const name = label as string;
            return <button key={name} className={`nav-item ${activeNav === name ? "selected" : ""}`} onClick={() => { setActiveNav(name); if (name === "Search") document.getElementById("global-search")?.focus(); }}>
              <I size={18} strokeWidth={1.8} /><span>{name}</span>
            </button>;
          })}
        </nav>
        <div className="sidebar-divider" />
        <div className="side-section-head"><span>CATEGORIES</span>{isAdmin && <button className="tiny-icon" onClick={() => setShowCreateCategory(true)} aria-label="Create category"><Plus size={16}/></button>}</div>
        <div className="project-list">
          {categories.map(p => <button key={p.name} className={`project-link ${activeProject === p.name ? "project-active" : ""}`} onClick={() => { setActiveProject(p.name); setActiveNav("Projects"); }}>
            <span className="project-mark" style={{ color: p.color }}>{p.name.trim().charAt(0).toUpperCase()}</span><span>{p.name}</span>
          </button>)}
        </div>
        <div className="sidebar-art" style={{ backgroundImage: "linear-gradient(0deg,rgba(11,11,10,.94),rgba(11,11,10,.1)),url('/ex-image-5.jpg')" }}>
          <span className="sidebar-art-icon">☻</span><p>Building ideas,<br/>one step at a time.</p>
        </div>
        <div className="auth-bottom-status"><span className="auth-mode-label">{isAdmin ? `ADMIN · ${user?.email ?? "Authorized"}` : authStatus === "unconfigured" ? "DEMO · READ ONLY" : authStatus === "non-admin" ? "PUBLIC ACCESS" : "PUBLIC PORTFOLIO"}</span></div>
      </aside>

      <header className="topbar">
        <div className="topbar-crumb"><span>BeeLog</span><span className="crumb-slash">/</span><strong>{activeNav}</strong></div>
        <label className="global-search"><Search size={16}/><input id="global-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search devlogs, projects, tags..."/><kbd>Ctrl K</kbd><button aria-label="Clear search" onClick={() => setSearch("")} className="clear-search">{search && <X size={13}/>}</button></label>
        <div className="topbar-right">{isAdmin ? <button className="login-button" onClick={() => void logout()}>Log out</button> : <><button className="login-button" onClick={() => setShowLogin(true)}>Log In</button>{authStatus === "non-admin" && <button className="auth-signout-link" onClick={() => void logout()}>Sign out</button>}</>}</div>
      </header>

      <main className="main-content">
  {dataLoadError && <div className="toast" role="alert">{dataLoadError}<button onClick={() => setDataLoadError("")} aria-label="Dismiss"><X size={14}/></button></div>}
  {activeNav === "Timeline" ? (
    <TimelinePage
      logs={timelineLogs}
      projects={categories}
      isAdmin={isAdmin}
      activeProject={activeProject}
      setActiveProject={setActiveProject}
      search={search}
      setSearch={setSearch}
      onCreate={() => { if (isAdmin) setShowCreate(true); }}
      onEdit={(log) => { const title = window.prompt("Devlog title", log.title); if (!title?.trim()) return; const description = window.prompt("Devlog description", log.description); if (description === null) return; const shouldPublish = window.confirm(log.status === "published" ? "Keep this devlog published? Choose Cancel to save it as a draft." : "Publish this devlog now?"); void updateLog(log, { title: title.trim(), description, status: shouldPublish ? "published" : "draft" }); }}
      onDelete={(log) => void deleteLog(log)}
      tags={tags}
    />
    ) : activeNav === "Tags" && isAdmin ? (
      <TagsPage tags={tags} setTags={setTags} logs={logs} projects={projects} repository={repository} onActivity={recordActivity} />
    ) : activeNav === "Activity" && isAdmin ? (
      <ActivityPage activity={activity} onCreate={() => setShowCreate(true)} />
    ) : activeNav === "Media" ? (

  <MediaPage media={publicMedia} projects={publicProjects} isAdmin={isAdmin}
    onUpload={async (file, projectId, status = "draft") => { try { const item = await repository.createMedia(file, { name: file.name, projectId, status }); setMedia((current) => [item, ...current]); recordActivity("created", "Media", item.name, "Media", `Uploaded as ${status}`); } catch (error) { setToast(error instanceof Error ? error.message : "Could not upload media"); } }}
    onUpdate={async (id, changes) => { try { const item = await repository.updateMedia(id, changes); setMedia((current) => current.map((row) => row.id === id ? item : row)); recordActivity("edited", "Media", item.name, "Media", `Updated ${Object.keys(changes).join(", ")}`); } catch (error) { setToast(error instanceof Error ? error.message : "Could not update media"); } }}
    onDelete={async (item) => { if (!window.confirm(`Delete media “${item.name}”?`)) return; try { await repository.deleteMedia(item.id); setMedia((current) => current.filter((row) => row.id !== item.id)); recordActivity("deleted", "Media", item.name, "Media"); } catch (error) { setToast(error instanceof Error ? error.message : "Could not delete media"); } }} />
    ) : activeNav === "Projects" ? (
  <ProjectsPage
    projects={publicProjects}
    categories={publicCategories}
    repository={repository}
    setCategories={setCategories}
    setLogs={setLogs}
    tags={tags}
    logs={publicLogs}
    isAdmin={isAdmin}
    activeProject={activeProject}
    setActiveProject={setActiveProject}
    setActiveNav={setActiveNav}
    search={search}
    setSearch={setSearch}
    onCreateLog={() => { if (!isAdmin) return; const selected = projects.find((project) => project.name === activeProject); setNewProjectId(selected?.id ?? null); setShowCreate(true); }}
    onCreateProject={() => { if (isAdmin) setShowCreateProject(true); }}
    onRecordActivity={recordActivity}
    setProjects={setProjects}
  />

  ) : (
    <div className="dashboard-grid">
          <div className="center-column">
            <section className="hero" style={{ backgroundImage: "linear-gradient(90deg,rgba(10,10,9,.94) 0%,rgba(10,10,9,.70) 42%,rgba(10,10,9,.05) 100%),url('/ex-image-5.jpg')" }}>
              <div className="hero-copy"><span className="eyebrow"><span className="live-dot"/> A PERSONAL DEVELOPMENT ARCHIVE</span>
                <h1>A personal archive of my<br/><em>development journey.</em></h1>
                <p>Games, 3D art, environments, experiments,<br className="desktop-break"/> ideas and everything in between.</p>
                <div className="hero-actions"><button className="gold-button" onClick={() => { setActiveNav("Timeline"); setActiveProject("All"); }}>Explore Devlogs <ArrowRight size={15}/></button><button className="dark-button" onClick={() => setActiveNav("Projects")}>View Projects</button></div>
              </div><span className="hero-index">BEELOG / 001</span>
            </section>

            <section className="stats-row">
              {[
                {icon:FileText,value:String(publicLogs.length + 124),label:"Total Devlogs"},
                {icon:Folder,value:String(projects.length),label:"Projects"},
                {icon:ImageIcon,value:"642",label:"Images"},
                {icon:Play,value:"37",label:"Videos"},
                {icon:CalendarDays,value:"74",label:"Active Days"}
              ].map((s) => <article className="stat-card" key={s.label}><span className="stat-icon"><s.icon size={20}/></span><div><strong>{s.value}</strong><small>{s.label}</small></div></article>)}
            </section>

            <section className="section-block devlogs-section">
              <div className="section-title-row"><div><h2>Recent Devlogs</h2><p className="section-subtitle">A little progress, captured.</p></div><button className="text-link" onClick={() => { setShowAll(v => !v); setActiveProject("All"); }}>{showAll ? "Show less" : "View all"} <ArrowRight size={14}/></button></div>
              <div className="filter-row">
                {["All", ...categories.map(p => p.name)].map(name => <button key={name} className={`filter-chip ${activeProject === name ? "chip-active" : ""}`} onClick={() => {setActiveProject(name); setShowAll(name !== "All");}}>{name}</button>)}
                <button className="filter-more" onClick={() => setToast("More filters coming soon")}><Filter size={14}/> Filters</button>
              </div>
              {filteredLogs.length ? <div className="devlog-grid">{(showAll ? filteredLogs : filteredLogs.slice(0,4)).map(log => <article className="devlog-card" key={log.id}>
                <div className="devlog-image"><img src={log.image} alt="" onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = "0"; }}/><span className={`project-pill pill-${projects.findIndex(p => p.name === log.project)}`}>{log.project}</span>{isAdmin && <button className="card-more" aria-label="More options" onClick={() => setToast(`Options for ${log.title}`)}><MoreHorizontal size={17}/></button>}</div>
                <div className="devlog-body"><h3>{log.title}</h3><time>{log.date}</time><p>{log.description}</p><div className="card-meta"><span><ImageIcon size={14}/> {log.images} images</span>{log.videos ? <span><Video size={14}/> {log.videos} video</span> : <span><MessageCircle size={14}/> {log.comments} {log.comments === 1 ? "comment" : "comments"}</span>}</div></div>
              </article>)}</div> : <div className="no-results"><Search size={22}/><strong>No devlogs found</strong><span>Try another project or search term.</span><button onClick={() => {setSearch("");setActiveProject("All");}}>Clear filters</button></div>}
            </section>

            <div className="lower-grid">
              <section className="section-block projects-section"><div className="section-title-row"><div><h2>Projects</h2><p className="section-subtitle">The worlds you're building.</p></div><button className="text-link" onClick={() => setActiveNav("Projects")}>View all <ArrowRight size={14}/></button></div>
                <div className="project-cards">{publicProjects.map((p,i) => { const category = categories.find((c) => c.id === p.categoryId); return <button className="project-card" key={p.name} onClick={() => {setActiveProject(p.name);setActiveNav("Projects");}}>
                  <div className="project-cover"><img src={["/ex-image-2.jpg","/ex-image-5.jpg","/ex-image-1.jpg","/ex-image-4.jpg","/ex-image-3.jpg"][i % 5]} alt="" onError={e => {(e.currentTarget as HTMLImageElement).style.opacity="0"}}/><span className="project-cover-mark" style={{color:category?.color}}>{category?.name.trim().charAt(0).toUpperCase()}</span></div><div className="project-card-copy"><strong>{p.name}</strong><p>{p.description || category?.name}</p><small><FileText size={12}/> {logs.filter(log => log.projectId === p.id).length} devlogs</small></div>
                </button>;})}</div>
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
            <section className="quote-card" style={{backgroundImage:"linear-gradient(90deg,rgba(19,17,13,.88),rgba(19,17,13,.30)),url('/ex-image-2.jpg')"}}><span className="quote-mark">“</span><blockquote>Ideas today,<br/>worlds tomorrow.</blockquote><span className="quote-credit">— Bee</span><span className="quote-doodle">✿</span></section>
            <section className="right-panel"><div className="panel-heading"><h3>Pinned Projects</h3><button onClick={() => setActiveNav("Projects")} aria-label="View projects"><ArrowRight size={15}/></button></div>
              {publicProjects.slice(0,3).map((p,i)=>{const category=categories.find((c)=>c.id===p.categoryId);return <button className="pinned-project" key={p.name} onClick={() => {setActiveProject(p.name);setActiveNav("Projects");}}><span className={`pinned-logo pinned-${i}`} style={{color:category?.color}}>{category?.name.trim().charAt(0).toUpperCase()}</span><span className="pinned-info"><strong>{p.name}</strong><span className="pinned-progress"><i style={{width:`${[72,55,35][i]}%`,background:category?.color}}/></span><small>{publicLogs.filter(log => log.projectId === p.id).length} devlogs</small></span><ChevronRight size={15}/></button>;})}
            </section>
            <section className="right-panel activity-panel"><div className="panel-heading"><h3>{isAdmin ? "Recent Activity" : "Recent Devlogs"}</h3><button onClick={() => setActiveNav(isAdmin ? "Activity" : "Timeline")} aria-label={isAdmin ? "View activity" : "View timeline"}><ArrowRight size={15}/></button></div>
              {[...publicLogs].slice(0,5).map((log,i)=><button className="activity-item" key={log.id} onClick={() => setToast(`Opened ${log.title}`)}><span className={`activity-icon activity-${i%4}`}>{i===0?<Code2 size={17}/>:i===1?<Activity size={17}/>:i===2?<MessageCircle size={17}/>:i===3?<Pencil size={17}/>:<FolderOpen size={17}/>}</span><span className="activity-copy"><small>{i===2?"You commented":"You added a devlog"}</small><strong>{log.title}</strong><time>{log.time}</time></span></button>)}
            </section>
            <section className="month-summary"><span className="summary-label">THIS MONTH</span><div className="summary-grid"><div><strong>18</strong><small>Devlogs</small></div><div><strong>96</strong><small>Images</small></div><div><strong>7</strong><small>Videos</small></div><div><strong>12</strong><small>Days active</small></div></div><div className="summary-note"><Flame size={14}/> You're building momentum.</div></section>
          </aside>
        </div>
  )}
        <footer className="page-footer"><span>✿ BeeLog</span><span>Ideas today, worlds tomorrow.</span><button onClick={() => setToast("Help centre coming soon")}><CircleHelp size={13}/> Help</button></footer>
      </main>

      {isAdmin && showCreate && 
      <div className="modal-backdrop" onMouseDown={e => {if(e.target===e.currentTarget)setShowCreate(false)}}>
        <form className="create-modal" onSubmit={createLog}><div className="modal-head">
          <div>
          <span className="eyebrow">CAPTURE YOUR PROGRESS</span><h2>New devlog</h2></div>
          <button type="button" className="tiny-icon" onClick={() => setShowCreate(false)} aria-label="Close">
            <X size={18}/>
            </button>
            </div><label>Title
              <input autoFocus value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="What did you work on?" required maxLength={100}/></label>
            <label>Project (optional)<select value={newProjectId ?? ""} onChange={e=>setNewProjectId(e.target.value ? Number(e.target.value) : null)}><option value="">No linked project</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
            <label>Visibility<select value={newLogStatus} onChange={(e) => setNewLogStatus(e.target.value as "draft" | "published")}><option value="draft">Draft (admins only)</option><option value="published">Published</option></select></label>
        <label>Description
          <textarea value={newDescription} onChange={e=>setNewDescription(e.target.value)} placeholder="What did you build, learn, or fix?" rows={4}/>
        </label>
              <div className="devlog-tag-selector">
        <div className="devlog-tag-heading">
          <span>Tags</span>
          <small>
            {selectedTagIds.length
              ? `${selectedTagIds.length} selected`
              : "Choose any that apply"}
          </small>
        </div>

        {tags.length ? (
          <div className="devlog-tag-options">
            {tags.map((tag) => {
              const selected = selectedTagIds.includes(tag.id);

              return (
                <button
                  type="button"
                  key={tag.id}
                  className={`devlog-tag-option ${selected ? "selected" : ""}`}
                  style={{ "--tag-color": tag.color } as React.CSSProperties}
                  aria-pressed={selected}
                  onClick={() => {
                    setSelectedTagIds((current) =>
                      selected
                        ? current.filter((id) => id !== tag.id)
                        : [...current, tag.id]
                    );
                  }}
                >
                  <span className="devlog-tag-dot" />
                  {tag.name}
                  {selected && <Check size={13} />}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="devlog-tag-empty">
            No tags yet. Create some in the Tags page first.
          </p>
        )}
      </div>
        <div className="modal-actions">
          <button type="button" className="dark-button" onClick={()=>setShowCreate(false)}>Cancel</button>
          <button className="gold-button" type="submit"><Plus size={15}/> Add devlog</button>
        </div>
      </form>
      </div>}
      {isAdmin && showCreateProject && (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowCreateProject(false); }}>
          <form className="create-modal" onSubmit={createProject}>
            <div className="modal-head"><div><span className="eyebrow">ORGANIZE YOUR WORK</span><h2>New project</h2></div>
              <button type="button" className="tiny-icon" onClick={() => setShowCreateProject(false)} aria-label="Close"><X size={18}/></button>
            </div>
            <label>Project name<input autoFocus value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} placeholder="e.g. Finished a simulator game" required maxLength={60}/></label>
            <label>Category<select value={categories.some((category) => String(category.id) === newProjectCategory) ? newProjectCategory : String(categories[0]?.id ?? "")} onChange={(e) => setNewProjectCategory(e.target.value)}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
            <label>Description<textarea value={newProjectDescription} onChange={(e) => setNewProjectDescription(e.target.value)} placeholder="A short description (optional)" rows={3}/></label>
            <label>Visibility<select value={newProjectStatus} onChange={(e) => setNewProjectStatus(e.target.value as "draft" | "published")}><option value="draft">Draft (admins only)</option><option value="published">Published</option></select></label>
            <TagPicker tags={tags} selected={selectedProjectTagIds} onChange={setSelectedProjectTagIds} label="Project tags" />
            <div className="modal-actions"><button type="button" className="dark-button" onClick={() => setShowCreateProject(false)}>Cancel</button><button className="gold-button" type="submit"><Plus size={15}/> Add project</button></div>
          </form>
        </div>
      )}
      {isAdmin && showCreateCategory && <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowCreateCategory(false); }}><form className="create-modal" onSubmit={createCategory}><div className="modal-head"><div><span className="eyebrow">ORGANIZE YOUR WORK</span><h2>New category</h2></div><button type="button" className="tiny-icon" onClick={() => setShowCreateCategory(false)} aria-label="Close"><X size={18}/></button></div><label>Category name<input autoFocus value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="e.g. Unreal Engine" required maxLength={60}/></label><label>Color<input type="color" value={newCategoryColor} onChange={(e) => setNewCategoryColor(e.target.value)}/></label><label>Icon<input value={newCategoryIcon} onChange={(e) => setNewCategoryIcon(e.target.value)} maxLength={3}/></label><div className="modal-actions"><button type="button" className="dark-button" onClick={() => setShowCreateCategory(false)}>Cancel</button><button className="gold-button" type="submit"><Plus size={15}/> Add category</button></div></form></div>}
      {
        toast && 
        <div className="toast">
          <Check size={16}/>{toast}
            <button onClick={()=>setToast("")} aria-label="Dismiss"><X size={14}/>
            </button>
          </div>}
      {isAdmin && <button className="floating-create" onClick={() => setShowCreate(true)} aria-label="Create devlog"><Plus size={22}/></button>}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}


function TagChips({ ids, tags }: { ids: number[]; tags: DevTag[] }) {
  const assigned = tags.filter((tag) => ids.includes(tag.id));
  if (!assigned.length) return null;
  return <div className="assigned-tags" aria-label="Tags">{assigned.map((tag) => <span key={tag.id} style={{ "--tag-color": tag.color } as React.CSSProperties}><i />{tag.name}</span>)}</div>;
}

function TagPicker({ tags, selected, onChange, label }: { tags: DevTag[]; selected: number[]; onChange: (ids: number[]) => void; label: string }) {
  return <div className="devlog-tag-selector"><div className="devlog-tag-heading"><span>{label}</span><small>{selected.length ? `${selected.length} selected` : "Optional"}</small></div>{tags.length ? <div className="devlog-tag-options">{tags.map((tag) => { const active = selected.includes(tag.id); return <button type="button" key={tag.id} className={`devlog-tag-option ${active ? "selected" : ""}`} style={{ "--tag-color": tag.color } as React.CSSProperties} aria-pressed={active} onClick={() => onChange(active ? selected.filter((id) => id !== tag.id) : [...selected, tag.id])}><span className="devlog-tag-dot"/>{tag.name}{active && <Check size={13}/>}</button>; })}</div> : <p className="devlog-tag-empty">Create tags first on the Tags page.</p>}</div>;
}

function TimelinePage({
  logs,
  projects,
  isAdmin,
  tags,
  activeProject,
  setActiveProject,
  search,
  setSearch,
  onCreate,
  onEdit,
  onDelete,
}: {
  logs: Devlog[];
  projects: ProjectCategory[];
  isAdmin: boolean;
  tags: DevTag[];
  activeProject: string;
  setActiveProject: (project: string) => void;
  search: string;
  setSearch: (value: string) => void;
  onCreate: () => void;
  onEdit: (log: Devlog) => void;
  onDelete: (log: Devlog) => void;
}) {
  const groupedLogs = useMemo(() => {
    const groups: { label: string; logs: Devlog[] }[] = [];

    for (const log of logs) {
      const label = new Date(log.date).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      let group = groups.find((item) => item.label === label);

      if (!group) {
        group = { label, logs: [] };
        groups.push(group);
      }

      group.logs.push(log);
    }

    return groups;
  }, [logs]);

  return (
    <section className="timeline-page">
      <div className="timeline-heading">
        <div>
          <span className="eyebrow">YOUR DEVELOPMENT HISTORY</span>
          <h1>Timeline<span>.</span></h1>
          <p>Every experiment, every fix, every little step forward.</p>
        </div>

        {isAdmin && <button className="gold-button" onClick={onCreate}><Plus size={16} /> New Devlog</button>}
      </div>

      <div className="timeline-stats">
        <article>
          <FileText size={18} />
          <div><strong>{logs.length}</strong><span>Devlogs</span></div>
        </article>
        <article>
          <Folder size={18} />
          <div>
            <strong>{new Set(logs.map((log) => log.project)).size}</strong>
            <span>Projects documented</span>
          </div>
        </article>
        <article>
          <CalendarDays size={18} />
          <div>
            <strong>{new Set(logs.map((log) => log.date)).size}</strong>
            <span>Days documented</span>
          </div>
        </article>
      </div>

      <div className="timeline-toolbar">
        <div className="timeline-filters">
          {["All", ...projects.map((project) => project.name)].map((name) => (
            <button
              key={name}
              className={`filter-chip ${
                activeProject === name ? "chip-active" : ""
              }`}
              onClick={() => setActiveProject(name)}
            >
              {name}
            </button>
          ))}
        </div>

        <label className="timeline-search">
          <Search size={16} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Find a devlog..."
          />
          {search && (
            <button onClick={() => setSearch("")} aria-label="Clear search">
              <X size={14} />
            </button>
          )}
        </label>
      </div>

      <div className="timeline-results">
        <span>
          Showing <strong>{logs.length}</strong>{" "}
          {logs.length === 1 ? "entry" : "entries"}
        </span>
        <span>Newest first</span>
      </div>

      {groupedLogs.length > 0 ? (
        <div className="timeline-feed">
          {groupedLogs.map((group) => (
            <section className="timeline-day" key={group.label}>
              <div className="timeline-date">
                <span className="timeline-date-dot" />
                <h2>{group.label}</h2>
                <span className="timeline-date-count">
                  {group.logs.length}{" "}
                  {group.logs.length === 1 ? "entry" : "entries"}
                </span>
              </div>

              <div className="timeline-day-entries">
                {group.logs.map((log) => {
                  const projectIndex = projects.findIndex(
                    (project) => project.name === log.project
                  );

                  return (
                    <article className="timeline-entry" key={log.id}>
                      <div className="timeline-entry-image">
                        <img
                          src={log.image}
                          alt=""
                          onError={(event) => {
                            event.currentTarget.style.opacity = "0";
                          }}
                        />
                      </div>

                      <div className="timeline-entry-content">
                        <div className="timeline-entry-top">
                          <span
                            className={`project-pill pill-${projectIndex}`}
                          >
                            {log.project}
                          </span>
                          <time>{log.time}</time>
                        </div>

                        <h3>{log.title}</h3>
                        {isAdmin && <div className="project-manage-actions"><button className="tiny-icon" onClick={() => onEdit(log)} aria-label={`Edit ${log.title}`}><Pencil size={14}/></button><button className="tiny-icon tag-delete-button" onClick={() => onDelete(log)} aria-label={`Delete ${log.title}`}><Trash2 size={14}/></button>{log.status === "draft" && <span className="draft-badge">Draft</span>}</div>}
                        <p>{log.description}</p>

                        <div className="timeline-entry-meta">
                          <span><ImageIcon size={14} /> {log.images} images</span>
                          {log.videos ? (
                            <span><Video size={14} /> {log.videos} videos</span>
                          ) : null}
                          <span>
                            <MessageCircle size={14} />
                            {log.comments} comments
                          </span>
                        </div>
                        <TagChips ids={log.tagIds ?? []} tags={tags} />
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="timeline-empty">
          <Search size={28} />
          <h2>No devlogs found</h2>
          <p>Try a different search or project filter.</p>
          <button
            className="dark-button"
            onClick={() => {
              setSearch("");
              setActiveProject("All");
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </section>
  );
}





function ProjectsPage({
  projects, categories, tags, logs, isAdmin, activeProject, setActiveProject, repository,
    setCategories, setLogs, setActiveNav, search, setSearch, onCreateLog, onCreateProject, onRecordActivity,
  setProjects,
}: {
  projects: Project[];
  categories: ProjectCategory[];
  repository: PortfolioRepository;
  setCategories: React.Dispatch<React.SetStateAction<ProjectCategory[]>>;
  setLogs: React.Dispatch<React.SetStateAction<Devlog[]>>;
  tags: DevTag[];
  logs: Devlog[];
  isAdmin: boolean;
  activeProject: string;
  setActiveProject: (project: string) => void;
  setActiveNav: (page: string) => void;
  search: string;
  setSearch: (value: string) => void;
  onCreateLog: () => void;
  onCreateProject: () => void;
  onRecordActivity: (action: ActivityEntry["action"], entity: ActivityEntry["entity"], title: string, project?: string, details?: string) => void;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}) {
  const descriptions: Record<string, string> = {
    Blender: "3D modelling, low-poly assets, materials, animation and renders.",
    "Roblox Studio": "Game mechanics, simulator systems, maps, UI and builds.",
    "Unreal Engine": "Environments, lighting, gameplay systems and experiments.",
    "Art & Design": "Visual concepts, textures, illustrations and creative exploration.",
    Miscellaneous: "Tools, experiments, learning notes and everything in between.",
  };

  const filteredProjects = projects.filter((project) => {
    const query = search.trim().toLowerCase();
    const category = categories.find((item) => item.id === project.categoryId);
    return (
      (activeProject === "All" || project.name === activeProject || category?.name === activeProject) &&
      (!query || project.name.toLowerCase().includes(query) ||
      (project.description || descriptions[category?.name ?? ""] || "").toLowerCase().includes(query))
    );
  });

  const selectedProject = projects.find((project) => project.name === activeProject);
  const selectedCategory = selectedProject && categories.find((category) => category.id === selectedProject.categoryId);

  const projectLogs = logs
    .filter((log) => selectedProject ? log.projectId === selectedProject.id : false)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <section className="projects-page">
      <div className="projects-page-heading">
        <div>
          <span className="eyebrow">YOUR CREATOR WORKSPACE</span>
          <h1>{selectedProject ? selectedProject.name : "Projects"}<span>.</span></h1>
          <p>
            {selectedProject
              ? selectedProject.description || descriptions[selectedCategory?.name ?? ""] || `${selectedCategory?.name ?? "Creative"} project.`
              : "Every world, experiment and idea you're bringing to life."}
          </p>
        </div>

        {isAdmin && <div className="projects-heading-actions"><button className="dark-button" onClick={onCreateProject}><Plus size={16} /> New Project</button><button className="gold-button" onClick={onCreateLog}><FileText size={16} /> New Devlog</button></div>}
      </div>

      <div className="projects-overview-stats">
        <article>
          <Folder size={18} />
          <div><strong>{projects.length}</strong><span>Projects</span></div>
        </article>
        <article>
          <FileText size={18} />
          <div><strong>{logs.length}</strong><span>Devlogs</span></div>
        </article>
        <article>
          <Activity size={18} />
          <div>
            <strong>{new Set(logs.map((log) => log.project)).size}</strong>
            <span>Projects with activity</span>
          </div>
        </article>
      </div>

      <div className="media-project-filters" aria-label="Project categories">
        {categories.map((category) => <span key={category.id} className="category-filter-wrap"><button className={activeProject === category.name ? "filter-chip chip-active" : "filter-chip"} onClick={() => setActiveProject(activeProject === category.name ? "All" : category.name)}>{category.name}</button>{isAdmin && <><button className="tiny-icon" aria-label={`Edit ${category.name}`} onClick={() => { const name = window.prompt("Category name", category.name); if (!name?.trim()) return; const color = window.prompt("Category color (hex)", category.color); void repository.updateCategory(category.id, { name: name.trim(), color: color || category.color }).then((updated) => { setCategories((current) => current.map((item) => item.id === updated.id ? updated : item)); onRecordActivity("edited", "Category", updated.name, "Categories", `Name or color changed from ${category.name}`); }).catch((error: unknown) => window.alert(error instanceof Error ? error.message : "Could not update category")); }}><Pencil size={13}/></button><button className="tiny-icon tag-delete-button" aria-label={`Delete ${category.name}`} onClick={() => { if (!window.confirm(`Delete category “${category.name}”?`)) return; void repository.deleteCategory(category.id).then(() => { setCategories((current) => current.filter((item) => item.id !== category.id)); onRecordActivity("deleted", "Category", category.name, "Categories"); }).catch((error: unknown) => window.alert(error instanceof Error ? error.message : "Could not delete category. Move or delete its projects first.")); }}><Trash2 size={13}/></button></>}</span>)}
      </div>

      {selectedProject ? (
        <>
          <div className="project-detail-toolbar">
            <button
              className="dark-button"
              onClick={() => setActiveProject("All")}
            >
              <ArrowRight size={14} className="project-back-arrow" />
              All projects
            </button>
            <button
              className="text-link"
              onClick={() => {
                setSearch("");
                setActiveNav("Timeline");
              }}
            >
              Open Timeline <ArrowRight size={14} />
            </button>
            {isAdmin && <><button className="tiny-icon" aria-label="Edit project" title="Edit project" onClick={() => { const name = window.prompt("Project name", selectedProject.name); if (!name?.trim()) return; const description = window.prompt("Project description", selectedProject.description); const nextName = name.trim(); void repository.updateProject(selectedProject.id, { name: nextName, description: description ?? selectedProject.description }).then((updated) => { setProjects((current) => current.map((project) => project.id === updated.id ? updated : project)); setLogs((current) => current.map((log) => log.projectId === updated.id ? { ...log, project: updated.name } : log)); onRecordActivity("edited", "Project", nextName, selectedCategory?.name, `Name or description changed from “${selectedProject.name}”`); setActiveProject(nextName); }).catch((error: unknown) => window.alert(error instanceof Error ? error.message : "Could not update project")); }}><Pencil size={15}/></button><button className="tiny-icon tag-delete-button" aria-label="Delete project" title="Delete project" onClick={() => { if (!window.confirm(`Delete project “${selectedProject.name}”?`)) return; void repository.deleteProject(selectedProject.id).then(() => { setProjects((current) => current.filter((project) => project.id !== selectedProject.id)); setLogs((current) => current.map((log) => log.projectId === selectedProject.id ? { ...log, projectId: undefined, project: "Unassigned" } : log)); onRecordActivity("deleted", "Project", selectedProject.name, selectedCategory?.name, "Project deleted"); setActiveProject("All"); }).catch((error: unknown) => window.alert(error instanceof Error ? error.message : "Could not delete project")); }}><Trash2 size={15}/></button></>}
          </div>

          <article className="project-detail-card">
            <div
              className="project-detail-icon"
              style={{ color: selectedCategory?.color }}
            >
              {selectedCategory?.name.trim().charAt(0).toUpperCase()}
            </div>
            <div className="project-detail-copy">
              <span className="eyebrow">PROJECT OVERVIEW</span>
              <h2>{selectedProject.name}</h2>
              <p>{selectedProject.description || descriptions[selectedCategory?.name ?? ""] || `${selectedCategory?.name ?? "Creative"} project.`}</p>
              <div className="project-detail-meta">
                <span><FileText size={14} /> {projectLogs.length} logged entries</span>
                <span><CalendarDays size={14} /> Development history</span>
              </div>
              {isAdmin && <button className="dark-button" onClick={() => { const status = selectedProject.status === "published" ? "draft" : "published"; void repository.updateProject(selectedProject.id, { status }).then((updated) => { setProjects((current) => current.map((project) => project.id === updated.id ? updated : project)); onRecordActivity("edited", "Project", updated.name, selectedCategory?.name, `Status changed to ${status}`); }).catch((error: unknown) => window.alert(error instanceof Error ? error.message : "Could not update project visibility")); }}>{selectedProject.status === "published" ? "Unpublish project" : "Publish project"}</button>}
            </div>
          </article>

          <div className="project-work-section"><div className="project-logs-heading"><div><h2>Project tags</h2><p className="section-subtitle">Tags help visitors browse related work.</p></div></div><TagChips ids={selectedProject.tagIds} tags={tags} /></div>

          <div className="project-logs-heading">
            <div>
              <h2>Project Devlogs</h2>
              <p className="section-subtitle">The latest work on this project.</p>
            </div>
            <span>{projectLogs.length} entries</span>
          </div>

          {projectLogs.length ? (
            <div className="project-log-list">
              {projectLogs.map((log) => (
                <article className="project-log-row" key={log.id}>
                  <img
                    src={log.image}
                    alt=""
                    onError={(event) => {
                      event.currentTarget.style.opacity = "0";
                    }}
                  />
                  <div>
                    <h3>{log.title}</h3>
                    <time>{log.date}</time>
                    <p>{log.description}</p>
                    <TagChips ids={log.tagIds ?? []} tags={tags}/>
                    <span className="project-log-media">
                      <ImageIcon size={13} /> {log.images} images
                      {log.videos ? (
                        <> · <Video size={13} /> {log.videos} videos</>
                      ) : null}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="timeline-empty">
              <FolderOpen size={28} />
              <h2>No devlogs for this project yet</h2>
              <p>Create a devlog to start recording your progress.</p>
              {isAdmin && <button className="gold-button" onClick={onCreateLog}>
                <Plus size={15} /> Create devlog
              </button>}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="projects-list-toolbar">
            <div>
              <h2>All projects</h2>
              <p className="section-subtitle">
                Select a project to explore its development history.
              </p>
            </div>

            <label className="projects-search">
              <Search size={15} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search projects..."
              />
              {search && (
                <button onClick={() => setSearch("")} aria-label="Clear search">
                  <X size={14} />
                </button>
              )}
            </label>
          </div>

          {filteredProjects.length ? (
            <div className="projects-page-grid">
              {filteredProjects.map((project, index) => {
                const count = logs.filter((log) => log.projectId === project.id).length;
                const category = categories.find((item) => item.id === project.categoryId);

                return (
                  <button
                    className="projects-page-card"
                    key={project.name}
                    onClick={() => setActiveProject(project.name)}
                  >
                    <div className="projects-page-cover">
                      <img
                        src={[
                          "/ex-image-2.jpg",
                          "/ex-image-5.jpg",
                          "/ex-image-1.jpg",
                          "/ex-image-4.jpg",
                          "/ex-image-3.jpg",
                        ][projects.indexOf(project)]}
                        alt=""
                        onError={(event) => {
                          event.currentTarget.style.opacity = "0";
                        }}
                      />
                      <span
                        className="projects-page-symbol"
                        style={{ color: category?.color }}
                      >
                        {category?.name.trim().charAt(0).toUpperCase()}
                      </span>
                      <span className="projects-page-open">
                        <ArrowUpRight size={17} />
                      </span>
                    </div>

                    <div className="projects-page-card-body">
                      <div className="projects-page-card-title">
                        <h3>{project.name}</h3>
                        <span>{String(index + 1).padStart(2, "0")}</span>
                      </div>
                      <p>{project.description || descriptions[category?.name ?? ""] || `${category?.name ?? "Creative"} project.`}</p>
                      <TagChips ids={project.tagIds} tags={tags}/>
                      <div className="projects-page-card-footer">
                        <span><FileText size={13} /> {count} devlogs</span>
                        <span>Explore <ArrowRight size={13} /></span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="timeline-empty">
              <Search size={28} />
              <h2>No projects found</h2>
              <p>Try another project name.</p>
              <button className="dark-button" onClick={() => setSearch("")}>
                Clear search
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}


function MediaPage({
  media,
  projects,
  isAdmin,
  onUpload,
  onUpdate,
  onDelete,
}: {
  media: MediaRecord[];
  projects: Project[];
  isAdmin: boolean;
  onUpload: (file: File, projectId?: number, status?: "draft" | "published") => void;
  onUpdate: (id: number, changes: Partial<Pick<MediaRecord, "name" | "projectId" | "status">>) => void;
  onDelete: (item: MediaRecord) => void;
}) {
  const [mediaType, setMediaType] = useState("All");
  const [projectFilter, setProjectFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [uploadProjectId, setUploadProjectId] = useState<number | undefined>();
  const [uploadStatus, setUploadStatus] = useState<"draft" | "published">("draft");

  const mediaItems = useMemo(
    () =>
      media.map((item) => ({
        id: item.id,
        src: item.src,
        name: item.name,
        project: projects.find((project) => project.id === item.projectId)?.name ?? "Unassigned",
        type: item.type === "video" ? "Video" : "Image",
      })),
    [media, projects]
  );

  const filtered = mediaItems.filter((item) => {
    const matchesProject =
      projectFilter === "All" || item.project === projectFilter;
    const matchesQuery =
      !query ||
      `${item.name} ${item.project} ${item.src}`
        .toLowerCase()
        .includes(query.toLowerCase());

    return (mediaType === "All" || item.type.toLowerCase() === mediaType.slice(0, -1).toLowerCase()) && matchesProject && matchesQuery;
  });

  const activeItem = mediaItems.find((item) => item.id === selected);

  return (
    <section className="media-page">
      <div className="media-page-heading">
        <div>
          <span className="eyebrow">YOUR CREATIVE ARCHIVE</span>
          <h1>Media<span>.</span></h1>
          <p>Renders, screenshots and snapshots from your development journey.</p>
        </div>
        <div className="media-total">
          <ImageIcon size={18} />
            <strong>{mediaItems.length}</strong>
          <span>published items</span>
        </div>
        {isAdmin && <label className="gold-button media-upload-button"><Plus size={15}/> Upload media<input type="file" accept="image/*,video/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) onUpload(file, uploadProjectId, uploadStatus); event.currentTarget.value = ""; }} /></label>}
      </div>

      {isAdmin && <div className="media-admin-options"><label>Link to project<select value={uploadProjectId ?? ""} onChange={(event) => setUploadProjectId(event.target.value ? Number(event.target.value) : undefined)}><option value="">No project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label><label>Visibility<select value={uploadStatus} onChange={(event) => setUploadStatus(event.target.value as "draft" | "published")}><option value="draft">Draft</option><option value="published">Published</option></select></label></div>}

      <div className="media-page-toolbar">
        <div className="media-page-tabs">
          {["All", "Images", "Videos"].map((type) => (
            <button
              key={type}
              className={mediaType === type ? "media-page-tab active" : "media-page-tab"}
              onClick={() => setMediaType(type)}
            >
              {type === "Videos" ? <Video size={15} /> : <ImageIcon size={15} />}
              {type}
            </button>
          ))}
        </div>

        <label className="media-page-search">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search media..."
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Clear search">
              <X size={14} />
            </button>
          )}
        </label>
      </div>

      <div className="media-project-filters">
        {["All", ...projects.map((project) => project.name)].map((name) => (
          <button
            key={name}
            className={projectFilter === name ? "filter-chip chip-active" : "filter-chip"}
            onClick={() => setProjectFilter(name)}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="media-page-results">
        <span>
          {mediaType === "Videos"
            ? "Video gallery"
            : `${filtered.length} ${filtered.length === 1 ? "item" : "items"}`}
        </span>
        <span>{projectFilter === "All" ? "All projects" : projectFilter}</span>
      </div>

      {mediaType === "Videos" && !filtered.length ? (
        <div className="timeline-empty">
          <Video size={28} />
          <h2>No video records yet</h2>
          <p>Your current sample data contains image paths only. Video support can be connected when media records are added.</p>
        </div>
      ) : filtered.length ? (
        <div className="media-page-grid">
          {filtered.map((item) => {
            const sourceRecord = media.find((record) => record.id === item.id)!;
            return <article className="media-page-card" key={item.id}>
            <button className="media-preview-button" onClick={() => setSelected(item.id)}>
              <div className="media-page-image">
                {item.type === "Video" ? <video src={item.src} muted preload="metadata"/> : <img
                  src={item.src}
                  alt={item.name}
                  onError={(event) => {
                    event.currentTarget.style.opacity = "0";
                  }}
                />}
                <span className="media-page-zoom">
                  <Search size={17} />
                </span>
              </div>
              <div className="media-page-card-info">
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.project}</span>
                </div>
                  {item.type === "Video" ? <Video size={15} /> : <ImageIcon size={15} />}
              </div>
            </button>
            {isAdmin && <div className="media-admin-actions"><span>{sourceRecord.status === "draft" ? "Draft" : "Published"}</span><button className="tiny-icon" aria-label={`${sourceRecord.status === "draft" ? "Publish" : "Unpublish"} ${item.name}`} onClick={() => onUpdate(item.id, { status: sourceRecord.status === "draft" ? "published" : "draft" })}>{sourceRecord.status === "draft" ? "Publish" : "Unpublish"}</button><button className="tiny-icon" aria-label={`Rename ${item.name}`} onClick={() => { const name = window.prompt("Media name", item.name); if (name?.trim()) onUpdate(item.id, { name: name.trim() }); }}><Pencil size={13}/></button><button className="tiny-icon tag-delete-button" aria-label={`Delete ${item.name}`} onClick={() => onDelete(sourceRecord)}><Trash2 size={13}/></button></div>}
          </article>;
          })}
        </div>
      ) : (
        <div className="timeline-empty">
          <Search size={28} />
          <h2>No media found</h2>
          <p>Try a different search or project filter.</p>
          <button
            className="dark-button"
            onClick={() => {
              setQuery("");
              setProjectFilter("All");
            }}
          >
            Clear filters
          </button>
        </div>
      )}

      {activeItem && (
        <div
          className="media-lightbox"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
        >
          <div className="media-lightbox-content">
            <div className="media-lightbox-header">
              <div>
                <strong>{activeItem.name}</strong>
                <span>{activeItem.project}</span>
              </div>
              <button onClick={() => setSelected(null)} aria-label="Close preview">
                <X size={20} />
              </button>
            </div>
            {activeItem.type === "Video" ? <video src={activeItem.src} controls autoPlay/> : <img src={activeItem.src} alt={activeItem.name} />}
            <div className="media-lightbox-footer">
              <span><ImageIcon size={14} /> Image preview</span>
              <div>
                <button
                  disabled={filtered.findIndex((item) => item.id === selected) <= 0}
                  onClick={() => {
                    const index = filtered.findIndex((item) => item.id === selected);
                    if (index > 0) setSelected(filtered[index - 1].id);
                  }}
                >
                  <ChevronLeft size={17} /> Previous
                </button>
                <button
                  disabled={filtered.findIndex((item) => item.id === selected) >= filtered.length - 1}
                  onClick={() => {
                    const index = filtered.findIndex((item) => item.id === selected);
                    if (index < filtered.length - 1) setSelected(filtered[index + 1].id);
                  }}
                >
                  Next <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}



function ActivityPage({
  activity,
  onCreate,
}: {
  activity: ActivityEntry[];
  onCreate: () => void;
}) {
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");

  const filteredActivity = useMemo(() => {
    return [...activity]
      .filter((entry) => {
        const matchesFilter = filter === "All" || entry.action === filter.toLowerCase();
        const matchesSearch =
          !query ||
          `${entry.title} ${entry.project} ${entry.action} ${entry.entity} ${entry.details ?? ""}`
            .toLowerCase()
            .includes(query.toLowerCase());

        return matchesFilter && matchesSearch;
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [activity, filter, query]);

  function actionLabel(action: ActivityEntry["action"]) {
    if (action === "created") return "Created";
    if (action === "edited") return "Edited";
    return "Deleted";
  }

  function actionIcon(action: ActivityEntry["action"]) {
    if (action === "created") return <Plus size={17} />;
    if (action === "edited") return <Pencil size={17} />;
    return <Trash2 size={17} />;
  }

  return (
    <section className="activity-page">
      <div className="activity-page-heading">
        <div>
          <span className="eyebrow">YOUR WORKSPACE HISTORY</span>
          <h1>Activity<span>.</span></h1>
          <p>New devlogs, projects, workspaces, and tag changes in one feed.</p>
        </div>

        <button className="gold-button" onClick={onCreate}>
          <Plus size={16} /> New Devlog
        </button>
      </div>

      <div className="activity-page-summary">
        <div>
          <Activity size={19} />
          <span><strong>{activity.length}</strong> recorded actions</span>
        </div>
        <span>Newest first</span>
      </div>

      <div className="activity-page-toolbar">
        <div className="activity-page-filters">
          {["All", "Created", "Edited", "Deleted"].map((name) => (
            <button
              key={name}
              className={filter === name ? "filter-chip chip-active" : "filter-chip"}
              onClick={() => setFilter(name)}
            >
              {name}
            </button>
          ))}
        </div>

        <label className="activity-page-search">
          <Search size={15} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search activity..."
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Clear search">
              <X size={14} />
            </button>
          )}
        </label>
      </div>

      {filteredActivity.length ? (
        <div className="activity-feed">
          {filteredActivity.map((entry) => {
            const date = new Date(entry.timestamp);

            return (
              <article className="activity-feed-entry" key={entry.id}>
                <div className={`activity-feed-icon activity-feed-${entry.action}`}>
                  {actionIcon(entry.action)}
                </div>

                <div className="activity-feed-content">
                  <div className="activity-feed-top">
                    <strong>{actionLabel(entry.action)} {entry.entity.toLowerCase()}</strong>
                    <time title={date.toLocaleString()}>
                      {date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      ·{" "}
                      {date.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>

                  <h3>{entry.title}</h3>
                  {entry.details && <p className="activity-entry-details">{entry.details}</p>}

                  <div className="activity-feed-meta">
                    <span className="activity-feed-project">
                      {entry.project}
                    </span>
                    <span>{entry.entity}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="timeline-empty">
          <Activity size={28} />
          <h2>{activity.length ? "No matching activity" : "Nothing recorded yet"}</h2>
          <p>
            {activity.length
              ? "Try another filter or search term."
              : "Create a devlog, project, workspace, or tag to start the activity feed."}
          </p>
          {activity.length ? (
            <button
              className="dark-button"
              onClick={() => {
                setFilter("All");
                setQuery("");
              }}
            >
              Clear filters
            </button>
          ) : (
            <button className="gold-button" onClick={onCreate}>
              <Plus size={15} /> Create devlog
            </button>
          )}
        </div>
      )}
    </section>
  );
}



function TagsPage({
  tags,
  setTags,
  logs,
  projects,
  repository,
  onActivity,
}: {
  tags: DevTag[];
  setTags: React.Dispatch<React.SetStateAction<DevTag[]>>;
  logs: Devlog[];
  projects: Project[];
  repository: PortfolioRepository;
  onActivity: (action: ActivityEntry["action"], entity: ActivityEntry["entity"], title: string, project?: string, details?: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#e8b85a");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingColor, setEditingColor] = useState("#e8b85a");
  const [error, setError] = useState("");

  const filteredTags = useMemo(
    () =>
      tags.filter((tag) =>
        tag.name.toLowerCase().includes(query.trim().toLowerCase())
      ),
    [tags, query]
  );

  async function addTag(event: React.FormEvent) {
    event.preventDefault();
    const name = newName.trim();

    if (!name) return;

    if (tags.some((tag) => tag.name.toLowerCase() === name.toLowerCase())) {
      setError("A tag with this name already exists.");
      return;
    }

    let tag: DevTag;
    try { tag = await repository.createTag({ name, color: newColor }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create tag"); return; }
    setTags((current) => [...current, tag]);
    setNewName("");
    setError("");
    onActivity("created", "Tag", name, "Tags", `Color ${newColor}`);
  }

  function startEditing(tag: DevTag) {
    setEditingId(tag.id);
    setEditingName(tag.name);
    setEditingColor(tag.color);
    setError("");
  }

  async function saveEdit(event: React.FormEvent) {
    event.preventDefault();
    const name = editingName.trim();

    if (!name || editingId === null) return;

    if (
      tags.some(
        (tag) =>
          tag.id !== editingId &&
          tag.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      setError("A tag with this name already exists.");
      return;
    }

    const previous = tags.find((tag) => tag.id === editingId);
    let updated: DevTag;
    try { updated = await repository.updateTag(editingId, { name, color: editingColor }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update tag"); return; }
    setTags((current) => current.map((tag) => tag.id === editingId ? updated : tag));

    setEditingId(null);
    setError("");
    if (previous) onActivity("edited", "Tag", name, "Tags", `Changed ${previous.name} → ${name}; color ${previous.color} → ${editingColor}`);
  }

  async function deleteTag(tag: DevTag) {
    if (!window.confirm(`Delete the "${tag.name}" tag?`)) return;

    try { await repository.deleteTag(tag.id); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not delete tag"); return; }
    setTags((current) => current.filter((item) => item.id !== tag.id));
    onActivity("deleted", "Tag", tag.name, "Tags", `Removed from ${logs.filter((log) => log.tagIds?.includes(tag.id)).length} devlogs and ${projects.filter((project) => project.tagIds.includes(tag.id)).length} projects`);

    if (editingId === tag.id) setEditingId(null);
    setError("");
  }

  return (
    <section className="tags-page">
      <div className="tags-page-heading">
        <div>
          <span className="eyebrow">ORGANIZE YOUR WORK</span>
          <h1>Tags<span>.</span></h1>
          <p>Create and manage labels for organizing your development logs.</p>
        </div>
        <div className="tags-total">
          <Tag size={19} />
          <strong>{tags.length}</strong>
          <span>{tags.length === 1 ? "tag" : "tags"}</span>
        </div>
      </div>

      <form className="tags-create-form" onSubmit={addTag}>
        <div className="tags-form-heading">
          <h2>Create a tag</h2>
          <p>Choose a memorable name and color.</p>
        </div>

        <div className="tags-form-controls">
          <label className="tags-name-field">
            <span>Tag name</span>
            <input
              value={newName}
              onChange={(event) => {
                setNewName(event.target.value);
                setError("");
              }}
              placeholder="e.g. Lighting"
              maxLength={40}
              required
            />
          </label>

          <label className="tags-color-field">
            <span>Color</span>
            <input
              type="color"
              value={newColor}
              onChange={(event) => setNewColor(event.target.value)}
              aria-label="New tag color"
            />
          </label>

          <button className="gold-button" type="submit">
            <Plus size={15} /> Create tag
          </button>
        </div>

        {error && <p className="tags-error">{error}</p>}
      </form>

      <div className="tags-list-heading">
        <div>
          <h2>Your tags</h2>
          <p className="section-subtitle">
            Manage names and colors whenever you need to.
          </p>
        </div>

        <label className="tags-search">
          <Search size={15} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tags..."
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </label>
      </div>

      {filteredTags.length ? (
        <div className="tags-grid">
          {filteredTags.map((tag) => (
            <article className="tag-management-card" key={tag.id}>
              {editingId === tag.id ? (
                <form className="tag-edit-form" onSubmit={saveEdit}>
                  <label>
                    <span>Name</span>
                    <input
                      value={editingName}
                      onChange={(event) => {
                        setEditingName(event.target.value);
                        setError("");
                      }}
                      maxLength={40}
                      required
                      autoFocus
                    />
                  </label>

                  <label className="tag-edit-color">
                    <span>Color</span>
                    <input
                      type="color"
                      value={editingColor}
                      onChange={(event) => setEditingColor(event.target.value)}
                    />
                  </label>

                  <div className="tag-edit-actions">
                    <button type="submit" className="gold-button">
                      <Check size={14} /> Save
                    </button>
                    <button
                      type="button"
                      className="dark-button"
                      onClick={() => {
                        setEditingId(null);
                        setError("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="tag-card-top">
                    <span
                      className="tag-color-dot"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span
                      className="tag-preview"
                      style={{
                        color: tag.color,
                        borderColor: `${tag.color}55`,
                        backgroundColor: `${tag.color}12`,
                      }}
                    >
                      {tag.name}
                    </span>
                    <button
                      className="tiny-icon"
                      onClick={() => startEditing(tag)}
                      aria-label={`Edit ${tag.name}`}
                      title="Edit tag"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="tiny-icon tag-delete-button"
                      onClick={() => deleteTag(tag)}
                      aria-label={`Delete ${tag.name}`}
                      title="Delete tag"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="tag-card-bottom">
                    <span>Devlogs and workspaces using this tag</span>
                    <strong>{logs.filter((log) => log.tagIds?.includes(tag.id)).length + projects.filter((project) => project.tagIds.includes(tag.id)).length}</strong>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="timeline-empty">
          <Tag size={28} />
          <h2>{tags.length ? "No matching tags" : "No tags yet"}</h2>
          <p>
            {tags.length
              ? "Try another search term."
              : "Create a tag above to start organizing your devlogs."}
          </p>
          {query && (
            <button className="dark-button" onClick={() => setQuery("")}>
              Clear search
            </button>
          )}
        </div>
      )}

      {error && <p className="tags-error tags-global-error">{error}</p>}
    </section>
  );
}



export default App;
