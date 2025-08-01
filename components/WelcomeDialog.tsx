import * as React from "react";
import {
  View,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Text } from "~/components/ui/text";

interface WelcomeDialogProps {
  visible: boolean;
  onComplete: (name: string) => void;
}

export function WelcomeDialog({ visible, onComplete }: WelcomeDialogProps) {
  const [name, setName] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      Alert.alert(
        "Please enter your name",
        "We need your name to personalize your experience!",
      );
      return;
    }

    if (trimmedName.length < 2) {
      Alert.alert(
        "Name too short",
        "Please enter at least 2 characters for your name.",
      );
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
    <Dialog open={visible}>
      <DialogContent className="w-full max-w-md">
        <ScrollView
          contentContainerStyle={{ paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <DialogHeader className="text-center">
            <View className="items-center mb-4">
              <Text className="text-4xl mb-2">🌟</Text>
              <DialogTitle className="text-2xl font-bold">
                Welcome to SelfSync!
              </DialogTitle>
            </View>
            <DialogDescription className="text-center">
              Your personal wellness companion is here to support your journey
              toward better mental health and positive habits.
            </DialogDescription>
          </DialogHeader>

          <View className="space-y-6 mt-6 gap-3">
            <View>
              <Text className="text-lg font-semibold mb-2">
                What's your first name?
              </Text>
              <Text className="text-sm text-muted-foreground mb-4">
                We'll use this to personalize your experience and make SelfSync
                feel more like a supportive friend.
              </Text>

              <Input
                className="w-full p-4 text-lg min-h-[56px]"
                value={name}
                onChangeText={setName}
                placeholder="Enter your first name"
                autoFocus={true}
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={50}
                onSubmitEditing={handleSubmit}
                returnKeyType="done"
              />
            </View>

            <View className="space-y-4 pt-4">
              <Button
                onPress={handleSubmit}
                disabled={isSubmitting || !name.trim()}
                className="w-full min-h-[48px]"
              >
                <Text className="text-lg">
                  {isSubmitting ? "Setting up..." : "Get Started"}
                </Text>
              </Button>

              <Text className="text-xs text-center text-muted-foreground">
                Your privacy is important to us. All data stays on your device.
              </Text>
            </View>
          </View>
        </ScrollView>
      </DialogContent>
    </Dialog>
  );
}
