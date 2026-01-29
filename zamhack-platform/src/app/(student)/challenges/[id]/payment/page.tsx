"use client"

import { useState, use } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle, CreditCard, Lock } from "lucide-react"
import { joinChallenge } from "@/app/challenges/actions"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Fake state for the form
  const [cardNumber, setCardNumber] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvc, setCvc] = useState("")
  const [name, setName] = useState("")

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    try {
      // 1. "Process" the payment (Mock success)
      // In a real app, you would call Stripe/PayPal here.
      
      // 2. If payment succeeds, join the challenge
      const result = await joinChallenge(id)
      
      if (result?.error) {
        throw new Error(result.error)
      }

      toast.success("Payment successful! You have joined the challenge.")
      router.push(`/challenges/${id}`)
      router.refresh()

    } catch (err: any) {
      setError(err.message || "Payment failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Format card number with spaces
  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 16)
    const formatted = value.replace(/(\d{4})/g, '$1 ').trim()
    setCardNumber(formatted)
  }

  return (
    <div className="container max-w-md py-20">
      <Card className="border-2 shadow-lg">
        <CardHeader className="text-center border-b bg-muted/20">
          <CardTitle className="text-2xl">Secure Checkout</CardTitle>
          <CardDescription>Complete your registration</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-6">
          {/* Order Summary */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-2">
            <div className="flex justify-between text-sm text-blue-900">
              <span>Entry Fee</span>
              <span className="font-semibold">₱500.00</span>
            </div>
            <div className="flex justify-between text-sm text-blue-900">
              <span>Processing Fee</span>
              <span className="font-semibold">₱0.00</span>
            </div>
            <div className="border-t border-blue-200 pt-2 flex justify-between font-bold text-blue-900">
              <span>Total</span>
              <span>₱500.00</span>
            </div>
          </div>

          <Alert variant="default" className="bg-yellow-50 border-yellow-200">
             <AlertCircle className="h-4 w-4 text-yellow-600" />
             <AlertTitle className="text-yellow-800">Test Mode</AlertTitle>
             <AlertDescription className="text-yellow-700">
               This is a mock payment. You will not be charged. Enter any details to proceed.
             </AlertDescription>
          </Alert>

          {error && (
             <Alert variant="destructive">
               <AlertCircle className="h-4 w-4" />
               <AlertDescription>{error}</AlertDescription>
             </Alert>
          )}

          <form onSubmit={handlePayment} className="space-y-4">
            <div className="space-y-2">
              <Label>Name on Card</Label>
              <Input 
                placeholder="Juan Dela Cruz" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label>Card Number</Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input 
                  className="pl-10 font-mono" 
                  placeholder="0000 0000 0000 0000" 
                  value={cardNumber}
                  onChange={handleCardChange}
                  maxLength={19}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input 
                  placeholder="MM/YY" 
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  maxLength={5}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>CVC</Label>
                <Input 
                   type="password"
                   placeholder="123" 
                   value={cvc}
                   onChange={(e) => setCvc(e.target.value)}
                   maxLength={3}
                   required
                />
              </div>
            </div>

            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" size="lg" disabled={isLoading}>
              {isLoading ? (
                  <>Processing...</>
              ) : (
                  <span className="flex items-center gap-2">
                    <Lock className="h-4 w-4" /> Pay ₱500.00
                  </span>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t bg-muted/20 py-4">
           <p className="text-xs text-muted-foreground flex items-center gap-1">
             <Lock className="h-3 w-3" /> Payments are secure and encrypted
           </p>
        </CardFooter>
      </Card>
    </div>
  )
}