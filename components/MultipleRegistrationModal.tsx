import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { X, Plus, Minus, Users, Save } from 'lucide-react-native';
import { supabase, CreateVisitorData } from '@/lib/supabase';

interface VisitorFormProps extends CreateVisitorData {
  tempId: string;
}

interface MultipleRegistrationModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// VisitorForm component moved OUTSIDE main component
function VisitorForm({
  visitor,
  index,
  updateVisitor,
  removeVisitor,
  canRemove,
}: {
  visitor: VisitorFormProps;
  index: number;
  updateVisitor: (tempId: string, field: keyof CreateVisitorData, value: string) => void;
  removeVisitor: (tempId: string) => void;
  canRemove: boolean;
}) {
  return (
    <View style={styles.visitorForm}>
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>Visitor {index + 1}</Text>
        {canRemove && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeVisitor(visitor.tempId)}
          >
            <Minus size={20} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          value={visitor.name}
          onChangeText={(text) => updateVisitor(visitor.tempId, 'name', text)}
          placeholder="Enter full name"
          placeholderTextColor="#9ca3af"
          autoCorrect={false}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>NRC Number *</Text>
        <TextInput
          style={styles.input}
          value={visitor.nrc_no}
          onChangeText={(text) => updateVisitor(visitor.tempId, 'nrc_no', text)}
          placeholder="Enter NRC number"
          placeholderTextColor="#9ca3af"
          autoCorrect={false}
          autoCapitalize="characters"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={styles.input}
          value={visitor.phone_number}
          onChangeText={(text) => updateVisitor(visitor.tempId, 'phone_number', text)}
          placeholder="Enter phone number"
          placeholderTextColor="#9ca3af"
          keyboardType="phone-pad"
          autoCorrect={false}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Company Name</Text>
        <TextInput
          style={styles.input}
          value={visitor.company_name}
          onChangeText={(text) => updateVisitor(visitor.tempId, 'company_name', text)}
          placeholder="Enter company name"
          placeholderTextColor="#9ca3af"
          autoCorrect={false}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Visit Purpose</Text>
        <TextInput
          style={styles.input}
          value={visitor.visit_purpose}
          onChangeText={(text) => updateVisitor(visitor.tempId, 'visit_purpose', text)}
          placeholder="Enter purpose of visit"
          placeholderTextColor="#9ca3af"
          autoCorrect={false}
          autoCapitalize="sentences"
        />
      </View>
    </View>
  );
}

export default function MultipleRegistrationModal({
  visible,
  onClose,
  onSuccess,
}: MultipleRegistrationModalProps) {
  const [visitors, setVisitors] = useState<VisitorFormProps[]>([
    {
      tempId: '1',
      name: '',
      nrc_no: '',
      phone_number: '',
      company_name: '',
      visit_purpose: '',
      employee_card_number: '',
      access_container_no: '',
      access_rack_no: '',
      inventory_list: '',
    },
  ]);
  const [loading, setLoading] = useState(false);

  const addVisitor = () => {
    const newVisitor: VisitorFormProps = {
      tempId: Date.now().toString(),
      name: '',
      nrc_no: '',
      phone_number: '',
      company_name: '',
      visit_purpose: '',
      employee_card_number: '',
      access_container_no: '',
      access_rack_no: '',
      inventory_list: '',
    };
    setVisitors([...visitors, newVisitor]);
  };

  const removeVisitor = (tempId: string) => {
    if (visitors.length > 1) {
      setVisitors(visitors.filter((v) => v.tempId !== tempId));
    }
  };

  const updateVisitor = (
    tempId: string,
    field: keyof CreateVisitorData,
    value: string
  ) => {
    setVisitors(
      visitors.map((visitor) =>
        visitor.tempId === tempId ? { ...visitor, [field]: value } : visitor
      )
    );
  };

  const validateVisitors = (): boolean => {
    for (const visitor of visitors) {
      if (!visitor.name.trim() || !visitor.nrc_no.trim() || !visitor.phone_number.trim()) {
        Alert.alert(
          'Validation Error',
          'All visitors must have Name, NRC Number, and Phone Number filled.'
        );
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateVisitors()) return;

    setLoading(true);
    try {
      // Remove tempId before inserting
      const visitorData = visitors.map(({ tempId, ...visitor }) => visitor);

      const { error } = await supabase.from('dc_visitors').insert(visitorData);

      if (error) throw error;

      Alert.alert(
        'Success',
        `${visitors.length} visitor${visitors.length > 1 ? 's' : ''} registered successfully!`,
        [
          {
            text: 'OK',
            onPress: () => {
              onSuccess();
              onClose();
              // Reset form
              setVisitors([
                {
                  tempId: '1',
                  name: '',
                  nrc_no: '',
                  phone_number: '',
                  company_name: '',
                  visit_purpose: '',
                  employee_card_number: '',
                  access_container_no: '',
                  access_rack_no: '',
                  inventory_list: '',
                },
              ]);
            },
            
          },
        ]
      );
    } catch (error) {
      console.error('Error registering visitors:', error);
      Alert.alert('Error', 'Failed to register visitors. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Multiple Registration</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {visitors.map((visitor, index) => (
            <VisitorForm
              key={visitor.tempId}
              visitor={visitor}
              index={index}
              updateVisitor={updateVisitor}
              removeVisitor={removeVisitor}
              canRemove={visitors.length > 1}
            />
          ))}

          <TouchableOpacity style={styles.addButton} onPress={addVisitor}>
            <Plus size={24} color="#3b82f6" />
            <Text style={styles.addButtonText}>Add Another Visitor</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.summaryContainer}>
            <Users size={20} color="#9ca3af" />
            <Text style={styles.summaryText}>
              {visitors.length} visitor{visitors.length > 1 ? 's' : ''} to register
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Save size={20} color="#ffffff" />
            <Text style={styles.submitButtonText}>
              {loading ? 'Registering...' : 'Register All Visitors'}
            </Text>
          </TouchableOpacity>
        </View>
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
  visitorForm: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f9fafb',
  },
  removeButton: {
    backgroundColor: '#374151',
    borderRadius: 20,
    padding: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f9fafb',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#f9fafb',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderStyle: 'dashed',
  },
  addButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  summaryText: {
    color: '#9ca3af',
    marginLeft: 8,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
});
