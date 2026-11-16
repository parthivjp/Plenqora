import Avatar from './Avatar'
import Icon from './Icon'
import { navigation } from '../data/seedData'

export default function WorkspaceLayout({ children, page, project, projects, workspace, profile, issueCount, canCreateProjects, onNavigate, onSelectProject, onCreateProject, onNotify, onLogout }) {
  const pageTitle = navigation.find((item) => item.id === page)?.label ?? 'Board'
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button type="button" className="brand" onClick={() => onNavigate('board')} aria-label="Plenqora home">
          <span className="brand-mark"><Icon name="board" size={24} /></span>
          <span>plenqora<span className="brand-dot">.</span></span>
        </button>
        <button className="workspace-switcher" type="button" aria-label={`${workspace.name} overview`} title={workspace.name} onClick={() => onNavigate('overview')}>
          <span className="workspace-avatar">P</span>
          <span className="workspace-copy"><strong>{workspace.name}</strong><small>Local workspace</small></span>
          <Icon name="down" size={15} />
        </button>
        <div className="sidebar-label">WORKSPACE</div>
        <nav className="main-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <button type="button" key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} aria-label={item.label} title={item.label} onClick={() => onNavigate(item.id)}>
              <Icon name={item.icon} size={20} /><span>{item.label}</span>
              {item.id === 'issues' && <span className="nav-count">{issueCount}</span>}
            </button>
          ))}
        </nav>
        <div className="projects-heading"><span className="sidebar-label">YOUR PROJECTS</span>{canCreateProjects && <button type="button" className="icon-button subtle-icon" aria-label="Create project" onClick={onCreateProject}><Icon name="plus" size={16} /></button>}</div>
        <div className="project-list">
          {projects.map((item) => (
            <button type="button" key={item.id} className={`project-link ${item.id === project.id ? 'selected' : ''}`} aria-label={item.name} title={item.name} onClick={() => onSelectProject(item)}>
              <span className={`project-dot dot-${item.color}`} /><span className="project-name">{item.name}</span>
              {item.id === project.id && <Icon name="chevron" size={15} />}
            </button>
          ))}
        </div>
        {canCreateProjects && <button type="button" className="add-project-link" onClick={onCreateProject}><Icon name="plus" size={15} /> Add a project</button>}
        <div className="sidebar-bottom">
          <div className="sidebar-account">
            <div className="profile-row"><Avatar person={profile.name} /><span className="profile-copy"><strong>{profile.name}</strong><small>{profile.role}</small></span><button type="button" className="icon-button subtle-icon" aria-label="Open profile settings" onClick={() => onNavigate('settings')}><Icon name="settings" size={19} /></button></div>
            <button type="button" className="nav-item logout-link" aria-label="Sign out" title="Sign out" onClick={onLogout}><Icon name="logout" size={17} /><span>Sign out</span></button>
          </div>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs"><span>Projects</span><Icon name="chevron" size={14} /><button type="button" onClick={() => onNavigate('board')}>{project.name}</button><Icon name="chevron" size={14} /><strong>{pageTitle}</strong></div>
          <div className="topbar-actions"><span className="keyboard-hint"><span>⌘</span> K</span><button type="button" className="icon-button notification-button" aria-label="View open issues" onClick={onNotify}><Icon name="bell" size={19} /><i /></button><button type="button" className="profile-avatar-button" aria-label="Open profile settings" onClick={() => onNavigate('settings')}><Avatar person={profile.name} /></button></div>
        </header>
        {children}
      </main>
    </div>
  )
}
