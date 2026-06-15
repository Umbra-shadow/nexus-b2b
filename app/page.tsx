import Link from 'next/link'
import { Search, MessageSquare, FileText, ShieldCheck, Briefcase, ArrowRight, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container-app flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-surface flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-lg font-bold">NexusB2B</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/auth/register">
              <Button size="sm">Register Business</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container-app py-24 lg:py-36 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-secondary text-muted-foreground text-xs font-medium px-3 py-1.5 rounded-full mb-8 border border-border">
            <ShieldCheck className="w-3.5 h-3.5 text-green-600" aria-hidden />
            Verified businesses only
          </div>
          <h1 className="font-display text-display text-foreground text-balance mb-6">
            Find. Connect. Deal.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10 text-balance">
            NexusB2B is the verified business discovery platform where companies find
            global partners, open AI-introduced deal sessions, and transact securely —
            all without leaving.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/auth/register">
              <Button size="lg" className="gap-2">
                Register Your Business
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="lg">Sign In</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-secondary border-y border-border py-20">
        <div className="container-app">
          <h2 className="text-heading text-center mb-12 text-foreground">
            Everything you need to do B2B, in one place
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="card-base flex flex-col gap-4">
                <div className="w-10 h-10 rounded-lg bg-brand-brown/10 flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-brand-brown" aria-hidden />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How verified badge works */}
      <section className="container-app py-20 max-w-3xl mx-auto text-center">
        <ShieldCheck className="w-12 h-12 text-green-600 mx-auto mb-6" aria-hidden />
        <h2 className="text-heading text-foreground mb-4">Only real businesses, verified</h2>
        <p className="text-muted-foreground leading-relaxed">
          Every business on NexusB2B submits a certificate of incorporation or business license.
          Our team reviews and approves each registration. The verified badge means you're
          talking to a legitimate company — no spam, no imposters.
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-background">
        <div className="container-app flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            <span className="font-display font-bold text-foreground">NexusB2B</span>
            <span>© 2026</span>
          </div>
          <div className="flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" />
            <span>The Verified B2B Exchange</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

const FEATURES = [
  {
    icon: Search,
    title: 'AI-Powered Discovery',
    description:
      'Search in plain language. Our AI finds the right businesses globally by industry, country, and specialty.',
  },
  {
    icon: MessageSquare,
    title: 'AI-Introduced Sessions',
    description:
      'An AI introduces both parties, then steps back. Your private conversation stays yours alone.',
  },
  {
    icon: ShieldCheck,
    title: 'Verified Businesses Only',
    description:
      'Every company is identity-verified before appearing in search results. No cold-call spam.',
  },
  {
    icon: FileText,
    title: 'In-Chat Receipts',
    description:
      'Create and share receipts directly inside your deal session. No switching to email or another tool.',
  },
]
