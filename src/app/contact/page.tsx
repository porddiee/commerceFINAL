'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Mail, Phone, MapPin, Send, CheckCircle, MessageCircle,
  Clock, ArrowRight, Facebook, Twitter,
} from 'lucide-react'

const CONTACT_CARDS = [
  {
    icon: Mail,
    label: 'Email Us',
    value: 'support@surimart.com',
    sub: 'We reply within 24 hours',
    href: 'mailto:support@surimart.com',
    color: 'from-indigo-500 to-blue-600',
  },
  {
    icon: Phone,
    label: 'Call Us',
    value: '+63 (0) 912 345 6789',
    sub: 'Mon – Fri, 8 AM – 6 PM',
    href: 'tel:+639123456789',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: MapPin,
    label: 'Find Us',
    value: 'Surigao City, Philippines',
    sub: 'Surigao del Norte',
    href: 'https://maps.google.com/?q=Surigao+City+Philippines',
    color: 'from-violet-500 to-purple-600',
  },
]

const TOPICS = [
  'General Inquiry',
  'Report a Listing',
  'Seller Verification',
  'Account Issue',
  'Partnership',
  'Other',
]

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', topic: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Simulate send
    await new Promise((r) => setTimeout(r, 1200))
    setLoading(false)
    setSubmitted(true)
  }

  return (
    <div className="flex-1 space-y-0">
      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-blue-900 text-white py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-10 left-10 w-80 h-80 bg-indigo-500 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-500 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        <div className="container mx-auto max-w-3xl text-center relative z-10 space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider text-indigo-200 border border-white/10">
            <MessageCircle className="w-3.5 h-3.5 text-indigo-300" />
            We're here to help
          </div>
          <h1 className="text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            Get in{' '}
            <span className="bg-gradient-to-r from-blue-300 via-indigo-200 to-white bg-clip-text text-transparent">
              Touch
            </span>
          </h1>
          <p className="text-lg text-indigo-100/90 max-w-xl mx-auto leading-relaxed font-medium">
            Have a question, found an issue, or want to partner with us? We'd love to hear from you.
          </p>
        </div>
      </section>

      {/* ── Contact Cards ── */}
      <section className="py-14 px-4 bg-white dark:bg-slate-950">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {CONTACT_CARDS.map(({ icon: Icon, label, value, sub, href, color }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith('http') ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-card p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-4"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
                  <p className="font-bold text-slate-900 dark:text-white text-sm leading-snug">{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    {sub}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-auto group-hover:gap-2 transition-all">
                  {href.startsWith('mailto') ? 'Send email' : href.startsWith('tel') ? 'Call now' : 'View map'}
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Form + FAQ ── */}
      <section className="py-14 px-4 bg-slate-50 dark:bg-slate-900/30">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-5 gap-8">
            {/* Form — takes 3 cols */}
            <div className="md:col-span-3">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-8 shadow-sm">
                {submitted ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4 text-center animate-fade-in">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
                      <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Message Sent!</h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      Thanks for reaching out, <strong>{formData.name}</strong>. We'll get back to you at <strong>{formData.email}</strong> within 24 hours.
                    </p>
                    <button
                      onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', topic: '', message: '' }) }}
                      className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Send us a message</h2>
                      <p className="text-sm text-muted-foreground mt-1">We'll get back to you as soon as possible.</p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">Your Name</Label>
                          <Input
                            id="name" placeholder="Juan dela Cruz" required
                            value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="h-11 rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</Label>
                          <Input
                            id="email" type="email" placeholder="juan@email.com" required
                            value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="h-11 rounded-xl border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all"
                          />
                        </div>
                      </div>

                      {/* Topic picker */}
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Topic</Label>
                        <div className="flex flex-wrap gap-2">
                          {TOPICS.map((topic) => (
                            <button
                              key={topic}
                              type="button"
                              onClick={() => setFormData({ ...formData, topic })}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150 ${
                                formData.topic === topic
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600'
                              }`}
                            >
                              {topic}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="message" className="text-sm font-medium text-slate-700 dark:text-slate-300">Message</Label>
                        <textarea
                          id="message"
                          placeholder="Describe your question or issue in detail…"
                          required
                          rows={5}
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          className="w-full px-3.5 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-background text-sm resize-none focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-muted-foreground"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] gap-2"
                      >
                        {loading ? (
                          <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending…</>
                        ) : (
                          <><Send className="h-4 w-4" />Send Message</>
                        )}
                      </Button>
                    </form>
                  </>
                )}
              </div>
            </div>

            {/* Right sidebar — 2 cols */}
            <div className="md:col-span-2 space-y-5">
              {/* Response time */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-sm">
                <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-sm">Response Times</h3>
                <div className="space-y-3">
                  {[
                    { channel: 'Email', time: '≤ 24 hours', dot: 'bg-emerald-400' },
                    { channel: 'Phone', time: 'Mon–Fri, 8 AM–6 PM', dot: 'bg-blue-400' },
                    { channel: 'In-app Report', time: '≤ 48 hours', dot: 'bg-amber-400' },
                  ].map(({ channel, time, dot }) => (
                    <div key={channel} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${dot}`} />
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{channel}</span>
                      </div>
                      <span className="text-muted-foreground text-xs">{time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQ quick links */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-sm">
                <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-sm">Quick Answers</h3>
                <div className="space-y-2">
                  {[
                    'How do I become a verified seller?',
                    'How do I report a suspicious listing?',
                    'Can I change my username?',
                    'How does payment work?',
                  ].map((q) => (
                    <button
                      key={q}
                      className="w-full text-left text-xs text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-start gap-2 group transition-colors py-1"
                    >
                      <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Social */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-sm">
                <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-sm">Follow Us</h3>
                <div className="flex gap-2">
                  {[
                    { icon: Facebook, label: 'Facebook', color: 'hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400' },
                    { icon: Twitter, label: 'Twitter', color: 'hover:bg-sky-50 dark:hover:bg-sky-950/30 hover:text-sky-500 dark:hover:text-sky-400' },
                    { icon: Mail, label: 'Email', color: 'hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 dark:hover:text-indigo-400' },
                  ].map(({ icon: Icon, label, color }) => (
                    <button
                      key={label}
                      title={label}
                      className={`w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-muted-foreground transition-colors duration-150 ${color}`}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Map-style CTA ── */}
      <section className="py-16 px-4 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
        <div className="container mx-auto max-w-4xl">
          <div className="rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-800 to-blue-900 text-white p-10 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="absolute -top-10 -right-10 w-60 h-60 bg-indigo-400 rounded-full blur-3xl" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold">Visit our community</h2>
                <p className="text-indigo-200 text-sm max-w-sm">
                  Based in Surigao City. Find us online or reach out — we're always happy to help local sellers and buyers.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 flex-shrink-0">
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-indigo-700 font-bold text-sm hover:bg-indigo-50 transition-all duration-200 shadow-lg"
                >
                  About SuriMart
                </Link>
                <Link
                  href="/browse"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 border border-white/20 text-white font-bold text-sm hover:bg-white/20 transition-all duration-200 backdrop-blur-md"
                >
                  Browse Products
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
