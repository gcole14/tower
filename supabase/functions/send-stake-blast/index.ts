import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InvokePayload {
  message_id?: string
  body?: string
  org_id?: string
}

// Stake-wide blast: sends to all opted-in members across every org (ward) in
// the stake. The originating org's Twilio credentials are used as the sender.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    const payload: InvokePayload = await req.json()

    let messageId: string
    let originOrgId: string
    let body: string
    let sentBy: string | null = null
    const isScheduledDispatch = !!payload.message_id

    if (isScheduledDispatch) {
      const { data: msg, error } = await supabase
        .from('messages')
        .select('id, org_id, body, sent_by')
        .eq('id', payload.message_id!)
        .single()
      if (error || !msg) return json({ error: error?.message ?? 'message not found' }, 404)
      messageId = msg.id
      originOrgId = msg.org_id
      body = msg.body
      sentBy = msg.sent_by
    } else {
      if (!payload.body || !payload.org_id) return json({ error: 'Missing required fields' }, 400)
      const authHeader = req.headers.get('Authorization')
      if (authHeader) {
        const userClient = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_ANON_KEY')!,
          { global: { headers: { Authorization: authHeader } } },
        )
        const { data: { user } } = await userClient.auth.getUser()
        sentBy = user?.id ?? null
      }
      originOrgId = payload.org_id
      body = payload.body
    }

    const { data: org, error: orgErr } = await supabase
      .from('organizations')
      .select('twilio_account_sid, twilio_auth_token, twilio_phone_number')
      .eq('id', originOrgId)
      .single()
    if (orgErr || !org?.twilio_account_sid || !org.twilio_auth_token || !org.twilio_phone_number) {
      await markFailed(supabase, payload.message_id)
      return json({ error: 'Twilio credentials not configured for origin org' }, 400)
    }

    // All opted-in members across every org
    const { data: members, error: memErr } = await supabase
      .from('members')
      .select('id, phone')
      .eq('opted_out', false)
    if (memErr) {
      await markFailed(supabase, payload.message_id)
      return json({ error: memErr.message }, 500)
    }

    if (!isScheduledDispatch) {
      const { data: inserted, error: insErr } = await supabase
        .from('messages')
        .insert({
          org_id: originOrgId,
          sent_by: sentBy,
          body,
          scope: 'stake_all',
          recipient_count: members?.length ?? 0,
          status: 'sending',
        })
        .select('id')
        .single()
      if (insErr || !inserted) return json({ error: insErr?.message ?? 'failed to create message' }, 500)
      messageId = inserted.id
    } else {
      messageId = payload.message_id!
      await supabase
        .from('messages')
        .update({ recipient_count: members?.length ?? 0 })
        .eq('id', messageId)
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${org.twilio_account_sid}/Messages.json`
    const basicAuth = btoa(`${org.twilio_account_sid}:${org.twilio_auth_token}`)

    let successCount = 0
    let failCount = 0
    const logRows: Array<{
      message_id: string
      member_id: string
      phone: string
      status: string
      twilio_sid: string | null
    }> = []

    for (const member of members ?? []) {
      try {
        const form = new URLSearchParams()
        form.set('To', member.phone)
        form.set('From', org.twilio_phone_number)
        form.set('Body', body)

        const res = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${basicAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: form.toString(),
        })

        if (res.ok) {
          const data = await res.json()
          logRows.push({
            message_id: messageId,
            member_id: member.id,
            phone: member.phone,
            status: 'sent',
            twilio_sid: data.sid ?? null,
          })
          successCount++
        } else {
          console.error('Twilio error for', member.phone, await res.text())
          logRows.push({
            message_id: messageId,
            member_id: member.id,
            phone: member.phone,
            status: 'failed',
            twilio_sid: null,
          })
          failCount++
        }
      } catch (err) {
        console.error('Twilio fetch threw for', member.phone, err)
        logRows.push({
          message_id: messageId,
          member_id: member.id,
          phone: member.phone,
          status: 'failed',
          twilio_sid: null,
        })
        failCount++
      }
    }

    if (logRows.length > 0) {
      // Chunk inserts to avoid payload size issues for big stakes
      const chunkSize = 500
      for (let i = 0; i < logRows.length; i += chunkSize) {
        await supabase.from('message_log').insert(logRows.slice(i, i + chunkSize))
      }
    }

    const finalStatus = successCount === 0 ? 'failed' : 'sent'
    await supabase.from('messages').update({ status: finalStatus }).eq('id', messageId)

    return json({ success: true, message_id: messageId, sent: successCount, failed: failCount })
  } catch (err) {
    console.error('send-stake-blast error', err)
    return json({ error: (err as Error).message }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function markFailed(
  supabase: ReturnType<typeof createClient>,
  messageId: string | undefined,
) {
  if (!messageId) return
  await supabase.from('messages').update({ status: 'failed' }).eq('id', messageId)
}
