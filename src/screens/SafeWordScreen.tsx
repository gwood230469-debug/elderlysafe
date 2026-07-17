import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import { SafeWordForm } from '../components/SafeWordForm';
import { copy } from '../constants/copy';
import { useCircle } from '../context/CircleContext';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SafeWord'>;

export function SafeWordScreen(_props: Props) {
  const { saveSafeWord } = useCircle();
  return (
    <ScreenContainer>
      <SafeWordForm headline="Change your safe word" savedMessage={copy.safeword.changedNotification} onSaved={saveSafeWord} />
    </ScreenContainer>
  );
}
