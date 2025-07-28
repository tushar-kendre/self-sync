import * as React from 'react';
import { View, TextInput, Modal, Alert } from 'react-native';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Text } from '~/components/ui/text';

interface WelcomeDialogProps {
  visible: boolean;
  onComplete: (name: string) => void;
}

export function WelcomeDialog({ visible, onComplete }: WelcomeDialogProps) {
  const [name, setName] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      Alert.alert('Please enter your name', 'We need your name to personalize your experience!');
      return;
    }

    if (trimmedName.length < 2) {
      Alert.alert('Name too short', 'Please enter at least 2 characters for your name.');
      return;
    }

    setIsSubmitting(true);
    try {
      onComplete(trimmedName);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      statusBarTranslucent={true}
    >
      <View className="flex-1 bg-black/50 justify-center items-center p-6">
        <Card className="w-full max-w-md bg-background">
          <CardHeader className="text-center">
            <View className="items-center mb-4">
              <Text className="text-4xl mb-2">🌟</Text>
              <CardTitle className="text-2xl font-bold">
                <Text>Welcome to SelfSync!</Text>
              </CardTitle>
            </View>
            <Text className="text-center text-muted-foreground">
              Your personal wellness companion is here to support your journey toward better mental health and positive habits.
            </Text>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <View>
              <Text className="text-lg font-semibold mb-2">What's your first name?</Text>
              <Text className="text-sm text-muted-foreground mb-3">
                We'll use this to personalize your experience and make SelfSync feel more like a supportive friend.
              </Text>
              
              <TextInput
                className="w-full p-4 border border-border rounded-lg text-foreground bg-background text-lg"
                value={name}
                onChangeText={setName}
                placeholder="Enter your first name"
                placeholderTextColor="#999"
                autoFocus={true}
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={50}
                onSubmitEditing={handleSubmit}
                returnKeyType="done"
              />
            </View>

            <View className="space-y-3">
              <Button
                onPress={handleSubmit}
                disabled={isSubmitting || !name.trim()}
                className="w-full"
              >
                <Text className="text-lg">
                  {isSubmitting ? 'Setting up...' : 'Get Started'}
                </Text>
              </Button>
              
              <Text className="text-xs text-center text-muted-foreground">
                Your privacy is important to us. All data stays on your device.
              </Text>
            </View>
          </CardContent>
        </Card>
      </View>
    </Modal>
  );
}
