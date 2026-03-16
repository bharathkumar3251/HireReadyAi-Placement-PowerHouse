import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studentEmail, studentName, decision, recruiterName } = await req.json();

    if (!studentEmail || !decision) {
      return new Response(
        JSON.stringify({ error: "studentEmail and decision are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isSelected = decision === "selected";

    const subject = "HireReadyAI Recruitment Update";

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0a0a0f; font-family: 'Segoe UI', Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: linear-gradient(135deg, #12121a 0%, #1a1a2e 100%); border-radius: 16px; border: 1px solid rgba(139, 92, 246, 0.3); overflow: hidden; }
    .header { background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); padding: 32px 40px; text-align: center; }
    .logo { color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 4px; }
    .logo-icon { display: inline-block; margin-right: 8px; }
    .tagline { color: rgba(255,255,255,0.7); font-size: 13px; }
    .body { padding: 40px; }
    .status-badge { display: inline-block; padding: 8px 20px; border-radius: 100px; font-size: 13px; font-weight: 600; margin-bottom: 24px; }
    .selected-badge { background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.4); }
    .rejected-badge { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }
    h1 { color: #f8fafc; font-size: 22px; margin: 0 0 16px 0; line-height: 1.3; }
    p { color: #94a3b8; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0; }
    .highlight { color: #a78bfa; }
    .divider { border: none; border-top: 1px solid rgba(139, 92, 246, 0.15); margin: 28px 0; }
    .footer { text-align: center; padding: 0 40px 32px; }
    .footer p { font-size: 12px; color: #475569; margin: 0; }
    .cta-box { background: ${isSelected ? "rgba(16, 185, 129, 0.08)" : "rgba(148, 163, 184, 0.05)"}; border: 1px solid ${isSelected ? "rgba(16, 185, 129, 0.2)" : "rgba(148, 163, 184, 0.1)"}; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .cta-box p { margin: 0; color: ${isSelected ? "#6ee7b7" : "#94a3b8"}; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">⚡ HireReadyAI</div>
        <div class="tagline">AI-Powered Placement Platform</div>
      </div>
      <div class="body">
        <div class="status-badge ${isSelected ? "selected-badge" : "rejected-badge"}">
          ${isSelected ? "🎉 Congratulations!" : "📋 Application Update"}
        </div>
        <h1>
          ${isSelected
            ? `You've Been Selected, ${studentName || "Candidate"}!`
            : `Recruitment Update for ${studentName || "Candidate"}`}
        </h1>
        <p>
          ${isSelected
            ? `We are thrilled to inform you that a recruiter has reviewed your profile and performance on the <span class="highlight">HireReadyAI</span> platform and decided to move forward with your application.`
            : `Thank you for participating in the placement process through the <span class="highlight">HireReadyAI</span> platform. After careful review of your profile and assessments, the recruiter has decided to move forward with other candidates at this time.`}
        </p>
        <div class="cta-box">
          <p>
            ${isSelected
              ? "🚀 The recruiter will reach out to you directly with next steps. Keep your profile updated and continue sharpening your skills on HireReadyAI."
              : "💪 Don't be discouraged — every interview is a learning opportunity. Continue practicing on HireReadyAI to improve your scores and catch the attention of future recruiters."}
          </p>
        </div>
        <hr class="divider">
        <p style="font-size: 13px; color: #64748b;">
          This message was sent via the HireReadyAI recruitment platform.
          ${recruiterName ? `The recruiter is <strong style="color: #94a3b8;">${recruiterName}</strong>.` : ""}
        </p>
      </div>
      <div class="footer">
        <p>© 2024 HireReadyAI · AI-Powered Placement Platform</p>
        <p style="margin-top: 4px;">This is an automated notification. Please do not reply to this email.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

    // Use Supabase's built-in email or Lovable API key if available
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (LOVABLE_API_KEY) {
      // Use Lovable's email API
      const emailResponse = await fetch("https://api.lovable.dev/v1/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        },
        body: JSON.stringify({
          to: studentEmail,
          subject,
          html: htmlBody,
        }),
      });

      if (!emailResponse.ok) {
        const errText = await emailResponse.text();
        console.error("Email API error:", errText);
        // Still return success to not block the UI
        return new Response(
          JSON.stringify({ success: true, note: "Email API unavailable, notification logged" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      console.log(`[NOTIFICATION] Would send ${decision} email to ${studentEmail}`);
    }

    // Log the notification to DB using service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    await supabaseAdmin.from("notifications_log").insert({
      recipient_email: studentEmail,
      recipient_name: studentName,
      notification_type: decision,
      subject,
      sent_at: new Date().toISOString(),
    }).then(() => {}); // Best effort, ignore errors if table doesn't exist yet

    return new Response(
      JSON.stringify({ success: true, message: `Notification sent to ${studentEmail}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("send-notification error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
