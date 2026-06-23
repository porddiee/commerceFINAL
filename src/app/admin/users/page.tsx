'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { Search, Shield, User, CheckCircle, XCircle, FileText, Phone, MapPin, Calendar, AlertCircle } from 'lucide-react'

export default function AdminUsersPage() {
  const supabase = createClient()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

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
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified_seller: !currentStatus })
        .eq('id', userId)

      if (error) throw error
      fetchUsers()
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, is_verified_seller: !currentStatus })
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
    const requirements = [
      { key: 'full_name', label: 'Full Name', value: user.full_name, icon: User },
      { key: 'email', label: 'Email', value: user.email, icon: FileText },
      { key: 'phone', label: 'Phone Number', value: user.phone, icon: Phone },
      { key: 'location', label: 'Location', value: user.location, icon: MapPin },
      { key: 'verification_document', label: 'Verification Document', value: user.verification_document, icon: FileText },
    ]
    return requirements
  }

  const canVerify = (user: any) => {
    const requirements = getVerificationRequirements(user)
    return requirements.every(req => req.value)
  }

  const filteredUsers = users.filter((user) => {
    return (
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">Manage Users</h1>
        <p className="text-muted-foreground">View and manage platform users</p>
      </div>

      <Card className="backdrop-blur-sm bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-2 border-transparent hover:border-primary/20 transition-all duration-200 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">Users</CardTitle>
              <CardDescription>Total: {filteredUsers.length} users</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64 border-2 border-purple-200 dark:border-purple-800 focus:border-purple-500 dark:focus:border-purple-500 transition-all duration-200"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 border-t-2 border-blue-500"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No users found</div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleUserClick(user)}
                  className="flex items-center justify-between p-4 border-2 border-transparent hover:border-primary/20 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 cursor-pointer transition-all duration-200 hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{user.full_name || 'Unknown'}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`${user.role === 'admin' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gradient-to-r from-gray-500 to-gray-600'} text-white`}>
                          {user.role}
                        </Badge>
                        {user.is_verified_seller ? (
                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-orange-500 text-orange-600 dark:text-orange-400">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Unverified
                          </Badge>
                        )}
                        {user.verification_status === 'pending' && (
                          <Badge variant="outline" className="border-yellow-500 text-yellow-600 dark:text-yellow-400">
                            Pending Review
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 text-2xl">
                  User Details
                </DialogTitle>
                <DialogDescription>
                  Review user information and verification status
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Basic Info */}
                <Card className="backdrop-blur-sm bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-2 border-transparent">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Full Name</p>
                        <p className="font-medium">{selectedUser.full_name || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{selectedUser.email || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Role</p>
                        <Badge className={`${selectedUser.role === 'admin' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gradient-to-r from-gray-500 to-gray-600'} text-white`}>
                          {selectedUser.role}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Member Since</p>
                        <p className="font-medium flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(selectedUser.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Verification Requirements */}
                <Card className="backdrop-blur-sm bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-2 border-transparent">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Verification Requirements
                    </CardTitle>
                    <CardDescription>
                      All requirements must be met for seller verification
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {getVerificationRequirements(selectedUser).map((req) => {
                        const Icon = req.icon
                        const isMet = !!req.value
                        const bgClass = isMet 
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-300 dark:border-green-700'
                          : 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-300 dark:border-red-700'
                        const iconBgClass = isMet ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-red-500 to-orange-500'
                        const iconTextClass = isMet ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        
                        return (
                          <div key={req.key} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 ${bgClass}`}>
                            <div className={`p-2 rounded-full ${iconBgClass}`}>
                              {isMet ? <CheckCircle className="h-4 w-4 text-white" /> : <XCircle className="h-4 w-4 text-white" />}
                            </div>
                            <Icon className={`h-5 w-5 ${iconTextClass}`} />
                            <div className="flex-1">
                              <p className="font-medium">{req.label}</p>
                              <p className="text-sm text-muted-foreground">{req.value || 'Not provided'}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Verification Status */}
                <Card className={`backdrop-blur-sm bg-gradient-to-br ${
                  selectedUser.is_verified_seller 
                    ? 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-300 dark:border-green-700'
                    : 'from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border-orange-300 dark:border-orange-700'
                } border-2`}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {selectedUser.is_verified_seller ? (
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      )}
                      Verification Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Current Status</p>
                          <p className="font-semibold text-lg">
                            {selectedUser.is_verified_seller ? 'Verified Seller' : 'Unverified'}
                          </p>
                        </div>
                        {selectedUser.verification_status && (
                          <div>
                            <p className="text-sm text-muted-foreground">Review Status</p>
                            <Badge variant="outline" className={
                              selectedUser.verification_status === 'approved' ? 'border-green-500 text-green-600' :
                              selectedUser.verification_status === 'rejected' ? 'border-red-500 text-red-600' :
                              'border-yellow-500 text-yellow-600'
                            }>
                              {selectedUser.verification_status.charAt(0).toUpperCase() + selectedUser.verification_status.slice(1)}
                            </Badge>
                          </div>
                        )}
                      </div>
                      {selectedUser.verification_rejection_reason && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border-2 border-red-200 dark:border-red-800">
                          <p className="text-sm text-muted-foreground">Rejection Reason</p>
                          <p className="text-sm text-red-600 dark:text-red-400">{selectedUser.verification_rejection_reason}</p>
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => toggleVerification(selectedUser.id, selectedUser.is_verified_seller)}
                          disabled={!canVerify(selectedUser) && !selectedUser.is_verified_seller}
                          className={`${
                            selectedUser.is_verified_seller
                              ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600'
                              : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                          } text-white shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] rounded-full disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {selectedUser.is_verified_seller ? 'Revoke Verification' : 'Verify as Seller'}
                        </Button>
                        {!canVerify(selectedUser) && !selectedUser.is_verified_seller && (
                          <p className="text-sm text-orange-600 dark:text-orange-400 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            Complete all requirements first
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
