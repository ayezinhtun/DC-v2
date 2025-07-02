import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Eye, LogOut, Trash2, Clock } from 'lucide-react-native';
import { DCVisitor } from '@/lib/supabase';
import { formatDuration } from '@/lib/csvExport';

interface VisitorCardProps {
  visitor: DCVisitor;
  onViewDetails: (visitor: DCVisitor) => void;
  onCheckOut: (visitorId: string) => void;
  onDelete: (visitorId: string) => void;
}

export default function VisitorCard({
  visitor,
  onViewDetails,
  onCheckOut,
  onDelete,
}: VisitorCardProps) {
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = () => {
    return visitor.out_time ? '#10b981' : '#f59e0b';
  };

  const getStatusText = () => {
    return visitor.out_time ? 'Checked Out' : 'In Site';
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Visitor Record',
      `Are you sure you want to delete ${visitor.name}'s record? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(visitor.id),
        },
      ]
    );
  };

  return (
    <View style={styles.visitorCard}>
      <View style={styles.visitorHeader}>
        <View style={styles.visitorInfo}>
          {visitor.photo_url && (
            <Image source={{ uri: visitor.photo_url }} style={styles.visitorPhoto} />
          )}
          <View style={styles.visitorDetails}>
            <Text style={styles.visitorName}>{visitor.name}</Text>
            <Text style={styles.visitorNRC}>NRC: {visitor.nrc_no}</Text>
            {visitor.company_name && (
              <Text style={styles.visitorCompany}>{visitor.company_name}</Text>
            )}
          </View>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.visitorMeta}>
        <View style={styles.timeInfo}>
          <Clock size={16} color="#9ca3af" />
          <Text style={styles.timeLabel}>Entry:</Text>
          <Text style={styles.timeValue}>{formatDateTime(visitor.in_time)}</Text>
        </View>
        {visitor.out_time && (
          <View style={styles.timeInfo}>
            <Clock size={16} color="#9ca3af" />
            <Text style={styles.timeLabel}>Exit:</Text>
            <Text style={styles.timeValue}>{formatDateTime(visitor.out_time)}</Text>
          </View>
        )}
        <View style={styles.timeInfo}>
          <Text style={styles.timeLabel}>Duration:</Text>
          <Text style={styles.timeValue}>
            {formatDuration(visitor.in_time, visitor.out_time)}
          </Text>
        </View>
      </View>

      {visitor.visit_purpose && (
        <View style={styles.purposeContainer}>
          <Text style={styles.purposeLabel}>Purpose:</Text>
          <Text style={styles.purposeText}>{visitor.visit_purpose}</Text>
        </View>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onViewDetails(visitor)}
        >
          <Eye size={18} color="#3b82f6" />
          <Text style={styles.actionButtonText}>Details</Text>
        </TouchableOpacity>

        {!visitor.out_time && (
          <TouchableOpacity
            style={[styles.actionButton, styles.checkoutButton]}
            onPress={() => onCheckOut(visitor.id)}
          >
            <LogOut size={18} color="#ffffff" />
            <Text style={[styles.actionButtonText, styles.checkoutButtonText]}>
              Check Out
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
        >
          <Trash2 size={18} color="#ef4444" />
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  visitorCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  visitorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  visitorInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  visitorPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  visitorDetails: {
    flex: 1,
  },
  visitorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f9fafb',
    marginBottom: 4,
  },
  visitorNRC: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 2,
  },
  visitorCompany: {
    fontSize: 14,
    color: '#60a5fa',
    fontWeight: '500',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  visitorMeta: {
    marginBottom: 12,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  timeLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginLeft: 8,
    width: 60,
  },
  timeValue: {
    fontSize: 14,
    color: '#f9fafb',
    flex: 1,
  },
  purposeContainer: {
    marginBottom: 12,
  },
  purposeLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  purposeText: {
    fontSize: 14,
    color: '#f9fafb',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  checkoutButton: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  deleteButton: {
    backgroundColor: 'transparent',
    borderColor: '#ef4444',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    marginLeft: 6,
  },
  checkoutButtonText: {
    color: '#ffffff',
  },
  deleteButtonText: {
    color: '#ef4444',
  },
});