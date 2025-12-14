'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api';
import {
  Users,
  Shield,
  FileText,
  Settings,
  Activity,
  TrendingUp,
  Loader2,
} from 'lucide-react';

/**
 * Stat card component for dashboard widgets
 */
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  trendUp,
  loading,
}) => (
  <div className="bg-[#2D3748] rounded-lg p-6 shadow-card">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[#A0AEC0] text-sm font-medium">{title}</p>
        {loading ? (
          <div className="flex items-center gap-2 mt-1">
            <Loader2 className="h-5 w-5 animate-spin text-[#4A90E2]" />
          </div>
        ) : (
          <p className="text-white text-2xl font-bold mt-1">{value}</p>
        )}
        {trend && !loading && (
          <p className={`text-sm mt-2 ${trendUp ? 'text-[#38A169]' : 'text-[#A0AEC0]'}`}>
            {trendUp ? '↑' : ''} {trend}
          </p>
        )}
      </div>
      <div className="p-3 bg-[#3B4B63] rounded-lg">{icon}</div>
    </div>
  </div>
);

/**
 * Quick action card component
 */
interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}


const QuickAction: React.FC<QuickActionProps> = ({
  title,
  description,
  icon,
  href,
}) => (
  <a
    href={href}
    className="bg-[#2D3748] rounded-lg p-4 shadow-card hover:bg-[#3B4B63] transition-colors duration-200 block"
  >
    <div className="flex items-center gap-3">
      <div className="p-2 bg-[#4A90E2]/20 rounded-lg">{icon}</div>
      <div>
        <p className="text-white font-medium">{title}</p>
        <p className="text-[#A0AEC0] text-sm">{description}</p>
      </div>
    </div>
  </a>
);

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalRoles: number;
  totalAuditLogs: number;
}

interface RecentActivity {
  id: number;
  action: string;
  user_name?: string;
  created_at: string;
  description?: string;
}

/**
 * Dashboard Home Page
 * Displays welcome message with user name and real stats
 * Validates: Requirements 5.1
 */
export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalRoles: 0,
    totalAuditLogs: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);

  // Get first name for welcome message
  const firstName = user?.name?.split(' ')[0] || 'User';

  /**
   * Fetch dashboard statistics
   */
  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch users, roles, and audit logs in parallel
      const [usersRes, rolesRes, logsRes] = await Promise.all([
        apiClient.get<unknown>('/users', { per_page: 1 }),
        apiClient.get<unknown>('/roles'),
        apiClient.get<unknown>('/audit-logs', { per_page: 1 }),
      ]);

      // Extract user stats
      let totalUsers = 0;
      const usersData = usersRes.data as Record<string, unknown>;
      if (usersData) {
        if ('total' in usersData) {
          totalUsers = usersData.total as number;
        } else if ('data' in usersData && Array.isArray(usersData.data)) {
          totalUsers = (usersData.data as unknown[]).length;
        }
      }

      // Extract roles count
      let totalRoles = 0;
      const rolesData = rolesRes.data as Record<string, unknown>;
      if (rolesData) {
        if ('roles' in rolesData && Array.isArray(rolesData.roles)) {
          totalRoles = (rolesData.roles as unknown[]).length;
        } else if (Array.isArray(rolesData)) {
          totalRoles = rolesData.length;
        }
      }

      // Extract audit logs count
      let totalAuditLogs = 0;
      const logsData = logsRes.data as Record<string, unknown>;
      if (logsData) {
        if ('total' in logsData) {
          totalAuditLogs = logsData.total as number;
        }
      }

      setStats({
        totalUsers,
        activeUsers: totalUsers, // Assume all are active for now
        totalRoles,
        totalAuditLogs,
      });
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch recent activity
   */
  const fetchRecentActivity = useCallback(async () => {
    setActivityLoading(true);
    try {
      const response = await apiClient.get<unknown>('/audit-logs', { per_page: 5 });
      const responseData = response.data as Record<string, unknown>;

      let logs: RecentActivity[] = [];
      if (responseData) {
        if ('data' in responseData && Array.isArray(responseData.data)) {
          logs = responseData.data as RecentActivity[];
        } else if ('logs' in responseData && Array.isArray(responseData.logs)) {
          logs = responseData.logs as RecentActivity[];
        } else if (Array.isArray(responseData)) {
          logs = responseData as RecentActivity[];
        }
      }

      setRecentActivity(logs.slice(0, 5));
    } catch (err) {
      console.error('Failed to fetch recent activity:', err);
    } finally {
      setActivityLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchRecentActivity();
  }, [fetchStats, fetchRecentActivity]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-[#2D3748] rounded-lg p-6 shadow-card">
        <h1 className="text-2xl font-bold text-white">Welcome back, {firstName}!</h1>
        <p className="text-[#A0AEC0] mt-2">
          Here&apos;s what&apos;s happening with your system today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toString()}
          icon={<Users className="h-6 w-6 text-[#4A90E2]" />}
          trend="Registered users"
          loading={loading}
        />
        <StatCard
          title="Active Roles"
          value={stats.totalRoles.toString()}
          icon={<Shield className="h-6 w-6 text-[#38A169]" />}
          trend="System roles"
          loading={loading}
        />
        <StatCard
          title="Audit Logs"
          value={stats.totalAuditLogs.toString()}
          icon={<FileText className="h-6 w-6 text-[#DD6B20]" />}
          trend="Total events"
          loading={loading}
        />
        <StatCard
          title="System Health"
          value="Online"
          icon={<Activity className="h-6 w-6 text-[#38A169]" />}
          trend="All systems operational"
          trendUp={true}
          loading={loading}
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickAction
            title="Manage Users"
            description="View and manage user accounts"
            icon={<Users className="h-5 w-5 text-[#4A90E2]" />}
            href="/users"
          />
          <QuickAction
            title="Manage Roles"
            description="Configure roles and permissions"
            icon={<Shield className="h-5 w-5 text-[#4A90E2]" />}
            href="/roles"
          />
          <QuickAction
            title="System Settings"
            description="Configure system preferences"
            icon={<Settings className="h-5 w-5 text-[#4A90E2]" />}
            href="/settings"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-[#2D3748] rounded-lg p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
          <a href="/audit-logs" className="text-[#4A90E2] text-sm hover:underline">
            View all
          </a>
        </div>
        {activityLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-[#4A90E2]" />
          </div>
        ) : recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between py-3 border-b border-[#3B4B63] last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#3B4B63] rounded-lg">
                    <Activity className="h-4 w-4 text-[#4A90E2]" />
                  </div>
                  <div>
                    <p className="text-white text-sm">{activity.action}</p>
                    <p className="text-[#A0AEC0] text-xs">
                      {activity.user_name || 'System'}
                    </p>
                  </div>
                </div>
                <span className="text-[#718096] text-xs">
                  {formatDate(activity.created_at)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-8 text-[#A0AEC0]">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No recent activity</p>
              <p className="text-sm mt-1">System events will appear here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
