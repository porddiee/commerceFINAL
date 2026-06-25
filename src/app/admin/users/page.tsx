'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { 
  Search, 
  Shield, 
  User, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Phone, 
  MapPin, 
  Calendar, 
  AlertCircle, 
  Users, 
  Mail, 
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Ban,
  Clock,
  UserCheck
} from 'lucide-react'

export default function AdminUsersPage() {
  const supabase = createClient()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  
  // Filter states
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'unverified' | 'pending'>('all')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleVerification = async (userId: string, currentStatus: boolean) => {
    try {
      // If verifying, we also update verification_status to 'approved', otherwise back to 'none'
      const updates: any = { is_verified_seller: !currentStatus }
      if (!currentStatus) {
        updates.verification_status = 'approved'
      } else {
        updates.verification_status = 'none'
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)

      if (error) throw error
      
      // Update local state
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u))
      
      if (selectedUser?.id === userId) {
        setSelectedUser(prev => ({ ...prev, ...updates }))
      }
    } catch (error) {
      console.error('Error updating verification status:', error)
    }
  }

  const handleUserClick = (user: any) => {
    setSelectedUser(user)
    setShowDetailModal(true)
  }

  const getVerificationRequirements = (user: any) => {
    return [
      { key: 'full_name', label: 'Full Name', value: user.full_name, icon: User },
      { key: 'email', label: 'Email', value: user.email, icon: Mail },
      { key: 'phone', label: 'Phone Number', value: user.phone_verified ? user.phone : null, icon: Phone, subtitle: user.phone_verified ? 'Verified Phone' : (user.phone ? 'Phone Unverified' : 'Not provided') },
      { key: 'location', label: 'Location', value: user.location, icon: MapPin },
      { key: 'verification_document', label: 'ID/Verification Document', value: user.verification_document, icon: FileText },
    ]
  }

  const canVerify = (user: any) => {
    // Basic verification requirements check (has name, email, and at least some info)
    return !!(user.full_name && user.email)
  }

  // Derived Stats
  const stats = useMemo(() => {
    const total = users.length
    const verified = users.filter(u => u.is_verified_seller).length
    const pending = users.filter(u => u.verification_status === 'pending').length
    const admins = users.filter(u => u.role === 'admin').length
    return { total, verified, pending, admins }
  }, [users])

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = 
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      
      let matchesStatus = true
      if (statusFilter === 'verified') matchesStatus = !!user.is_verified_seller
      else if (statusFilter === 'unverified') matchesStatus = !user.is_verified_seller
      else if (statusFilter === 'pending') matchesStatus = user.verification_status === 'pending'

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, searchQuery, roleFilter, statusFilter])

  // Avatar generator helper
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
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-0.5">Administration</p>
              <h1 className="text-2xl font-extrabold text-white tracking-tight leading-tight">
                Manage Users
              </h1>
              <p className="text-xs font-semibold text-indigo-200/80 mt-0.5">
                Monitor system members, inspect seller applications, verify credentials, and change user roles
              </p>
            </div>
          </div>
          
          {/* Quick stats badges in header */}
          <div className="flex flex-wrap gap-2.5 md:flex-shrink-0">
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 px-3 py-1.5 rounded-xl text-center">
              <p className="text-[9px] uppercase font-bold text-indigo-200 tracking-wider">Total Users</p>
              <p className="text-sm font-black text-white">{stats.total}</p>
            </div>
            <div className="bg-emerald-500/15 backdrop-blur-sm border border-emerald-500/30 px-3 py-1.5 rounded-xl text-center">
              <p className="text-[9px] uppercase font-bold text-emerald-300 tracking-wider">Verified Sellers</p>
              <p className="text-sm font-black text-emerald-400">{stats.verified}</p>
            </div>
            <div className="bg-amber-500/15 backdrop-blur-sm border border-amber-500/30 px-3 py-1.5 rounded-xl text-center">
              <p className="text-[9px] uppercase font-bold text-amber-300 tracking-wider">Pending Review</p>
              <p className="text-sm font-black text-amber-400">{stats.pending}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Filters Panel Sidebar */}
        <div className="space-y-4">
          <Card className="border-slate-200/80 dark:border-slate-800/40 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-slate-500" />
                <CardTitle className="text-sm font-bold text-slate-800 dark:text-white">Filters & Controls</CardTitle>
              </div>
              <CardDescription>Refine the user database log</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Role filter options */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Account Role</label>
                <div className="flex flex-col gap-1.5">
                  {(['all', 'admin', 'user'] as const).map(role => (
                    <button
                      key={role}
                      onClick={() => setRoleFilter(role)}
                      className={`text-left text-xs px-3 py-2 rounded-xl font-semibold border transition-all ${
                        roleFilter === role 
                          ? 'bg-indigo-600 border-indigo-600 text-white font-bold shadow-sm'
                          : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {role === 'all' ? 'All Roles' : role.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Seller Status</label>
                <div className="flex flex-col gap-1.5">
                  {(['all', 'verified', 'unverified', 'pending'] as const).map(status => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`text-left text-xs px-3 py-2 rounded-xl font-semibold border transition-all ${
                        statusFilter === status 
                          ? 'bg-indigo-600 border-indigo-600 text-white font-bold shadow-sm'
                          : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {status === 'all' && 'All Statuses'}
                      {status === 'verified' && 'Verified Sellers'}
                      {status === 'unverified' && 'Unverified Accounts'}
                      {status === 'pending' && 'Pending Application'}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Listings Display Card */}
        <div className="lg:col-span-3">
          <Card className="border-slate-200/80 dark:border-slate-800/40 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-800 dark:text-white">Active Directory</CardTitle>
                  <CardDescription>Showing {filteredUsers.length} records matching criteria</CardDescription>
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
                  <p className="text-xs font-semibold text-slate-400">Loading user catalog...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-slate-100 dark:border-slate-800/60 rounded-2xl mx-6 mb-6">
                  <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No users match query</p>
                  <p className="text-xs text-slate-400 mt-1">Try resetting filters or searching with alternative spellings</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800/40 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                        <th className="px-4 py-3">User Profile</th>
                        <th className="px-4 py-3 hidden sm:table-cell">Account Role</th>
                        <th className="px-4 py-3">Seller Verification</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/20">
                      {filteredUsers.map((user) => (
                        <tr 
                          key={user.id} 
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/10 cursor-pointer transition-colors group"
                          onClick={() => handleUserClick(user)}
                        >
                          {/* Name & Avatar */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-xs shadow-md border border-white/20 relative overflow-hidden">
                                {user.avatar_url ? (
                                  <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  getAvatarInitials(user.full_name, user.email)
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-slate-800 dark:text-white truncate group-hover:text-indigo-600 transition-colors">
                                  {user.full_name || 'Anonymous User'}
                                </h4>
                                <p className="text-[10px] text-slate-400 truncate mt-0.5">{user.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="px-4 py-3.5 hidden sm:table-cell">
                            <Badge className={`${user.role === 'admin' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'} text-[10px] font-black rounded-lg border-0 shadow-none`}>
                              {user.role?.toUpperCase()}
                            </Badge>
                          </td>

                          {/* Status Badge */}
                          <td className="px-4 py-3.5">
                            <div className="flex flex-wrap gap-1.5">
                              {user.is_verified_seller ? (
                                <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15 border-0 shadow-none flex items-center gap-1 text-[10px] font-bold">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Verified
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-slate-200 text-slate-400 hover:bg-slate-50 text-[10px] font-medium">
                                  Unverified
                                </Badge>
                              )}

                              {user.verification_status === 'pending' && (
                                <Badge className="bg-amber-500/10 text-amber-600 border-0 shadow-none flex items-center gap-1 text-[10px] font-bold animate-pulse">
                                  <Clock className="h-3 w-3" />
                                  Needs Review
                                </Badge>
                              )}
                            </div>
                          </td>

                          {/* Action Button */}
                          <td className="px-4 py-3.5 text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 rounded-lg text-slate-400 hover:text-indigo-600 group-hover:bg-indigo-50/50 hover:bg-indigo-50/50 px-2"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleUserClick(user)
                              }}
                            >
                              <span className="text-[11px] font-bold">Details</span>
                              <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                            </Button>
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

      {/* User Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border-slate-200 dark:border-slate-800 p-0 shadow-2xl">
          {selectedUser && (
            <div className="flex flex-col">
              {/* Modal Banner Header */}
              <div className="relative overflow-hidden p-6 bg-gradient-to-r from-indigo-700 to-indigo-900 border-b border-indigo-900/50">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 text-white font-black text-lg backdrop-blur-sm overflow-hidden">
                    {selectedUser.avatar_url ? (
                      <img src={selectedUser.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      getAvatarInitials(selectedUser.full_name, selectedUser.email)
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-white">{selectedUser.full_name || 'Anonymous User'}</h2>
                    <p className="text-xs font-semibold text-indigo-200/90">{selectedUser.email}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                
                {/* Details grid layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Basic Metadata */}
                  <Card className="border-slate-100 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-900/10">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <User className="h-4 w-4" />
                        Account Properties
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-3">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">Unique Identifier</span>
                        <span className="text-xs font-mono font-semibold break-all text-slate-700 dark:text-slate-300">{selectedUser.id}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">Current Role</span>
                          <Badge className={`${selectedUser.role === 'admin' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'} text-[10px] mt-0.5 border-0`}>
                            {selectedUser.role}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">Joined Platform</span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mt-0.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {new Date(selectedUser.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Verification Status */}
                  <Card className={`border-2 ${
                    selectedUser.is_verified_seller 
                      ? 'border-emerald-100 bg-emerald-50/20 dark:border-emerald-950/20' 
                      : 'border-slate-100 bg-slate-50/50 dark:border-slate-800/40'
                  }`}>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Shield className="h-4 w-4" />
                        Status Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-3">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">Seller Status</span>
                        <div className="flex items-center gap-2 mt-1">
                          {selectedUser.is_verified_seller ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-0 flex items-center gap-1 text-xs font-bold">
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              Fully Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs border-slate-300 text-slate-400">
                              Unverified Accounts
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {selectedUser.verification_status && (
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">Verification Stage</span>
                          <Badge variant="outline" className={`mt-0.5 text-[10px] font-bold ${
                            selectedUser.verification_status === 'approved' ? 'border-emerald-400 text-emerald-500' :
                            selectedUser.verification_status === 'pending' ? 'border-amber-400 text-amber-500 animate-pulse' :
                            'border-red-400 text-red-500'
                          }`}>
                            {selectedUser.verification_status.toUpperCase()}
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                </div>

                {/* Verification Requirements Checklists */}
                <div className="space-y-2">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Verification Credentials</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {getVerificationRequirements(selectedUser).map((req) => {
                      const Icon = req.icon
                      const isMet = !!req.value
                      const bgClass = isMet 
                        ? 'border-emerald-100 bg-emerald-50/20 dark:border-emerald-950/20'
                        : 'border-slate-100 bg-slate-50/50 dark:border-slate-800/40'
                      const statusColor = isMet ? 'text-emerald-500' : 'text-slate-300'
                      
                      return (
                        <div key={req.key} className={`flex items-start gap-3 p-3 rounded-2xl border transition-all ${bgClass}`}>
                          <div className="mt-0.5">
                            {isMet ? (
                              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                            ) : (
                              <XCircle className="h-4.5 w-4.5 text-slate-300" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <Icon className="h-4 w-4 text-slate-400" />
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{req.label}</span>
                            </div>
                            {req.key === 'verification_document' && req.value ? (
                              <div className="mt-2 p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3">
                                <span className="text-[10px] font-semibold text-slate-400 truncate max-w-[150px]">Verification Document</span>
                                <Button asChild size="sm" variant="outline" className="h-7 px-2.5 rounded-lg text-[10px] font-bold border-indigo-100 text-indigo-600 hover:bg-indigo-50">
                                  <a href={req.value} target="_blank" rel="noopener noreferrer">View Document</a>
                                </Button>
                              </div>
                            ) : (
                              <p className="text-[11px] text-slate-500 truncate mt-1">
                                {req.subtitle || req.value || 'Not provided'}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Rejection / Warning Info */}
                {selectedUser.verification_rejection_reason && (
                  <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-red-800 dark:text-red-300">Previous Application Rejected</p>
                      <p className="text-[11px] text-red-700 dark:text-red-400 mt-0.5 leading-relaxed">{selectedUser.verification_rejection_reason}</p>
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Actions Footer */}
              <DialogFooter className="p-6 border-t border-slate-100 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-950/20 rounded-b-3xl gap-2 flex-col sm:flex-row">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="rounded-xl border-slate-200 text-xs font-semibold px-4 h-10 w-full sm:w-auto"
                  onClick={() => setShowDetailModal(false)}
                >
                  Close Detail
                </Button>
                
                <Button
                  onClick={() => toggleVerification(selectedUser.id, selectedUser.is_verified_seller)}
                  disabled={!canVerify(selectedUser) && !selectedUser.is_verified_seller}
                  className={`rounded-xl px-5 h-10 w-full sm:w-auto text-white font-bold transition-all shadow-md active:scale-98 ${
                    selectedUser.is_verified_seller
                      ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600'
                      : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700'
                  }`}
                >
                  {selectedUser.is_verified_seller ? (
                    <>
                      <Ban className="h-4 w-4 mr-1.5" />
                      Revoke Seller Status
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 mr-1.5" />
                      Verify Seller Status
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
