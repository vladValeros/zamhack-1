import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Database } from "@/types/supabase"
import { redirect } from "next/navigation"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { OrgApprovalActions } from "@/components/admin/org-approval-actions"
import { Users, Building2, Trophy } from "lucide-react"

type Organization = Database["public"]["Tables"]["organizations"]["Row"]
type Profile = Database["public"]["Tables"]["profiles"]["Row"]
type Challenge = Database["public"]["Tables"]["challenges"]["Row"]

interface DashboardData {
  pendingOrgs: Organization[]
  pendingChallenges: any[] // Using any here to handle the joined data easily
  stats: {
    totalUsers: number
    totalOrganizations: number
    totalChallenges: number
  }
  recentUsers: (Profile & { email?: string | null })[]
}

async function getAdminDashboardData(): Promise<DashboardData> {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/login")
  }

  // Check admin role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || !profile || profile.role !== "admin") {
    redirect("/dashboard")
  }

  // 1. Fetch pending organizations
  const { data: pendingOrgs } = await supabase
    .from("organizations")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  // 2. Fetch pending challenges
  // UPDATED: Removed alias to be safer. We access it via 'organizations.name' later.
  const { data: pendingChallenges, error: challengeError } = await supabase
    .from("challenges")
    .select(`
      *,
      organizations (
        name
      )
    `)
    .eq("status", "pending_approval")
    .order("created_at", { ascending: false })
  
  if (challengeError) {
    console.error("Error fetching pending challenges:", challengeError)
  }

  // 3. Fetch stats counts
  const { count: userCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })

  const { count: orgCount } = await supabase
    .from("organizations")
    .select("*", { count: "exact", head: true })

  const { count: challengeCount } = await supabase
    .from("challenges")
    .select("*", { count: "exact", head: true })

  // 4. Fetch recent users
  const { data: recentProfiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10)

  return {
    pendingOrgs: pendingOrgs || [],
    pendingChallenges: pendingChallenges || [],
    stats: {
      totalUsers: userCount || 0,
      totalOrganizations: orgCount || 0,
      totalChallenges: challengeCount || 0,
    },
    recentUsers: recentProfiles || [],
  }
}

// Helpers
const formatDate = (dateString: string | null) => {
  if (!dateString) return "N/A"
  return new Date(dateString).toLocaleDateString()
}

const getRoleBadgeVariant = (role: string | null) => {
  switch (role) {
    case "admin":
      return "destructive"
    case "company_admin":
      return "default"
    case "company_member":
      return "secondary"
    case "student":
      return "outline"
    default:
      return "outline"
  }
}

const getUserName = (user: Profile) => {
  return `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Unnamed User"
}

export default async function AdminDashboardPage() {
  const { pendingOrgs, pendingChallenges, stats, recentUsers } = await getAdminDashboardData()

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage organizations, users, and platform settings.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Organizations
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrganizations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Challenges
            </CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalChallenges}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Section 1: Pending Organizations */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
             Pending Organizations
             {pendingOrgs.length > 0 && <Badge>{pendingOrgs.length}</Badge>}
          </h2>
          {pendingOrgs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <p>No pending organization approvals.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingOrgs.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell>
                        <div className="font-medium">{org.name}</div>
                        <div className="text-xs text-muted-foreground">{org.industry || "N/A"}</div>
                      </TableCell>
                      <TableCell>{formatDate(org.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <OrgApprovalActions orgId={org.id} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>

        {/* Section 2: Pending Challenges */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
             Pending Challenges
             {pendingChallenges.length > 0 && <Badge variant="secondary">{pendingChallenges.length}</Badge>}
          </h2>
          {pendingChallenges.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <p>No pending challenge approvals.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Challenge Title</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingChallenges.map((challenge) => (
                    <TableRow key={challenge.id}>
                      <TableCell>
                        <div className="font-medium">{challenge.title}</div>
                        <div className="text-xs text-muted-foreground">
                           {/* Updated accessor based on new query */}
                           {challenge.organizations?.name || "Unknown Org"}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(challenge.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/admin/challenges/${challenge.id}`}>
                            Review
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      </div>

      {/* Section 3: Recent Users */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Recent Users</h2>
        {recentUsers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p>No users found.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{getUserName(user)}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role) as any}>
                        {user.role || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.email || "Hidden"}</TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  )
}