import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Camera, X, Plus, Minus, Users, Save } from 'lucide-react-native';
import { supabase, CreateVisitorData } from '@/lib/supabase';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface VisitorFormProps extends CreateVisitorData {
  tempId: string;
  photo_url?: string | null; // Added for local image preview
}

interface MultipleRegistrationModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Shared uploadPhoto function
const uploadPhoto = async (uri: string): Promise<string | undefined> => {
  try {
    let blob: Blob;
    let fileExt = 'jpg'; // default

    if (uri.startsWith('data:image')) {
      const matches = uri.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) throw new Error('Invalid base64 image');

      const mimeType = matches[1];
      const base64Data = matches[2];
      fileExt = mimeType.split('/')[1];

      const byteCharacters = atob(base64Data);
      const byteArrays = [];

      for (let i = 0; i < byteCharacters.length; i += 512) {
        const slice = byteCharacters.slice(i, i + 512);
        const byteNumbers = new Array(slice.length);
        for (let j = 0; j < slice.length; j++) {
          byteNumbers[j] = slice.charCodeAt(j);
        }
        byteArrays.push(new Uint8Array(byteNumbers));
      }

      blob = new Blob(byteArrays, { type: mimeType });
    } else {
      const response = await fetch(uri);
      blob = await response.blob();
      const parts = uri.split('.');
      fileExt = parts[parts.length - 1];
    }

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('visitor-photos')
      .upload(fileName, blob, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('❌ Upload error:', error);
      return undefined;
    }

    const { data: publicUrlData, error: urlError } = supabase.storage
      .from('visitor-photos')
      .getPublicUrl(fileName);

    if (urlError || !publicUrlData?.publicUrl) {
      console.error('❌ Public URL error:', urlError);
      return undefined;
    }

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('❌ uploadPhoto failed:', err);
    return undefined;
  }
};

function VisitorForm({
  visitor,
  index,
  updateVisitor,
  removeVisitor,
  canRemove,
  openCameraForVisitor,
}: {
  visitor: VisitorFormProps;
  index: number;
  updateVisitor: (tempId: string, field: keyof CreateVisitorData | 'photo_url', value: string) => void;
  removeVisitor: (tempId: string) => void;
  canRemove: boolean;
  openCameraForVisitor: (tempId: string) => void;
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

      {/* Photo Section */}
      <View style={styles.photoSection}>
        <Text style={styles.label}>Visitor Photo *</Text>
        {visitor.photo_url ? (
          <View style={styles.photoContainer}>
            <Image source={{ uri: visitor.photo_url}} style={styles.photoPreview} />
            <TouchableOpacity
              style={styles.retakeButton}
              onPress={() => updateVisitor(visitor.tempId, 'photo_url', '')}
            >
              <X size={20} color="#ef4444" />
              <Text style={styles.retakeText}>Retake</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.photoPlaceholder}
            onPress={() => openCameraForVisitor(visitor.tempId)}
          >
            <Camera size={48} color="#6b7280" />
            <Text style={styles.photoPlaceholderText}>Tap to take photo</Text>
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
      photo_url: null,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [activeVisitorId, setActiveVisitorId] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('front');
  const cameraRef = useRef<CameraView>(null);

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
      photo_url: null,
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
    field: keyof CreateVisitorData | 'photo_url',
    value: string
  ) => {
    setVisitors(
      visitors.map((visitor) =>
        visitor.tempId === tempId ? { ...visitor, [field]: value } : visitor
      )
    );
  };

  const openCameraForVisitor = async (tempId: string) => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }
    }
    setActiveVisitorId(tempId);
    setShowCamera(true);
  };

  const takePicture = async () => {
    if (cameraRef.current && activeVisitorId) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        if (photo) {
          updateVisitor(activeVisitorId, 'photo_url', photo.uri);
          setShowCamera(false);
          setActiveVisitorId(null);
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture. Please try again.');
      }
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
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
      if (!visitor.photo_url) {
        Alert.alert(
          'Validation Error',
          `Please take a photo for Visitor ${visitors.indexOf(visitor) + 1}.`
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
      // Upload photos and prepare visitor data
      const visitorDataPromises = visitors.map(async (visitor) => {
        let photoUrl: string | undefined;
        if (visitor.photo_url) {
          photoUrl = await uploadPhoto(visitor.photo_url);
          if (!photoUrl) {
            console.warn(`Photo upload failed for visitor ${visitor.name}`);
          }
        }
        const { tempId, ...rest } = visitor;
        return { ...rest, photo_url: photoUrl };
      });

      const visitorData = await Promise.all(visitorDataPromises);

      const { error } = await supabase.from('dc_visitors').insert(visitorData);

      if (error) {
        Alert.alert('Submission Error', error.message);
      } else {
        Alert.alert('Success', 'Visitors registered successfully.');
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
            photo_url: null,
          },
        ]);
        onSuccess();
        onClose();
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>
              <Users size={22} /> Multiple Visitor Registration
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={22} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView}>
            {visitors.map((visitor, idx) => (
              <VisitorForm
                key={visitor.tempId}
                visitor={visitor}
                index={idx}
                updateVisitor={updateVisitor}
                removeVisitor={removeVisitor}
                canRemove={visitors.length > 1}
                openCameraForVisitor={openCameraForVisitor}
              />
            ))}

            <TouchableOpacity style={styles.addButton} onPress={addVisitor}>
              <Plus size={20} color="#3b82f6" />
              <Text style={styles.addButtonText}>Add Visitor</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.disabledButton]}
              disabled={loading}
              onPress={handleSubmit}
            >
              {loading ? (
                <Text style={styles.submitButtonText}>Registering...</Text>
              ) : (
                <>
                  <Save size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>Register All</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>

          {/* Camera Modal */}
          {showCamera && (
            <Modal visible={showCamera} animationType="slide">
                <View style={styles.cameraControls}>
                  <TouchableOpacity onPress={toggleCameraFacing} style={styles.controlButton}>
                    <Camera size={32} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={takePicture} style={styles.captureButton} />
                  <TouchableOpacity onPress={() => setShowCamera(false)} style={styles.controlButton}>
                    <X size={32} color="#fff" />
                  </TouchableOpacity>
                </View>
              <View style={styles.cameraModal}>
                <CameraView
                  ref={cameraRef}
                  style={styles.camera}
                  facing={facing}
                  photo
                />
              
              </View>
            </Modal>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',

  },
  modalContent: {
    backgroundColor: '#111827',
    marginHorizontal: 12,
    borderRadius: 8,
    maxHeight: screenHeight * 0.9,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    padding: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomColor: '#e5e7eb',
    borderBottomWidth: 1,
    color: '#f9fafb'
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    flexDirection: 'row',
    alignItems: 'center',
    color: '#f9fafb'
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  visitorForm: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginTop: 20,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#f9fafb'
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f9fafb',
  
  },
  removeButton: {
    padding: 4,
  },
  photoSection: {
    marginVertical: 12,
  },
  label: {
    fontWeight: '600',
    marginBottom: 4,
    color: '#f9fafb',
    paddingVertical: 5,
    marginVertical: 10
  },
  photoPlaceholder: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#9ca3af',
  },
  photoPlaceholderText: {
    marginTop: 6,
    color: '#9ca3af',
    fontSize: 12,
  },
  photoContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  retakeText: {
    marginLeft: 4,
    color: '#ef4444',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#ffffff',
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
    marginVertical: 10,
  },
  addButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginVertical: 10
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 8,
  },
  cameraModal: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'flex-end',
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  controlButton: {
    padding: 16,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ffffff',
    alignSelf: 'center',
  },
});
