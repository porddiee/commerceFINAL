'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { Shield, CheckCircle, XCircle, Clock, Search, FileText } from 'lucide-react'

export default function AdminVerificationsPage() {
  const supabase = createClient()
  const [verifications, setVerifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedVerification, setSelectedVerification] = useState<any>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)

  useEffect(() => {
    fetchVerifications()
  }, [])

  const fetchVerifications = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('verification_status', ['pending', 'approved', 'rejected'])
        .order('created_at', { ascending: false })

      if (error) throw error
      setVerifications(data || [])
    } catch (error) {
      console.error('Error fetching verifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          verification_status: 'approved',
          is_verified_seller: true,
          verification_rejection_reason: null,
        })
        .eq('id', userId)

      if (error) throw error
      fetchVerifications()
    } catch (error) {
      console.error('Error approving verification:', error)
    }
  }

  const handleReject = async () => {
    if (!selectedVerification || !rejectionReason) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          verification_status: 'rejected',
          is_verified_seller: false,
          verification_rejection_reason: rejectionReason,
        })
        .eq('id', selectedVerification.id)

      if (error) throw error
      setIsRejectDialogOpen(false)
      setRejectionReason('')
      setSelectedVerification(null)
      fetchVerifications()
    } catch (error) {
      console.error('Error rejecting verification:', error)
    }
  }

  const filteredVerifications = verifications.filter((v) =>
    v.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const pendingCount = verifications.filter((v) => v.verification_status === 'pending').length

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Seller Verifications</h1>
        <p className="text-muted-foreground">Review and manage seller verification requests</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {verifications.filter((v) => v.verification_status === 'approved').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {verifications.filter((v) => v.verification_status === 'rejected').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Verification Requests</CardTitle>
              <CardDescription>Total: {filteredVerifications.length} requests</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredVerifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No verification requests found</div>
          ) : (
            <div className="space-y-4">
              {filteredVerifications.map((verification) => (
                <div
                  key={verification.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <Shield className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{verification.full_name || 'Unknown'}</h3>
                      <p className="text-sm text-muted-foreground">{verification.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">{verification.location || 'No location'}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          verification.verification_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          verification.verification_status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {verification.verification_status}
                        </span>
                        {verification.verification_rejection_reason && (
                          <span className="text-xs text-muted-foreground">
                            Reason: {verification.verification_rejection_reason}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {verification.verification_status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(verification.verification_document, '_blank')}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          View Document
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(verification.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setSelectedVerification(verification)}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Reject Verification</DialogTitle>
                              <DialogDescription>
                                Please provide a reason for rejecting this verification request.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="rejection_reason">Rejection Reason</Label>
                                <Input
                                  id="rejection_reason"
                                  value={rejectionReason}
                                  onChange={(e) => setRejectionReason(e.target.value)}
                                  placeholder="e.g., Document is unclear or invalid"
                                  required
                                />
                              </div>
                              <div className="flex gap-2 justify-end">
                                <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button variant="destructive" onClick={handleReject}>
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
                    {verification.verification_status === 'approved' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          supabase.from('profiles').update({ 
                            verification_status: 'none',
                            is_verified_seller: false 
                          }).eq('id', verification.id).then(() => fetchVerifications())
                        }}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
