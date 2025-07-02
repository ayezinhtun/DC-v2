import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { DCVisitor } from './supabase';

export interface ExportOptions {
  includePhotos?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  status?: 'all' | 'active' | 'checked_out';
}

export const exportToCSV = async (
  visitors: DCVisitor[],
  options: ExportOptions = {}
): Promise<void> => {
  try {
    // Filter visitors based on options
    let filteredVisitors = visitors;

    if (options.dateRange) {
      filteredVisitors = visitors.filter(visitor => {
        const visitDate = new Date(visitor.in_time);
        return visitDate >= options.dateRange!.start && visitDate <= options.dateRange!.end;
      });
    }

    if (options.status && options.status !== 'all') {
      filteredVisitors = visitors.filter(visitor => {
        if (options.status === 'active') return !visitor.out_time;
        if (options.status === 'checked_out') return !!visitor.out_time;
        return true;
      });
    }

    // Create CSV headers
    const headers = [
      'ID',
      'Name',
      'NRC Number',
      'Phone Number',
      'Company Name',
      'Visit Purpose',
      'Employee Card Number',
      'Access Container No',
      'Access Rack No',
      'Inventory List',
      'Entry Time',
      'Exit Time',
      'Duration (Hours)',
      'Status',
      'Created At',
      'Updated At'
    ];

    if (options.includePhotos) {
      headers.push('Photo URL');
    }

    // Create CSV rows
    const rows = filteredVisitors.map(visitor => {
      const entryTime = new Date(visitor.in_time);
      const exitTime = visitor.out_time ? new Date(visitor.out_time) : null;
      const duration = exitTime 
        ? ((exitTime.getTime() - entryTime.getTime()) / (1000 * 60 * 60)).toFixed(2)
        : 'N/A';

      const row = [
        visitor.id,
        `"${visitor.name}"`,
        `"${visitor.nrc_no}"`,
        `"${visitor.phone_number}"`,
        `"${visitor.company_name || ''}"`,
        `"${visitor.visit_purpose || ''}"`,
        `"${visitor.employee_card_number || ''}"`,
        `"${visitor.access_container_no || ''}"`,
        `"${visitor.access_rack_no || ''}"`,
        `"${visitor.inventory_list || ''}"`,
        `"${entryTime.toLocaleString()}"`,
        `"${exitTime ? exitTime.toLocaleString() : 'Still in site'}"`,
        duration,
        visitor.out_time ? 'Checked Out' : 'In Site',
        `"${new Date(visitor.created_at).toLocaleString()}"`,
        `"${new Date(visitor.updated_at).toLocaleString()}"`
      ];

      if (options.includePhotos) {
        row.push(`"${visitor.photo_url || ''}"`);
      }

      return row.join(',');
    });

    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows].join('\n');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `dc_visitors_${timestamp}.csv`;

    if (Platform.OS === 'web') {
      // Web platform - download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Mobile platform - save and share file
      const fileUri = FileSystem.documentDirectory + filename;
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Visitor Data',
        });
      }
    }
  } catch (error) {
    console.error('Error exporting CSV:', error);
    throw new Error('Failed to export data to CSV');
  }
};

export const formatDuration = (inTime: string, outTime?: string): string => {
  const entry = new Date(inTime);
  const exit = outTime ? new Date(outTime) : new Date();
  const diffMs = exit.getTime() - entry.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};