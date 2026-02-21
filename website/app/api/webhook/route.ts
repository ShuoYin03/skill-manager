import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Use service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const userId = session.metadata?.supabase_user_id
    const email = session.metadata?.email ?? session.customer_email ?? ''

    if (userId) {
      await supabaseAdmin.from('licenses').insert({
        user_id: userId,
        email,
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
        amount_paid: session.amount_total ?? 0,
        status: 'active',
      })
    }
  }

  return NextResponse.json({ received: true })
}
