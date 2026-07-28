import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { SafeWordForm } from '../components/SafeWordForm';
import { copy } from '../constants/copy';
import { useCircle } from '../context/CircleContext';
import { useProfile } from '../context/ProfileContext';
import { getErrorMessage } from '../lib/errors';
import { exportSafeWordCard } from '../lib/safeWordCard';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SafeWord'>;

export function SafeWordScreen(_props: Props) {
  const { saveSafeWord } = useCircle();
  const { displayName } = useProfile();

  async function handleExportCard(rawValue: string) {
    try {
      await exportSafeWordCard({ circleOwnerName: displayName ?? 'Our family', safeWord: rawValue });
    } catch (e) {
      Alert.alert('Could not create card', getErrorMessage(e, copy.safeword.exportCardError));
    }
  }

  return (
    <ScreenContainer>
      <SafeWordForm
        headline="Change your safe word"
        savedMessage={copy.safeword.changedNotification}
        onSaved={saveSafeWord}
        onExportCard={handleExportCard}
      />
    </ScreenContainer>
  );
}
