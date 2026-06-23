import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Phone, MapPin } from 'lucide-react'

export default function ContactPage() {
  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Contact Us</h1>
        <p className="text-xl text-muted-foreground">
          Have questions? We'd love to hear from you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <Mail className="h-12 w-12 text-primary mb-2" />
            <CardTitle>Email</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">support@surimart.com</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Phone className="h-12 w-12 text-primary mb-2" />
            <CardTitle>Phone</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">+63 (0) XXX XXX XXXX</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <MapPin className="h-12 w-12 text-primary mb-2" />
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Surigao City, Philippines</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Send us a message</CardTitle>
          <CardDescription>
            Fill out the form below and we'll get back to you as soon as possible.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="your@email.com" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" placeholder="What's this about?" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Input
                id="message"
                placeholder="Your message..."
                className="min-h-[120px]"
              />
            </div>
            <Button type="submit" className="w-full">
              Send Message
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
