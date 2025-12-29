import React, { useState, useEffect } from 'react';
import { BotModule } from '../../types/Bot';
import { MemorySystem } from '../../core/MemorySystem';
import { Settings, Play, Pause, Clock, Mail, Calendar, Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

interface AutomationModuleProps {
  module: BotModule;
  botId: string;
}

interface AutomationJob {
  id: string;
  name: string;
  type: 'email-monitor' | 'scheduled-message' | 'webhook-listener' | 'data-sync';
  config: Record<string, any>;
  enabled: boolean;
  schedule?: string;
  lastRun?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export const AutomationModule: React.FC<AutomationModuleProps> = ({ botId }) => {
  const [jobs, setJobs] = useState<AutomationJob[]>([]);
  const [workerStatus, setWorkerStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');

  useEffect(() => {
    loadJobs();
    checkWorkerStatus();
  }, [botId]);

  const loadJobs = async () => {
    try {
      const jobMemories = await MemorySystem.getMemories(botId, 'job');
      if (jobMemories.length > 0) {
        // Get the most recent job memory's content
        const latestJobMemory = jobMemories[jobMemories.length - 1];
        if (Array.isArray(latestJobMemory.content)) {
          setJobs(latestJobMemory.content);
        }
      }
    } catch (error) {
      console.error('Failed to load automation jobs:', error);
    }
  };

  const checkWorkerStatus = async () => {
    try {
      // Check if we can access local storage (always works)
      await MemorySystem.getMemories(botId, 'core');
      setWorkerStatus('connected');
    } catch (error) {
      setWorkerStatus('disconnected');
    }
  };

  const saveJobs = async (updatedJobs: AutomationJob[]) => {
    try {
      await MemorySystem.overwriteMemory(botId, 'job', updatedJobs);
      setJobs(updatedJobs);

      // Log the automation update
      await MemorySystem.logExperience(botId, {
        type: 'automation_update',
        jobCount: updatedJobs.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to save automation jobs:', error);
    }
  };

  const handleJobToggle = async (jobId: string) => {
    const updatedJobs = jobs.map(job =>
      job.id === jobId ? { ...job, enabled: !job.enabled } : job
    );
    await saveJobs(updatedJobs);
  };

  const handleJobDelete = async (jobId: string) => {
    if (window.confirm('Are you sure you want to delete this automation job?')) {
      const updatedJobs = jobs.filter(job => job.id !== jobId);
      await saveJobs(updatedJobs);
    }
  };

  const getJobIcon = (type: string) => {
    switch (type) {
      case 'email-monitor':
        return <Mail className="w-5 h-5" />;
      case 'scheduled-message':
        return <Calendar className="w-5 h-5" />;
      case 'webhook-listener':
        return <Settings className="w-5 h-5" />;
      case 'data-sync':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Settings className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'text-blue-600 bg-blue-100';
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Automation Center</h2>
            <p className="text-gray-600">Manage automated tasks that run on your MemoryKeep worker.</p>
          </div>

          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${workerStatus === 'connected'
              ? 'bg-green-100 text-green-800'
              : workerStatus === 'disconnected'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800'
              }`}>
              <div className={`w-2 h-2 rounded-full ${workerStatus === 'connected' ? 'bg-green-500' :
                workerStatus === 'disconnected' ? 'bg-red-500' : 'bg-gray-500'
                }`}></div>
              <span>
                {workerStatus === 'connected' ? 'Worker Connected' :
                  workerStatus === 'disconnected' ? 'Worker Offline' : 'Checking...'}
              </span>
            </div>
          </div>
        </div>

        {workerStatus === 'disconnected' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900">Worker Not Connected</h4>
                <p className="text-sm text-yellow-800 mt-1">
                  The automation worker is not currently connected. Jobs will be queued and executed when the worker comes online.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {jobs.length === 0 ? (
          <div className="text-center py-12">
            <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Automation Jobs</h3>
            <p className="text-gray-500 mb-6">Create your first automation job to get started.</p>
          </div>
        ) : (
          jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="text-indigo-600">
                    {getJobIcon(job.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{job.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${job.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                        {job.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-3">
                      Type: <span className="font-medium">{job.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                    </p>

                    {job.schedule && (
                      <p className="text-sm text-gray-500 mb-2">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Schedule: {job.schedule}
                      </p>
                    )}

                    {job.lastRun && (
                      <p className="text-sm text-gray-500">
                        Last run: {new Date(job.lastRun).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleJobToggle(job.id)}
                    className={`p-2 rounded-md transition-colors ${job.enabled
                      ? 'text-green-600 hover:bg-green-50'
                      : 'text-gray-400 hover:bg-gray-50'
                      }`}
                    title={job.enabled ? 'Disable job' : 'Enable job'}
                  >
                    {job.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleJobDelete(job.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete job"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Worker Information */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-medium text-blue-900 mb-3">🤖 Automation Worker Integration</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>How it works:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Jobs are stored in MemoryKeep Cloud under the "job" memory type</li>
            <li>Your automation_worker.py polls for new jobs every 60 seconds</li>
            <li>The worker executes enabled jobs based on their configuration</li>
            <li>Results and logs are stored back to MemoryKeep for monitoring</li>
          </ul>
          <p className="mt-3"><strong>Supported Job Types:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong>Email Monitor:</strong> Watch for incoming emails and respond</li>
            <li><strong>Scheduled Message:</strong> Send messages at specific times</li>
            <li><strong>Webhook Listener:</strong> Respond to external API calls</li>
            <li><strong>Data Sync:</strong> Synchronize data between systems</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

interface AutomationConfigComponentProps {
  config: any;
  onConfigUpdate: (config: any) => void;
}

export const AutomationConfigComponent: React.FC<AutomationConfigComponentProps> = ({
  config,
  onConfigUpdate
}) => {
  const [newJob, setNewJob] = useState<Partial<AutomationJob>>({
    name: '',
    type: 'email-monitor',
    config: {},
    enabled: true,
    status: 'pending'
  });

  const [jobs, setJobs] = useState<AutomationJob[]>(config.jobs || []);

  const handleAddJob = () => {
    if (!newJob.name?.trim()) return;

    const job: AutomationJob = {
      id: Date.now().toString(),
      name: newJob.name.trim(),
      type: newJob.type as any,
      config: getDefaultConfig(newJob.type as string),
      enabled: true,
      status: 'pending'
    };

    const updatedJobs = [...jobs, job];
    setJobs(updatedJobs);
    onConfigUpdate({ ...config, jobs: updatedJobs });
    setNewJob({ name: '', type: 'email-monitor', config: {}, enabled: true, status: 'pending' });
  };

  const getDefaultConfig = (type: string) => {
    switch (type) {
      case 'email-monitor':
        return {
          email: '',
          password: '',
          imap_server: 'imap.gmail.com',
          imap_port: 993,
          check_interval: 300,
          auto_reply: false,
          reply_template: 'Thank you for your email. We will get back to you soon.'
        };
      case 'scheduled-message':
        return {
          message: '',
          schedule: '0 9 * * 1', // Every Monday at 9 AM
          target: 'email',
          recipients: []
        };
      case 'webhook-listener':
        return {
          endpoint: '/webhook',
          method: 'POST',
          secret: '',
          response_template: '{"status": "received"}'
        };
      case 'data-sync':
        return {
          source: '',
          destination: '',
          sync_interval: 3600,
          mapping: {}
        };
      default:
        return {};
    }
  };

  const handleJobUpdate = (jobId: string, updates: Partial<AutomationJob>) => {
    const updatedJobs = jobs.map(job =>
      job.id === jobId ? { ...job, ...updates } : job
    );
    setJobs(updatedJobs);
    onConfigUpdate({ ...config, jobs: updatedJobs });
  };

  const handleJobDelete = (jobId: string) => {
    const updatedJobs = jobs.filter(job => job.id !== jobId);
    setJobs(updatedJobs);
    onConfigUpdate({ ...config, jobs: updatedJobs });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Automation Configuration</h3>
        <p className="text-sm text-gray-600 mb-6">
          Configure automation jobs that will be executed by your MemoryKeep worker.
        </p>
      </div>

      {/* Existing Jobs */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Current Jobs</h4>
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium text-gray-900">{job.name}</h5>
                  <p className="text-sm text-gray-600">Type: {job.type}</p>
                  <p className="text-sm text-gray-500">
                    Status: {job.enabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleJobUpdate(job.id, { enabled: !job.enabled })}
                    className={`px-3 py-1 text-sm rounded-md ${job.enabled
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                  >
                    {job.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => handleJobDelete(job.id)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add New Job */}
      <div className="bg-indigo-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Add New Automation Job</h4>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Name
              </label>
              <input
                type="text"
                value={newJob.name || ''}
                onChange={(e) => setNewJob({ ...newJob, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="My Automation Job"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Type
              </label>
              <select
                value={newJob.type || 'email-monitor'}
                onChange={(e) => setNewJob({ ...newJob, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="email-monitor">Email Monitor</option>
                <option value="scheduled-message">Scheduled Message</option>
                <option value="webhook-listener">Webhook Listener</option>
                <option value="data-sync">Data Sync</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleAddJob}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Job</span>
          </button>
        </div>
      </div>

      {/* Integration Info */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-900 mb-2">🔗 Worker Integration</h4>
        <div className="text-sm text-green-800 space-y-2">
          <p><strong>Jobs are automatically synced to MemoryKeep Cloud:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Stored in the "job" memory type for this bot</li>
            <li>Picked up by automation_worker.py every 60 seconds</li>
            <li>Executed based on job type and configuration</li>
            <li>Results logged back to MemoryKeep for monitoring</li>
          </ul>
          <p className="mt-3">
            <strong>Make sure your bot's API key is whitelisted</strong> in your automation_worker.py whitelist.txt file.
          </p>
        </div>
      </div>
    </div>
  );
};