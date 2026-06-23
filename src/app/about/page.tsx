import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Users, Target, Zap } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">About SuriMart</h1>
        <p className="text-xl text-muted-foreground">
          Surigao Marketplace - Connecting Communities Through Commerce
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Our Mission</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            SuriMart is dedicated to creating a safe, trusted, and efficient marketplace for the Surigao region and beyond. 
            We leverage modern technology to connect buyers and sellers, making local commerce more accessible and secure for everyone.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Shield className="h-12 w-12 text-primary mb-2" />
            <CardTitle>Trust & Safety</CardTitle>
            <CardDescription>Verified sellers only</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              We require all sellers to verify their identity with valid ID before listing items, 
              ensuring a safer marketplace for everyone.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Users className="h-12 w-12 text-primary mb-2" />
            <CardTitle>Community First</CardTitle>
            <CardDescription>Local focus, global reach</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Built for the Surigao community, SuriMart connects neighbors and makes it easy to buy 
              and sell within your local area.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Target className="h-12 w-12 text-primary mb-2" />
            <CardTitle>User Experience</CardTitle>
            <CardDescription>Modern, intuitive design</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Our platform is designed with user experience in mind, featuring a clean interface, 
              powerful search, and seamless navigation.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Zap className="h-12 w-12 text-primary mb-2" />
            <CardTitle>Fast & Efficient</CardTitle>
            <CardDescription>Powered by modern technology</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Built on Next.js 15 and Supabase, SuriMart delivers lightning-fast performance and 
              real-time updates for the best user experience.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h3 className="font-semibold">Create an Account</h3>
              <p className="text-sm text-muted-foreground">Sign up with email or Google in seconds</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h3 className="font-semibold">Verify Your Identity</h3>
              <p className="text-sm text-muted-foreground">Upload a valid ID to become a verified seller</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h3 className="font-semibold">Start Buying or Selling</h3>
              <p className="text-sm text-muted-foreground">Browse products or create your own items for sale</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
              4
            </div>
            <div>
              <h3 className="font-semibold">Connect & Transact</h3>
              <p className="text-sm text-muted-foreground">Message sellers, arrange meetups, and complete transactions safely</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
