import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Search, Download, Users, Filter, Calendar } from 'lucide-react-native';
import { supabase, DCVisitor } from '@/lib/supabase';
import { exportToCSV, ExportOptions } from '@/lib/csvExport';
import VisitorCard from '@/components/VisitorCard';
import VisitorDetailsModal from '@/components/VisitorDetailsModal';
import MultipleRegistrationModal from '@/components/MultipleRegistrationModal';


export default function VisitorLogsScreen() {
  const [visitors, setVisitors] = useState<DCVisitor[]>([]);
  const [filteredVisitors, setFilteredVisitors] = useState<DCVisitor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<DCVisitor | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showMultipleRegistration, setShowMultipleRegistration] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'checked_out'>('all');

  useEffect(() => {
    fetchVisitors();
  }, []);

  useEffect(() => {
    filterVisitors();
  }, [searchQuery, visitors, filterStatus]);

 const fetchVisitors = async () => {
  try {
    const { data, error } = await supabase
      .from('dc_visitors')
      .select('*')
      .order('in_time', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('Visitors from Supabase:', data); // 🔍 Add this

    setVisitors(data || []);
  } catch (error) {
    console.error('Error fetching visitors:', error);
    Alert.alert('Error', 'Failed to load visitor logs');
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};


  const filterVisitors = () => {
    let filtered = visitors;

    // Apply status filter
    if (filterStatus === 'active') {
      filtered = filtered.filter(visitor => !visitor.out_time);
    } else if (filterStatus === 'checked_out') {
      filtered = filtered.filter(visitor => !!visitor.out_time);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(visitor =>
        visitor.name.toLowerCase().includes(query) ||
        visitor.nrc_no.toLowerCase().includes(query) ||
        visitor.company_name?.toLowerCase().includes(query) ||
        visitor.phone_number.includes(query)
      );
    }

    setFilteredVisitors(filtered);
  };

  const handleCheckOut = async (visitorId: string) => {
    try {
      const { error } = await supabase
        .from('dc_visitors')
        .update({ out_time: new Date().toISOString() })
        .eq('id', visitorId);

      if (error) throw error;

      Alert.alert('Success', 'Visitor checked out successfully');
      fetchVisitors();
    } catch (error) {
      console.error('Error checking out visitor:', error);
      Alert.alert('Error', 'Failed to check out visitor');
    }
  };

  const handleDelete = async (visitorId: string) => {
    try {
      const { error } = await supabase
        .from('dc_visitors')
        .delete()
        .eq('id', visitorId);

      if (error) throw error;

      Alert.alert('Success', 'Visitor record deleted successfully');
      fetchVisitors();
    } catch (error) {
      console.error('Error deleting visitor:', error);
      Alert.alert('Error', 'Failed to delete visitor record');
    }
  };

  const handleViewDetails = (visitor: DCVisitor) => {
    setSelectedVisitor(visitor);
    setShowDetailsModal(true);
  };

const handleExportCSV = async () => {
  try {
    console.log('searchQuery:', searchQuery);
    console.log('filterStatus:', filterStatus);
    console.log('visitors:', visitors.length);
    console.log('filteredVisitors:', filteredVisitors.length);

    const dataToExport = filteredVisitors.map(visitor => ({
      name: visitor.name || '',
      nrc_no: visitor.nrc_no || '',
      company_name: visitor.company_name || '',
      phone_number: visitor.phone_number || '',
      in_time: visitor.in_time || '',
      out_time: visitor.out_time || '',
    }));

    console.log('Data prepared for CSV:', dataToExport);

    if (dataToExport.length === 0) {
      Alert.alert('No Data', 'No visitor records match the current filters.');
      return;
    }

    await exportToCSV(dataToExport);
    Alert.alert('Success', 'Data exported successfully!');
  } catch (error) {
    console.error('Error exporting CSV:', error);
    Alert.alert('Error', 'Failed to export data');
  }
};





  const onRefresh = () => {
    setRefreshing(true);
    fetchVisitors();
  };

  const getFilterButtonStyle = (status: typeof filterStatus) => [
    styles.filterButton,
    filterStatus === status && styles.filterButtonActive,
  ];

  const getFilterTextStyle = (status: typeof filterStatus) => [
    styles.filterButtonText,
    filterStatus === status && styles.filterButtonTextActive,
  ];

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading visitor logs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Visitor Logs</Text>
        <Text style={styles.subtitle}>
          {filteredVisitors.length} visitor{filteredVisitors.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Search and Actions */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, NRC, company..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleExportCSV}>
            <Download size={20} color="#10b981" />
          </TouchableOpacity>
          

        

          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => setShowMultipleRegistration(true)}
          >
            <Users size={20} color="#3b82f6" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={getFilterButtonStyle('all')}
          onPress={() => setFilterStatus('all')}
        >
          <Text style={getFilterTextStyle('all')}>All</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={getFilterButtonStyle('active')}
          onPress={() => setFilterStatus('active')}
        >
          <Text style={getFilterTextStyle('active')}>In Site</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={getFilterButtonStyle('checked_out')}
          onPress={() => setFilterStatus('checked_out')}
        >
          <Text style={getFilterTextStyle('checked_out')}>Checked Out</Text>
        </TouchableOpacity>
      </View>

      {/* Visitor List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredVisitors.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery || filterStatus !== 'all' 
                ? 'No visitors found matching your criteria' 
                : 'No visitors registered yet'}
            </Text>
          </View>
        ) : (
          filteredVisitors.map((visitor) => (
            <VisitorCard
              key={visitor.id}
              visitor={visitor}
              onViewDetails={handleViewDetails}
              onCheckOut={handleCheckOut}
              onDelete={handleDelete}
            />
          ))
        )}
      </ScrollView>

      {/* Modals */}
      <VisitorDetailsModal
        visible={showDetailsModal}
        visitor={selectedVisitor}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedVisitor(null);
        }}
      />

      <MultipleRegistrationModal
        visible={showMultipleRegistration}
        onClose={() => setShowMultipleRegistration(false)}
        onSuccess={fetchVisitors}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
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
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#f9fafb',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#374151',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 18,
    color: '#9ca3af',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
});