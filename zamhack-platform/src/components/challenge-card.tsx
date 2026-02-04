import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarDays, Users, Trophy, Building2, Timer } from "lucide-react"
import Link from "next/link"

interface ChallengeCardProps {
  challenge: any
  href: string
  showStatus?: boolean // Option to completely hide ALL statuses if needed
}

export function ChallengeCard({ challenge, href, showStatus = true }: ChallengeCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'under_review': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-purple-100 text-purple-800'
      case 'closed': return 'bg-gray-100 text-gray-800' // Added styling for the new 'closed' status
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Calculate days left
  const daysLeft = Math.ceil(
    (new Date(challenge.registration_deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )

  const isRegistrationOpen = daysLeft > 0 && challenge.status === 'approved'

  return (
    <Card className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="space-y-4">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-xl line-clamp-2">{challenge.title}</h3>
            {challenge.organization && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Building2 className="mr-1 h-3 w-3" />
                {challenge.organization.name}
              </div>
            )}
          </div>
          
          {/* INSTRUCTOR FEEDBACK: Hide "approved" label. Only show if it's NOT approved. */}
          {showStatus && challenge.status !== 'approved' && (
            <Badge variant="outline" className={`capitalize shrink-0 ${getStatusColor(challenge.status)}`}>
              {challenge.status.replace('_', ' ')}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {challenge.description}
        </p>

        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <div className="flex items-center text-muted-foreground">
            <CalendarDays className="mr-2 h-4 w-4" />
            {new Date(challenge.start_date).toLocaleDateString()}
          </div>
          <div className="flex items-center text-muted-foreground">
            <Trophy className="mr-2 h-4 w-4" />
            {challenge.difficulty || "Open"}
          </div>
          <div className="flex items-center text-muted-foreground">
            <Users className="mr-2 h-4 w-4" />
            {challenge.participation_type === 'team' ? `Team (${challenge.max_team_size} max)` : 'Solo'}
          </div>
          {isRegistrationOpen && (
            <div className="flex items-center text-amber-600 font-medium">
              <Timer className="mr-2 h-4 w-4" />
              {daysLeft} days left
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t">
        <Button asChild className="w-full">
          <Link href={href}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}