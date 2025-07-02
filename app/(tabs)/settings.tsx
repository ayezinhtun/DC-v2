import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import {
  Database,
  Download,
  Trash2,
  Info,
  Shield,
  Camera,
  Bell,
  Calendar,
  Users,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { exportToCSV } from '@/lib/csvExport';

export default function SettingsScreen() {
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [activeVisitors, setActiveVisitors] = useState(0);
  const [todayVisitors, setTodayVisitors] = useState(0);
  const [loading, setLoading] = useState(true);
  const [autoCheckout, setAutoCheckout] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Get total visitors
      const { count: total } = await supabase
        .from('dc_visitors')
        .select('*', { count: 'exact', head: true });

      // Get active visitors (not checked out)
      const { count: active } = await supabase
        .from('dc_visitors')
        .select('*', { count: 'exact', head: true })
        .is('out_time', null);

      // Get today's visitors
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { count: todayCount } = await supabase
        .from('dc_visitors')
        .select('*', { count: 'exact', head: true })
        .gte('in_time', today.toISOString())
        .lt('in_time', tomorrow.toISOString());

      setTotalVisitors(total || 0);
      setActiveVisitors(active || 0);
      setTodayVisitors(todayCount || 0);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportAllData = async () => {
    try {
      const { data, error } = await supabase
        .from('dc_visitors')
        .select('*')
        .order('in_time', { ascending: false });

      if (error) throw error;

      await exportToCSV(data || [], { includePhotos: true });
      Alert.alert('Success', 'All visitor data exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error', 'Failed to export data');
    }
  };

  const exportTodayData = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await supabase
        .from('dc_visitors')
        .select('*')
        .gte('in_time', today.toISOString())
        .lt('in_time', tomorrow.toISOString())
        .order('in_time', { ascending: false });

      if (error) throw error;

      await exportToCSV(data || [], { includePhotos: true });
      Alert.alert('Success', "Today's visitor data exported successfully!");
    } catch (error) {
      console.error('Error exporting today data:', error);
      Alert.alert('Error', 'Failed to export today\'s data');
    }
  };

  const clearOldRecords = () => {
    Alert.alert(
      'Clear Old Records',
      'This will remove visitor records older than 30 days. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              const thirtyDaysAgo = new Date();
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

              const { error } = await supabase
                .from('dc_visitors')
                .delete()
                .lt('created_at', thirtyDaysAgo.toISOString());

              if (error) throw error;

              Alert.alert('Success', 'Old records cleared successfully');
              fetchStats();
            } catch (error) {
              console.error('Error clearing records:', error);
              Alert.alert('Error', 'Failed to clear old records');
            }
          },
        },
      ]
    );
  };

  const clearAllRecords = () => {
    Alert.alert(
      'Clear All Records',
      'This will permanently delete ALL visitor records. This action cannot be undone. Are you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'This is your last chance. All visitor data will be permanently deleted.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete All',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      const { error } = await supabase
                        .from('dc_visitors')
                        .delete()
                        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

                      if (error) throw error;

                      Alert.alert('Success', 'All records cleared successfully');
                      fetchStats();
                    } catch (error) {
                      console.error('Error clearing all records:', error);
                      Alert.alert('Error', 'Failed to clear all records');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const testConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('dc_visitors')
        .select('count')
        .limit(1);

      if (error) throw error;

      Alert.alert('Connection Test', 'Database connection successful!');
    } catch (error) {
      console.error('Connection test failed:', error);
      Alert.alert('Connection Test', 'Database connection failed. Please check your configuration.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>System configuration and data management</Text>
        </View>

        {/* Statistics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{loading ? '...' : totalVisitors}</Text>
              <Text style={styles.statLabel}>Total Visitors</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{loading ? '...' : activeVisitors}</Text>
              <Text style={styles.statLabel}>Currently In Site</Text>
            </View>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{loading ? '...' : todayVisitors}</Text>
              <Text style={styles.statLabel}>Today's Visitors</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {loading ? '...' : totalVisitors - activeVisitors}
              </Text>
              <Text style={styles.statLabel}>Total Checked Out</Text>
            </View>
          </View>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Bell size={24} color="#60a5fa" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Sound Notifications</Text>
                <Text style={styles.settingDescription}>Play sounds for form actions</Text>
              </View>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: '#374151', true: '#3b82f6' }}
              thumbColor={soundEnabled ? '#ffffff' : '#9ca3af'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Camera size={24} color="#60a5fa" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Auto Photo Capture</Text>
                <Text style={styles.settingDescription}>Automatically take photo after 3 seconds</Text>
              </View>
            </View>
            <Switch
              value={autoCheckout}
              onValueChange={setAutoCheckout}
              trackColor={{ false: '#374151', true: '#3b82f6' }}
              thumbColor={autoCheckout ? '#ffffff' : '#9ca3af'}
            />
          </View>
        </View>

        {/* Data Export */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Export</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={exportAllData}>
            <Download size={24} color="#10b981" />
            <View style={styles.actionText}>
              <Text style={styles.actionLabel}>Export All Data</Text>
              <Text style={styles.actionDescription}>Download all visitor records as CSV</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={exportTodayData}>
            <Calendar size={24} color="#10b981" />
            <View style={styles.actionText}>
              <Text style={styles.actionLabel}>Export Today's Data</Text>
              <Text style={styles.actionDescription}>Download today's visitor records only</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={clearOldRecords}>
            <Trash2 size={24} color="#f59e0b" />
            <View style={styles.actionText}>
              <Text style={styles.actionLabel}>Clear Old Records</Text>
              <Text style={styles.actionDescription}>Remove records older than 30 days</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={clearAllRecords}>
            <Trash2 size={24} color="#ef4444" />
            <View style={styles.actionText}>
              <Text style={styles.actionLabel}>Clear All Records</Text>
              <Text style={styles.actionDescription}>⚠️ Permanently delete all visitor data</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* System Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={testConnection}>
            <Database size={24} color="#8b5cf6" />
            <View style={styles.actionText}>
              <Text style={styles.actionLabel}>Test Connection</Text>
              <Text style={styles.actionDescription}>Verify database connectivity</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.infoItem}>
            <Info size={24} color="#60a5fa" />
            <View style={styles.actionText}>
              <Text style={styles.actionLabel}>App Version</Text>
              <Text style={styles.actionDescription}>DC Access Management v1.0.0</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Shield size={24} color="#10b981" />
            <View style={styles.actionText}>
              <Text style={styles.actionLabel}>Security</Text>
              <Text style={styles.actionDescription}>Data encrypted and stored securely</Text>
            </View>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>
            DC Site Access Management System provides secure visitor tracking for critical infrastructure. 
            All visitor data is encrypted and stored with enterprise-grade security standards. Features include 
            photo capture, CSV export, multiple registration, detailed visitor tracking, and comprehensive 
            data management capabilities.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f9fafb',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f9fafb',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f9fafb',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#9ca3af',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  actionText: {
    marginLeft: 16,
    flex: 1,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f9fafb',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#9ca3af',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  aboutText: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
});