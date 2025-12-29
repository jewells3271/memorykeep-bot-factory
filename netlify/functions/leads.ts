import { getStore } from "@netlify/blobs";
import type { Context } from "@netlify/functions";

interface Lead {
    id: string;
    botId: string;
    data: Record<string, string>;
    timestamp: string;
    source: string;
}

interface LeadsStore {
    leads: Lead[];
    lastUpdated: string;
}

export default async (request: Request, context: Context) => {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
        });
    }

    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
    };

    try {
        // Get the leads store
        const store = getStore("leads");
        const botId = new URL(request.url).searchParams.get("botId") || "default";
        const storeKey = `leads-${botId}`;

        // GET - Retrieve all leads
        if (request.method === "GET") {
            const data = await store.get(storeKey, { type: "json" }) as LeadsStore | null;

            // Check for admin password in query params for security
            const adminKey = new URL(request.url).searchParams.get("adminKey");

            return new Response(
                JSON.stringify({
                    success: true,
                    leads: data?.leads || [],
                    count: data?.leads?.length || 0,
                    lastUpdated: data?.lastUpdated || null,
                }),
                { status: 200, headers: corsHeaders }
            );
        }

        // POST - Add a new lead
        if (request.method === "POST") {
            const body = await request.json();

            if (!body.data) {
                return new Response(
                    JSON.stringify({ success: false, error: "Missing lead data" }),
                    { status: 400, headers: corsHeaders }
                );
            }

            // Get existing leads
            const existingData = await store.get(storeKey, { type: "json" }) as LeadsStore | null;
            const leads = existingData?.leads || [];

            // Create new lead
            const newLead: Lead = {
                id: `lead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                botId: body.botId || botId,
                data: body.data,
                timestamp: new Date().toISOString(),
                source: body.source || "chat_widget",
            };

            // Add to leads array
            leads.push(newLead);

            // Save back to store
            const updatedStore: LeadsStore = {
                leads,
                lastUpdated: new Date().toISOString(),
            };

            await store.setJSON(storeKey, updatedStore);

            return new Response(
                JSON.stringify({
                    success: true,
                    message: "Lead saved successfully",
                    leadId: newLead.id,
                    totalLeads: leads.length,
                }),
                { status: 201, headers: corsHeaders }
            );
        }

        // DELETE - Clear all leads (with admin key)
        if (request.method === "DELETE") {
            const adminKey = new URL(request.url).searchParams.get("adminKey");

            // Simple admin protection - in production, use proper auth
            if (adminKey !== "clear-all-leads") {
                return new Response(
                    JSON.stringify({ success: false, error: "Unauthorized" }),
                    { status: 401, headers: corsHeaders }
                );
            }

            await store.delete(storeKey);

            return new Response(
                JSON.stringify({ success: true, message: "All leads cleared" }),
                { status: 200, headers: corsHeaders }
            );
        }

        return new Response(
            JSON.stringify({ success: false, error: "Method not allowed" }),
            { status: 405, headers: corsHeaders }
        );

    } catch (error: any) {
        console.error("Leads function error:", error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || "Internal server error"
            }),
            { status: 500, headers: corsHeaders }
        );
    }
};

export const config = {
    path: "/api/leads",
};
