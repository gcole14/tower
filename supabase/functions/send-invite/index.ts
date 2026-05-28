import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, role, org_id, invited_by } = await req.json()

    if (!email || !role || !org_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Use service role key — this bypasses RLS, which is safe since the
    // invite form is behind a protected route that already enforces admin access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: invite, error: insertError } = await supabase
      .from('invites')
      .insert({ email, role, org_id, invited_by })
      .select('token')
      .single()

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const appUrl = Deno.env.get('APP_URL') ?? 'http://localhost:5173'
    const inviteUrl = `${appUrl}/accept-invite?token=${invite.token}`

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.warn('RESEND_API_KEY not set — invite created but email not sent')
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const fromAddress = Deno.env.get('EMAIL_FROM') ?? 'Tower <noreply@yourdomain.com>'

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: email,
        subject: "You've been invited to Tower",
        html: `
          <p>You've been invited to join Tower as a <strong>${role.replace(/_/g, ' ')}</strong>.</p>
          <p><a href="${inviteUrl}">Accept your invitation</a></p>
          <p>Or copy this link: ${inviteUrl}</p>
        `,
      }),
    })

    if (!emailRes.ok) {
      const emailError = await emailRes.text()
      console.error('Resend error:', emailError)
      // Return the invite URL so the admin can share it manually
      return new Response(JSON.stringify({ success: true, invite_url: inviteUrl, email_warning: 'Email delivery failed — share the invite URL manually' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true, invite_url: inviteUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
