import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, ScrollView, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ProfileHeader from '@/src/components/cliente/profile/ProfileHeader';
import GallerySection from '@/src/components/cliente/profile/GallerySection';
import IntroCard from '@/src/components/cliente/profile/IntroCard';
import { apiGetMyProfile } from '@/src/api/anfitrionaProfile';
import { apiGetMyGallery } from '@/src/api/anfitrionaGallery';
import type { GalleryItemPublic } from '@/src/types/gallery';

export default function VistaPrevia() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [rateCredits, setRateCredits] = useState<number | null>(null);
  const [bio, setBio] = useState('');
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryItemPublic[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [profile, gallery] = await Promise.all([
          apiGetMyProfile(),
          apiGetMyGallery(),
        ]);

        setName(
          [profile.firstName, profile.lastName].filter(Boolean).join(' ') ||
          profile.username,
        );
        setAvatar(profile.avatarUrl);
        setCoverUrl(profile.coverUrl);
        setIsOnline(profile.isOnline);
        setLikesCount(profile.likesCount);
        setRateCredits(profile.rateCredits);
        setBio(profile.bio);

        // Solo imágenes visibles; traducir al shape que espera GallerySection
        const publicImages: GalleryItemPublic[] = gallery
          .filter((img) => img.isVisible)
          .map((img) => ({
            id: img.id,
            imageUrl: img.imageUrl,
            isPremium: img.isPremium,
            unlockCredits: img.unlockCredits,
            isUnlockedByViewer: false, // en preview siempre bloqueadas
          }));
        setGalleryImages(publicImages);
      } catch {
        // silencioso — se muestra vacío
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#111' }}>
      <Stack.Screen options={{ headerShown: false }} />

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#ef4444" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        >
          {/* Banner "Vista previa" */}
          <View
            style={{
              backgroundColor: '#1c0a00',
              borderBottomWidth: 1,
              borderBottomColor: '#7f1d1d',
              paddingTop: insets.top + 10,
              paddingBottom: 12,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <TouchableOpacity onPress={() => router.back()}>
              <MaterialCommunityIcons name="arrow-left" size={22} color="#ef4444" />
            </TouchableOpacity>
            <MaterialCommunityIcons name="eye-outline" size={18} color="#ef4444" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 14 }}>
                Vista previa del cliente
              </Text>
              <Text style={{ color: '#a1a1aa', fontSize: 11, marginTop: 1 }}>
                Así te ve un cliente cuando visita tu perfil
              </Text>
            </View>
          </View>

          <ProfileHeader
            name={name}
            avatar={avatar ?? ''}
            coverImage={coverUrl ?? galleryImages[0]?.imageUrl ?? avatar ?? ''}
            isOnline={isOnline}
            likesCount={likesCount}
            rateCredits={rateCredits}
          />

          <GallerySection
            images={galleryImages}
            readOnly
          />

          <IntroCard message={bio} />

        </ScrollView>
      )}
    </View>
  );
}
