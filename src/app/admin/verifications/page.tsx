'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  FileText, 
  MapPin, 
  Calendar,
  User,
  SlidersHorizontal,
  ChevronRight,
  UserCheck,
  Eye,
  AlertCircle
} from 'lucide-react'

export default function AdminVerificationsPage() {
  const supabase = createClient()
  const [verifications, setVerifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedVerification, setSelectedVerification] = useState<any>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

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
      
      // Update local state directly
      setVerifications(prev => prev.map(v => v.id === userId ? {
        ...v,
        verification_status: 'approved',
        is_verified_seller: true,
        verification_rejection_reason: null
      } : v))
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
      
      // Update local state directly
      setVerifications(prev => prev.map(v => v.id === selectedVerification.id ? {
        ...v,
        verification_status: 'rejected',
        is_verified_seller: false,
        verification_rejection_reason: rejectionReason
      } : v))
      
      setIsRejectDialogOpen(false)
      setRejectionReason('')
      setSelectedVerification(null)
    } catch (error) {
      console.error('Error rejecting verification:', error)
    }
  }

  const handleRevoke = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          verification_status: 'none',
          is_verified_seller: false 
        })
        .eq('id', userId)

      if (error) throw error
      
      // Remove from list or update local state
      setVerifications(prev => prev.map(v => v.id === userId ? {
        ...v,
        verification_status: 'none',
        is_verified_seller: false
      } : v).filter(v => v.verification_status !== 'none'))
    } catch (error) {
      console.error('Error revoking verification:', error)
    }
  }

  // Filtered Results
  const filteredVerifications = useMemo(() => {
    return verifications.filter((v) => {
      const matchesSearch = 
        v.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || v.verification_status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [verifications, searchQuery, statusFilter])

  // Count states
  const counts = useMemo(() => {
    const pending = verifications.filter((v) => v.verification_status === 'pending').length
    const approved = verifications.filter((v) => v.verification_status === 'approved').length
    const rejected = verifications.filter((v) => v.verification_status === 'rejected').length
    return { pending, approved, rejected }
  }, [verifications])

  const getAvatarInitials = (name: string, email: string) => {
    if (name) {
      const parts = name.split(' ')
      if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase()
      return parts[0].substring(0, 2).toUpperCase()
    }
    if (email) return email.substring(0, 2).toUpperCase()
    return 'US'
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner — unified gradient banner */}
      <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-800 shadow-lg shadow-indigo-500/10 border border-indigo-500/20">
        <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-0.5">Seller Hub Operations</p>
              <h1 className="text-2xl font-extrabold text-white tracking-tight leading-tight">
                Seller Verifications
              </h1>
              <p className="text-xs font-semibold text-indigo-200/80 mt-0.5">
                Review documents, approve merchant badges, or reject invalid applications
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mini Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pending */}
        <Card className="hover:shadow-md transition-shadow border-slate-200/80 dark:border-slate-800/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Awaiting Decision</CardTitle>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-800 dark:text-white">{counts.pending}</div>
            <p className="text-[10px] text-slate-400 mt-1 font-semibold">Active seller requests</p>
          </CardContent>
        </Card>

        {/* Approved */}
        <Card className="hover:shadow-md transition-shadow border-slate-200/80 dark:border-slate-800/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Approved Merchants</CardTitle>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-800 dark:text-white">{counts.approved}</div>
            <p className="text-[10px] text-slate-400 mt-1 font-semibold">Badges distributed</p>
          </CardContent>
        </Card>

        {/* Rejected */}
        <Card className="hover:shadow-md transition-shadow border-slate-200/80 dark:border-slate-800/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/5 rounded-full blur-xl pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Declined Requests</CardTitle>
            <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center">
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-800 dark:text-white">{counts.rejected}</div>
            <p className="text-[10px] text-slate-400 mt-1 font-semibold">Denied applications</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Filters Sidebar */}
        <div className="space-y-4">
          <Card className="border-slate-200/80 dark:border-slate-800/40 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-slate-500" />
                <CardTitle className="text-sm font-bold text-slate-800 dark:text-white">Filter Log</CardTitle>
              </div>
              <CardDescription>Select verification category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-1.5">
                {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`text-left text-xs px-3 py-2.5 rounded-xl font-bold border transition-all ${
                      statusFilter === status 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                        : 'border-slate-100 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {status === 'all' && 'All Applications'}
                    {status === 'pending' && `Awaiting Decision (${counts.pending})`}
                    {status === 'approved' && `Approved Merchants (${counts.approved})`}
                    {status === 'rejected' && `Declined Requests (${counts.rejected})`}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Requests Table Display */}
        <div className="lg:col-span-3">
          <Card className="border-slate-200/80 dark:border-slate-800/40 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-800 dark:text-white">Active Queue</CardTitle>
                  <CardDescription>Reviewing {filteredVerifications.length} submissions</CardDescription>
                </div>
                
                {/* Search Bar */}
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Search name, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 text-xs h-10 transition-all duration-200"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-600 border-b-2 border-indigo-300" />
                  <p className="text-xs font-semibold text-slate-400">Loading applications...</p>
                </div>
              ) : filteredVerifications.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-slate-100 dark:border-slate-800/60 rounded-2xl mx-6 mb-6">
                  <Shield className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No applications in folder</p>
                  <p className="text-xs text-slate-400 mt-1">Select alternative filters or search using other keywords</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800/40 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                        <th className="px-4 py-3">Applicant</th>
                        <th className="px-4 py-3 hidden sm:table-cell">Region / City</th>
                        <th className="px-4 py-3">Review Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/20">
                      {filteredVerifications.map((verification) => (
                        <tr key={verification.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/10 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-xs shadow-md border border-white/20 overflow-hidden">
                                {verification.avatar_url ? (
                                  <img src={verification.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  getAvatarInitials(verification.full_name, verification.email)
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-slate-800 dark:text-white truncate">
                                  {verification.full_name || 'Anonymous User'}
                                </h4>
                                <p className="text-[10px] text-slate-400 truncate mt-0.5">{verification.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3.5 hidden sm:table-cell">
                            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                              <MapPin className="h-3.5 w-3.5 text-slate-400" />
                              <span className="text-xs font-semibold">{verification.location || 'Not provided'}</span>
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="flex flex-col gap-1 items-start">
                              <Badge className={`text-[10px] font-black rounded-lg border-0 shadow-none uppercase ${
                                verification.verification_status === 'pending' ? 'bg-amber-500/10 text-amber-600 animate-pulse' :
                                verification.verification_status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' :
                                'bg-red-500/10 text-red-600'
                              }`}>
                                {verification.verification_status}
                              </Badge>
                              {verification.verification_rejection_reason && (
                                <span className="text-[9px] text-red-500 font-semibold max-w-[150px] truncate">
                                  Reason: {verification.verification_rejection_reason}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {verification.verification_status === 'pending' && (
                                <>
                                  {verification.verification_document && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 rounded-lg text-[10px] font-bold border-indigo-100 hover:bg-indigo-50 text-indigo-600"
                                      onClick={() => window.open(verification.verification_document, '_blank')}
                                    >
                                      <FileText className="h-3.5 w-3.5 mr-1" />
                                      Doc
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    className="h-8 rounded-lg text-[10px] font-bold bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white"
                                    onClick={() => handleApprove(verification.id)}
                                  >
                                    <UserCheck className="h-3.5 w-3.5 mr-1" />
                                    Verify
                                  </Button>
                                  <Dialog open={isRejectDialogOpen && selectedVerification?.id === verification.id} onOpenChange={(open) => {
                                    setIsRejectDialogOpen(open)
                                    if(!open) setSelectedVerification(null)
                                  }}>
                                    <DialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        className="h-8 rounded-lg text-[10px] font-bold"
                                        onClick={() => setSelectedVerification(verification)}
                                      >
                                        <XCircle className="h-3.5 w-3.5 mr-1" />
                                        Deny
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="rounded-3xl max-w-md">
                                      <DialogHeader>
                                        <DialogTitle className="text-lg font-black text-slate-800">Decline Application</DialogTitle>
                                        <DialogDescription className="text-xs">
                                          Provide a valid explanation that will be shown to the user on their dashboard.
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-4 py-2">
                                        <div className="space-y-1.5">
                                          <Label htmlFor="rejection_reason" className="text-xs font-bold text-slate-500">Decline Reason</Label>
                                          <Input
                                            id="rejection_reason"
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            placeholder="e.g., The attached valid government ID is too blurry to read."
                                            className="rounded-xl border-slate-200 focus:border-red-500 text-xs h-10"
                                            required
                                          />
                                        </div>
                                      </div>
                                      <DialogFooter className="gap-2">
                                        <Button variant="outline" className="rounded-xl h-10 text-xs font-semibold" onClick={() => setIsRejectDialogOpen(false)}>
                                          Cancel
                                        </Button>
                                        <Button variant="destructive" className="rounded-xl h-10 text-xs font-bold" onClick={handleReject}>
                                          Confirm Rejection
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                </>
                              )}

                              {verification.verification_status === 'approved' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 rounded-lg text-[10px] font-bold border-red-200 text-red-500 hover:bg-red-50/50"
                                  onClick={() => handleRevoke(verification.id)}
                                >
                                  Revoke
                                </Button>
                              )}
                              
                              {verification.verification_status === 'rejected' && (
                                <Button
                                  size="sm"
                                  className="h-8 rounded-lg text-[10px] font-bold bg-indigo-600 text-white"
                                  onClick={() => handleApprove(verification.id)}
                                >
                                  Approve
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
