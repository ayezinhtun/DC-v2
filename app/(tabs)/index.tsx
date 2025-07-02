import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Camera, Upload, X, CircleCheck as CheckCircle } from 'lucide-react-native';
import { supabase, CreateVisitorData } from '@/lib/supabase';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function NewEntryScreen() {
  const [formData, setFormData] = useState<CreateVisitorData>({
    name: '',
    nrc_no: '',
    phone_number: '',
    company_name: '',
    visit_purpose: '',
    employee_card_number: '',
    access_container_no: '',
    access_rack_no: '',
    inventory_list: '',
  });

  const [showCamera, setShowCamera] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('front');
  const cameraRef = useRef<CameraView>(null);

  const handleInputChange = (field: keyof CreateVisitorData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        if (photo) {
          setPhotoUri(photo.uri);
          setShowCamera(false);
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture. Please try again.');
      }
    }
  };

  const uploadPhoto = async (uri: string): Promise<string | null> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('visitor-photos')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('visitor-photos')
        .getPublicUrl(fileName);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.nrc_no || !formData.phone_number) {
      Alert.alert('Error', 'Please fill in all required fields (Name, NRC No., Phone Number)');
      return;
    }

    setLoading(true);
    try {
      let photoUrl: string | undefined;
      
      if (photoUri) {
        photoUrl = await uploadPhoto(photoUri) || undefined;
      }

      const visitorData: CreateVisitorData = {
        ...formData,
        photo_url: photoUrl,
      };

      const { error } = await supabase
        .from('dc_visitors')
        .insert([visitorData]);

      if (error) throw error;

      if (showCamera) {
  setShowCamera(false);
  await new Promise(resolve => setTimeout(resolve, 300)); // Wait for modal close animation
}

      console.log('Submission success, showing alert...');

      Alert.alert(
        'Success',
        'Visitor entry recorded successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setFormData({
                name: '',
                nrc_no: '',
                phone_number: '',
                company_name: '',
                visit_purpose: '',
                employee_card_number: '',
                access_container_no: '',
                access_rack_no: '',
                inventory_list: '',
              });
              setPhotoUri(null);
            },
          },
        ]
      );
      
      
    } catch (error) {
      console.error('Error submitting form:', error);
      Alert.alert('Error', 'Failed to record visitor entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openCamera = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }
    }
    setShowCamera(true);
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>DC Site Access Entry</Text>
          <Text style={styles.subtitle}>Please complete all required fields</Text>
        </View>

        {/* Photo Section */}
        <View style={styles.photoSection}>
          <Text style={styles.sectionTitle}>Visitor Photo *</Text>
          {photoUri ? (
            <View style={styles.photoContainer}>
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
              <TouchableOpacity
                style={styles.retakeButton}
                onPress={() => setPhotoUri(null)}
              >
                <X size={20} color="#ef4444" />
                <Text style={styles.retakeText}>Retake</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.photoPlaceholder} onPress={openCamera}>
              <Camera size={48} color="#6b7280" />
              <Text style={styles.photoPlaceholderText}>Tap to take photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => handleInputChange('name', text)}
              placeholder="Enter full name"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>NRC Number *</Text>
            <TextInput
              style={styles.input}
              value={formData.nrc_no}
              onChangeText={(text) => handleInputChange('nrc_no', text)}
              placeholder="Enter NRC number"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              value={formData.phone_number}
              onChangeText={(text) => handleInputChange('phone_number', text)}
              placeholder="Enter phone number"
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Company Name</Text>
            <TextInput
              style={styles.input}
              value={formData.company_name}
              onChangeText={(text) => handleInputChange('company_name', text)}
              placeholder="Enter company name"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Visit Purpose</Text>
            <TextInput
              style={styles.input}
              value={formData.visit_purpose}
              onChangeText={(text) => handleInputChange('visit_purpose', text)}
              placeholder="Enter purpose of visit"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Employee Card Number</Text>
            <TextInput
              style={styles.input}
              value={formData.employee_card_number}
              onChangeText={(text) => handleInputChange('employee_card_number', text)}
              placeholder="Enter employee card number"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Access Container No.</Text>
            <TextInput
              style={styles.input}
              value={formData.access_container_no}
              onChangeText={(text) => handleInputChange('access_container_no', text)}
              placeholder="Enter container number"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Access Rack No.</Text>
            <TextInput
              style={styles.input}
              value={formData.access_rack_no}
              onChangeText={(text) => handleInputChange('access_rack_no', text)}
              placeholder="Enter rack number"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Inventory List</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.inventory_list}
              onChangeText={(text) => handleInputChange('inventory_list', text)}
              placeholder="Enter inventory details..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <Text style={styles.submitButtonText}>Recording Entry...</Text>
          ) : (
            <>
              <CheckCircle size={24} color="#ffffff" />
              <Text style={styles.submitButtonText}>Record Entry</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Camera Modal */}
      <Modal visible={showCamera} animationType="slide">
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
          >
            <View style={styles.cameraOverlay}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCamera(false)}
              >
                <X size={24} color="#ffffff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.flipButton}
                onPress={toggleCameraFacing}
              >
                <Text style={styles.flipButtonText}>Flip</Text>
              </TouchableOpacity>

              <View style={styles.cameraControls}>
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={takePicture}
                >
                  <View style={styles.captureButtonInner} />
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
        </View>
      </Modal>
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
  photoSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f9fafb',
    marginBottom: 12,
  },
  photoContainer: {
    alignItems: 'center',
  },
  photoPreview: {
    width: 150,
    height: 150,
    borderRadius: 12,
    marginBottom: 12,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retakeText: {
    color: '#ef4444',
    marginLeft: 8,
    fontWeight: '600',
  },
  photoPlaceholder: {
    backgroundColor: '#374151',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4b5563',
    borderStyle: 'dashed',
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: {
    color: '#9ca3af',
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  formSection: {
    paddingHorizontal: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f9fafb',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#f9fafb',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 12,
    margin: 24,
    marginTop: 32,
  },
  submitButtonDisabled: {
    backgroundColor: '#6b7280',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 25,
    padding: 10,
    zIndex: 1,
  },
  flipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 1,
  },
  flipButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  cameraControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
  },
});