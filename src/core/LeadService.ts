/**
 * LeadService - Handles lead storage via Netlify Functions
 * 
 * When deployed to Netlify, leads are stored in Netlify Blobs.
 * When running locally, falls back to IndexedDB.
 */

interface Lead {
    id: string;
    botId: string;
    data: Record<string, string>;
    timestamp: string;
    source: string;
}

interface LeadsResponse {
    success: boolean;
    leads?: Lead[];
    count?: number;
    error?: string;
}

interface SaveLeadResponse {
    success: boolean;
    leadId?: string;
    totalLeads?: number;
    error?: string;
}

export class LeadService {
    private static getApiUrl(): string {
        // When deployed to Netlify, use relative URL
        // When running locally with netlify dev, also use relative URL
        // The function will be at /.netlify/functions/leads or /api/leads
        const baseUrl = window.location.origin;
        return `${baseUrl}/api/leads`;
    }

    private static isNetlifyDeployment(): boolean {
        // Check if we're running on Netlify
        return window.location.hostname.includes('netlify.app') ||
            window.location.hostname.includes('netlify.live') ||
            window.location.port === '8888'; // netlify dev
    }

    /**
     * Save a lead to storage
     */
    static async saveLead(botId: string, data: Record<string, string>, source: string = 'chat_widget'): Promise<SaveLeadResponse> {
        // Try Netlify function first (if deployed)
        if (this.isNetlifyDeployment()) {
            try {
                const response = await fetch(`${this.getApiUrl()}?botId=${botId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        botId,
                        data,
                        source,
                    }),
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ Lead saved to Netlify Blobs:', result);
                    return result;
                } else {
                    console.warn('Netlify function returned error:', response.status);
                }
            } catch (error) {
                console.warn('Could not save to Netlify, falling back to local storage:', error);
            }
        }

        // Fallback to localStorage for local development
        try {
            const localLeads = this.getLocalLeads(botId);
            const newLead: Lead = {
                id: `lead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                botId,
                data,
                timestamp: new Date().toISOString(),
                source,
            };
            localLeads.push(newLead);
            localStorage.setItem(`leads-${botId}`, JSON.stringify(localLeads));
            console.log('✅ Lead saved to localStorage:', newLead);
            return { success: true, leadId: newLead.id, totalLeads: localLeads.length };
        } catch (error: any) {
            console.error('Failed to save lead:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get all leads for a bot
     */
    static async getLeads(botId: string): Promise<LeadsResponse> {
        // Try Netlify function first (if deployed)
        if (this.isNetlifyDeployment()) {
            try {
                const response = await fetch(`${this.getApiUrl()}?botId=${botId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log('📋 Leads retrieved from Netlify Blobs:', result);
                    return result;
                }
            } catch (error) {
                console.warn('Could not fetch from Netlify, falling back to local storage:', error);
            }
        }

        // Fallback to localStorage
        const localLeads = this.getLocalLeads(botId);
        return {
            success: true,
            leads: localLeads,
            count: localLeads.length
        };
    }

    /**
     * Format leads for display in chat
     */
    static formatLeadsForChat(leads: Lead[]): string {
        if (leads.length === 0) {
            return '📭 **No leads collected yet.**\n\nLeads will appear here when visitors submit the lead capture form.';
        }

        let output = `📊 **Collected Leads (${leads.length} total)**\n\n`;

        leads.slice(-10).reverse().forEach((lead, index) => {
            const date = new Date(lead.timestamp).toLocaleString();
            output += `**Lead #${leads.length - index}** - ${date}\n`;

            Object.entries(lead.data).forEach(([key, value]) => {
                output += `• ${key}: ${value}\n`;
            });

            output += '\n';
        });

        if (leads.length > 10) {
            output += `\n_Showing last 10 of ${leads.length} leads._`;
        }

        return output;
    }

    /**
     * Export leads as CSV
     */
    static exportAsCSV(leads: Lead[]): string {
        if (leads.length === 0) return '';

        // Get all unique field names
        const allFields = new Set<string>();
        leads.forEach(lead => {
            Object.keys(lead.data).forEach(key => allFields.add(key));
        });

        const fieldNames = ['timestamp', ...Array.from(allFields)];

        // Header row
        let csv = fieldNames.join(',') + '\n';

        // Data rows
        leads.forEach(lead => {
            const row = fieldNames.map(field => {
                if (field === 'timestamp') return lead.timestamp;
                const value = lead.data[field] || '';
                // Escape commas and quotes
                return `"${value.replace(/"/g, '""')}"`;
            });
            csv += row.join(',') + '\n';
        });

        return csv;
    }

    /**
     * Download leads as CSV file
     */
    static downloadCSV(botId: string, leads: Lead[]): void {
        const csv = this.exportAsCSV(leads);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leads-${botId}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    private static getLocalLeads(botId: string): Lead[] {
        try {
            const stored = localStorage.getItem(`leads-${botId}`);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }
}
