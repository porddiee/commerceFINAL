'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuthStore } from '@/lib/store/auth'
import { Plus, Copy, Trash2, FileText } from 'lucide-react'
import Link from 'next/link'
import { categoriesService, listingTemplatesService } from '@/services'

interface ListingTemplate {
  id: string
  name: string
  title?: string
  description?: string
  category_id?: string
  condition?: string
  location?: string
  currency?: string
  buy_type?: string
  user_id: string
  created_at: string
  updated_at: string
}

interface Category {
  id: string
  name: string
  slug: string
}

export default function ListingTemplatesPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [templates, setTemplates] = useState<ListingTemplate[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ListingTemplate | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    description: '',
    category_id: '',
    condition: '',
    location: '',
    currency: 'PHP',
    buy_type: 'buy_now'
  })

  useEffect(() => {
    if (user) {
      fetchTemplates()
      fetchCategories()
    }
  }, [user])

  const fetchTemplates = async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await listingTemplatesService.getUserTemplates(user.id)
      setTemplates(data)
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    const data = await categoriesService.getAllCategories()
    setCategories(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const templateData = {
        user_id: user.id,
        ...formData,
        category_id: formData.category_id || null
      }

      if (editingTemplate) {
        await listingTemplatesService.updateTemplate(editingTemplate.id, templateData)
      } else {
        await listingTemplatesService.createTemplate(templateData)
      }

      setDialogOpen(false)
      setEditingTemplate(null)
      setFormData({
        name: '',
        title: '',
        description: '',
        category_id: '',
        condition: '',
        location: '',
        currency: 'PHP',
        buy_type: 'buy_now'
      })
      fetchTemplates()
    } catch (error) {
      console.error('Error saving template:', error)
    }
  }

  const handleEdit = (template: ListingTemplate) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      title: template.title || '',
      description: template.description || '',
      category_id: template.category_id || '',
      condition: template.condition || '',
      location: template.location || '',
      currency: template.currency || 'PHP',
      buy_type: template.buy_type || 'buy_now'
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return
    
    try {
      await listingTemplatesService.deleteTemplate(id)
      fetchTemplates()
    } catch (error) {
      console.error('Error deleting template:', error)
    }
  }

  const handleCreateFromTemplate = (template: ListingTemplate) => {
    // Store template data in localStorage to use in create listing page
    localStorage.setItem('listingTemplate', JSON.stringify(template))
    router.push('/user/products/create')
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Listing Templates</h1>
          <p className="text-muted-foreground">Save and reuse listing templates for faster creation</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingTemplate(null)
              setFormData({
                name: '',
                title: '',
                description: '',
                category_id: '',
                condition: '',
                location: '',
                currency: 'PHP',
                buy_type: 'buy_now'
              })
            }}>
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
              <DialogDescription>
                Save a template with common listing details for quick reuse
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Electronics Template"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="title">Default Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., iPhone 14 Pro Max"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Default Description</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your item..."
                    className="w-full min-h-[100px] px-3 py-2 border rounded-md"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Default Category</Label>
                    <Select value={formData.category_id} onValueChange={(v) => setFormData({ ...formData, category_id: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="condition">Default Condition</Label>
                    <Select value={formData.condition} onValueChange={(v) => setFormData({ ...formData, condition: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="like_new">Like New</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">Default Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., Surigao City"
                    />
                  </div>
                  <div>
                    <Label htmlFor="buy_type">Default Buy Type</Label>
                    <Select value={formData.buy_type} onValueChange={(v) => setFormData({ ...formData, buy_type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buy_now">Buy Now</SelectItem>
                        <SelectItem value="reserve">Reserve</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading templates...</div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No templates yet</p>
            <p className="text-sm text-muted-foreground mb-4">Create templates to save time when listing similar items</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription>
                  {template.categories?.name || 'No category'} • {template.condition || 'No condition'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {template.title && (
                    <p className="font-medium truncate">{template.title}</p>
                  )}
                  {template.description && (
                    <p className="text-muted-foreground line-clamp-2">{template.description}</p>
                  )}
                  {template.location && (
                    <p className="text-muted-foreground">📍 {template.location}</p>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleCreateFromTemplate(template)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Use Template
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(template)}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
