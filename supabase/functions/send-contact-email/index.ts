import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://blank2branded.co.za",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BodySchema = z.object({
  name: z.string().trim().min(1).max(100),
  business: z.string().trim().min(1).max(150),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(3).max(30),
  orderType: z.string().trim().min(1).max(80),
  subject: z.string().trim().max(200).optional().nullable(),
  message: z.string().trim().min(1).max(5000),
});

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const TO = "hello@blank2branded.co.za";
const FROM = "Blank2Branded <hello@blank2branded.co.za>";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };

    return entities[char];
  });
}

Deno.serve(async (req) => {
  // Handle browser CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const body = await req.json();
    const parsed = BodySchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid form data",
          fields: parsed.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const d = parsed.data;

    const subjectLine = d.subject?.trim()
      ? `New enquiry: ${d.subject} — ${d.business}`
      : `New enquiry from ${d.business}`;

    const html = `
      <h2>New enquiry from the Blank2Branded website</h2>

      <p><strong>Name:</strong> ${escapeHtml(d.name)}</p>
      <p><strong>Business:</strong> ${escapeHtml(d.business)}</p>
      <p><strong>Email:</strong> ${escapeHtml(d.email)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(d.phone)}</p>
      <p><strong>Order type:</strong> ${escapeHtml(d.orderType)}</p>

      ${
        d.subject
          ? `<p><strong>Subject:</strong> ${escapeHtml(d.subject)}</p>`
          : ""
      }

      <p><strong>Message:</strong></p>

      <pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(
        d.message
      )}</pre>
    `;

    const resendResponse = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM,
          to: [TO],
          reply_to: d.email,
          subject: subjectLine,
          html,
        }),
      }
    );

    if (!resendResponse.ok) {
      const details = await resendResponse.text();

      console.error(
        "Resend error:",
        resendResponse.status,
        details
      );

      return new Response(
        JSON.stringify({
          error: "Email send failed",
          status: resendResponse.status,
          details,
        }),
        {
          status: resendResponse.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ ok: true }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Contact email error:", error);

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Unexpected server error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});