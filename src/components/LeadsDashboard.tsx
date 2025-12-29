import React, { useState, useEffect } from 'react';
import { LeadService } from '../core/LeadService';
import { Bot } from '../types/Bot';
import { Search, Download, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface Lead {
    id: string;
    botId: string;
    data: Record<string, string>;
    timestamp: string;
    source: string;
}

interface LeadsDashboardProps {
    bots: Bot[];
    onClose: () => void;
}

export const LeadsDashboard: React.FC<LeadsDashboardProps> = ({ bots, onClose }) => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterBotId, setFilterBotId] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const leadsPerPage = 10;

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const response = await LeadService.getLeads('all');
            if (response.success && response.leads) {
                setLeads(response.leads);
            }
        } catch (error) {
            console.error('Failed to fetch leads:', error);
        } finally {
            setLoading(false);
        }
    };

    const getBotName = (botId: string) => {
        const bot = bots.find(b => b.id === botId);
        return bot ? bot.name : `Unknown Bot (${botId})`;
    };

    const filteredLeads = leads.filter(lead => {
        const matchesBot = filterBotId === 'all' || lead.botId === filterBotId;
        const matchesSearch = Object.values(lead.data).some(val =>
            val.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return matchesBot && matchesSearch;
    });

    const indexOfLastLead = currentPage * leadsPerPage;
    const indexOfFirstLead = indexOfLastLead - leadsPerPage;
    const currentLeads = filteredLeads.slice(indexOfFirstLead, indexOfLastLead);
    const totalPages = Math.ceil(filteredLeads.length / leadsPerPage);

    const handleExport = () => {
        LeadService.downloadCSV('all-bots', filteredLeads);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b flex items-center justify-between bg-white sticky top-0 z-10">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <Filter className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Central Lead Bank</h2>
                            <p className="text-sm text-gray-500">{filteredLeads.length} leads total</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                {/* Filters/Actions */}
                <div className="px-6 py-4 bg-gray-50 border-b flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search leads..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64"
                            />
                        </div>
                        <select
                            value={filterBotId}
                            onChange={(e) => setFilterBotId(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="all">All Bots</option>
                            {bots.map(bot => (
                                <option key={bot.id} value={bot.id}>{bot.name}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleExport}
                        disabled={filteredLeads.length === 0}
                        className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export CSV</span>
                    </button>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="mt-4 text-gray-500">Loading leads...</p>
                        </div>
                    ) : filteredLeads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <div className="p-4 bg-gray-100 rounded-full mb-4">
                                <Search className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No leads found</h3>
                            <p className="text-gray-500">Try adjusting your filters or search term.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b">
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bot Source</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Lead Information</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Timestamp</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Source</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {currentLeads.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{getBotName(lead.botId)}</div>
                                            <div className="text-xs text-gray-400">ID: {lead.botId}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                {Object.entries(lead.data).map(([key, value]) => (
                                                    <div key={key} className="text-sm">
                                                        <span className="font-medium text-gray-700">{key}:</span>{' '}
                                                        <span className="text-gray-600">{value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(lead.timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                                                {lead.source}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            Showing <span className="font-medium">{indexOfFirstLead + 1}</span> to{' '}
                            <span className="font-medium">{Math.min(indexOfLastLead, filteredLeads.length)}</span> of{' '}
                            <span className="font-medium">{filteredLeads.length}</span> results
                        </p>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-8 h-8 rounded text-sm font-medium ${currentPage === page
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
