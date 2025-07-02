import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import {
  X,
  User,
  Phone,
  Building,
  FileText,
  CreditCard,
  Package,
  Clock,
  Calendar,
} from 'lucide-react-native';
import { DCVisitor } from '@/lib/supabase';
import { formatDuration } from '@/lib/csvExport';

interface VisitorDetailsModalProps {
  visible: boolean;
  visitor: DCVisitor | null;
  onClose: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export default function VisitorDetailsModal({
  visible,
  visitor,
  onClose,
}: VisitorDetailsModalProps) {
  if (!visitor) return null;

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = () => {
    return visitor.out_time ? '#10b981' : '#f59e0b';
  };

  const getStatusText = () => {
    return visitor.out_time ? 'Checked Out' : 'Currently In Site';
  };

  const DetailRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => {
    if (!value) return null;
    
    return (
      <View style={styles.detailRow}>
        <View style={styles.detailIcon}>{icon}</View>
        <View style={styles.detailContent}>
          <Text style={styles.detailLabel}>{label}</Text>
          <Text style={styles.detailValue}>{value}</Text>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Visitor Details</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Photo and Basic Info */}
          <View style={styles.photoSection}>
            {visitor.photo_url ? (
              <Image source={{ uri: visitor.photo_url }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <User size={48} color="#6b7280" />
              </View>
            )}
            <Text style={styles.visitorName}>{visitor.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
              <Text style={styles.statusText}>{getStatusText()}</Text>
            </View>
          </View>

          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <DetailRow
              icon={<User size={20} color="#60a5fa" />}
              label="Full Name"
              value={visitor.name}
            />
            <DetailRow
              icon={<CreditCard size={20} color="#60a5fa" />}
              label="NRC Number"
              value={visitor.nrc_no}
            />
            <DetailRow
              icon={<Phone size={20} color="#60a5fa" />}
              label="Phone Number"
              value={visitor.phone_number}
            />
            <DetailRow
              icon={<Building size={20} color="#60a5fa" />}
              label="Company"
              value={visitor.company_name || 'Not specified'}
            />
          </View>

          {/* Visit Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Visit Information</Text>
            <DetailRow
              icon={<FileText size={20} color="#10b981" />}
              label="Purpose of Visit"
              value={visitor.visit_purpose || 'Not specified'}
            />
            <DetailRow
              icon={<CreditCard size={20} color="#10b981" />}
              label="Employee Card Number"
              value={visitor.employee_card_number || 'Not provided'}
            />
          </View>

          {/* Access Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Access Information</Text>
            <DetailRow
              icon={<Package size={20} color="#f59e0b" />}
              label="Container Number"
              value={visitor.access_container_no || 'Not specified'}
            />
            <DetailRow
              icon={<Package size={20} color="#f59e0b" />}
              label="Rack Number"
              value={visitor.access_rack_no || 'Not specified'}
            />
          </View>

          {/* Inventory */}
          {visitor.inventory_list && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Inventory Details</Text>
              <View style={styles.inventoryContainer}>
                <Text style={styles.inventoryText}>{visitor.inventory_list}</Text>
              </View>
            </View>
          )}

          {/* Time Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Time Information</Text>
            <DetailRow
              icon={<Clock size={20} color="#8b5cf6" />}
              label="Entry Time"
              value={formatDateTime(visitor.in_time)}
            />
            {visitor.out_time && (
              <DetailRow
                icon={<Clock size={20} color="#8b5cf6" />}
                label="Exit Time"
                value={formatDateTime(visitor.out_time)}
              />
            )}
            <DetailRow
              icon={<Calendar size={20} color="#8b5cf6" />}
              label="Duration"
              value={formatDuration(visitor.in_time, visitor.out_time)}
            />
          </View>

          {/* System Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>System Information</Text>
            <DetailRow
              icon={<Calendar size={20} color="#6b7280" />}
              label="Record Created"
              value={formatDateTime(visitor.created_at)}
            />
            <DetailRow
              icon={<Calendar size={20} color="#6b7280" />}
              label="Last Updated"
              value={formatDateTime(visitor.updated_at)}
            />
            <DetailRow
              icon={<CreditCard size={20} color="#6b7280" />}
              label="Record ID"
              value={visitor.id}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f9fafb',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  visitorName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f9fafb',
    marginBottom: 12,
    textAlign: 'center',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f9fafb',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  detailIcon: {
    marginRight: 16,
    marginTop: 2,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#f9fafb',
    fontWeight: '500',
  },
  inventoryContainer: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  inventoryText: {
    fontSize: 16,
    color: '#f9fafb',
    lineHeight: 24,
  },
});