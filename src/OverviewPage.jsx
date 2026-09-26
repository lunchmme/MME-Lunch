import AdminShell from './AdminShell.jsx'
import { Stats } from './AdminPage.jsx'

export default function OverviewPage() {
  return <AdminShell active="overview">{api => <Stats api={api} />}</AdminShell>
}
