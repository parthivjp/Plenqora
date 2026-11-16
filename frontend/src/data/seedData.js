export const initialProjects = [
  { id: 'atlas', name: 'Atlas workspace', key: 'ATL', description: 'Customer experience platform', color: 'violet' },
  { id: 'mobile', name: 'Mobile app', key: 'MOB', description: 'iOS & Android experience', color: 'blue' },
  { id: 'website', name: 'Website refresh', key: 'WEB', description: 'Marketing site redesign', color: 'orange' },
]

export const initialMembers = [
  { name: 'Olivia Chen', email: 'olivia@example.com', initials: 'OC', color: 'lilac', role: 'Admin', status: 'Active' },
  { name: 'Marcus Lee', email: 'marcus@example.com', initials: 'ML', color: 'mint', role: 'Developer', status: 'Active' },
  { name: 'Amara Okafor', email: 'amara@example.com', initials: 'AO', color: 'peach', role: 'Designer', status: 'Away' },
  { name: 'Noah Williams', email: 'noah@example.com', initials: 'NW', color: 'blue', role: 'Developer', status: 'Active' },
]

export const initialIssues = [
  { id: 'ATL-24', projectId: 'atlas', title: 'Checkout page freezes after applying a discount code', description: 'The checkout screen becomes unresponsive after a valid discount is applied. Reproduced on Chrome and Safari.', status: 'todo', priority: 'High', assignee: 'Olivia Chen', type: 'Bug', date: 'Today' },
  { id: 'ATL-23', projectId: 'atlas', title: 'Add a compact view to the activity timeline', description: 'Give workspace members a more condensed way to scan recent project activity.', status: 'todo', priority: 'Medium', assignee: 'Marcus Lee', type: 'Feature', date: 'Today' },
  { id: 'ATL-21', projectId: 'atlas', title: 'Email notifications are sent twice', description: 'Some users receive duplicate email notifications when a ticket is assigned.', status: 'todo', priority: 'Low', assignee: 'Noah Williams', type: 'Bug', date: 'Yesterday' },
  { id: 'ATL-19', projectId: 'atlas', title: 'Polish onboarding empty states', description: 'Make the first-project experience feel more helpful and welcoming.', status: 'progress', priority: 'Medium', assignee: 'Amara Okafor', type: 'Design', date: 'Yesterday' },
  { id: 'ATL-18', projectId: 'atlas', title: 'Improve dashboard loading performance', description: 'Reduce the time required to render the dashboard for large workspaces.', status: 'progress', priority: 'High', assignee: 'Marcus Lee', type: 'Improvement', date: 'Oct 22' },
  { id: 'ATL-16', projectId: 'atlas', title: 'Document workspace permission levels', description: 'Add clear documentation for workspace roles and what each role can do.', status: 'progress', priority: 'Low', assignee: 'Noah Williams', type: 'Documentation', date: 'Oct 21' },
  { id: 'ATL-14', projectId: 'atlas', title: 'Invite teammates by email', description: 'Let project admins invite teammates and assign a workspace role.', status: 'done', priority: 'Medium', assignee: 'Olivia Chen', type: 'Feature', date: 'Oct 20' },
  { id: 'ATL-12', projectId: 'atlas', title: 'Create project overview page', description: 'A quick summary of project health, activity, and outstanding work.', status: 'done', priority: 'Low', assignee: 'Amara Okafor', type: 'Feature', date: 'Oct 18' },
  { id: 'MOB-08', projectId: 'mobile', title: 'Fix profile photo crop on smaller screens', description: 'Avatar crop should stay centered on narrow mobile devices.', status: 'todo', priority: 'Medium', assignee: 'Amara Okafor', type: 'Bug', date: 'Today' },
  { id: 'MOB-07', projectId: 'mobile', title: 'Add biometric sign-in', description: 'Allow users to securely sign in with device biometrics.', status: 'progress', priority: 'High', assignee: 'Noah Williams', type: 'Feature', date: 'Yesterday' },
  { id: 'WEB-11', projectId: 'website', title: 'Update the homepage testimonials', description: 'Refresh customer quotes and profile imagery.', status: 'todo', priority: 'Low', assignee: 'Marcus Lee', type: 'Design', date: 'Today' },
]

export const columns = [
  { id: 'todo', title: 'To do', color: 'gray', icon: 'circle' },
  { id: 'progress', title: 'In progress', color: 'violet', icon: 'clock' },
  { id: 'done', title: 'Done', color: 'green', icon: 'check' },
]

export const navigation = [
  { id: 'overview', label: 'Overview', icon: 'grid' },
  { id: 'board', label: 'Board', icon: 'board' },
  { id: 'issues', label: 'All issues', icon: 'checklist' },
  { id: 'team', label: 'Team', icon: 'users' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
]
