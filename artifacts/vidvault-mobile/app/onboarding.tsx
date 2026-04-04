import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    icon: "film" as const,
    title: "Save Any Video",
    subtitle: "Paste any YouTube URL to instantly save it to your personal knowledge vault.",
    color: "#7c3aed",
  },
  {
    icon: "cpu" as const,
    title: "AI-Powered Insights",
    subtitle: "Generate summaries, study notes, flashcards, and quizzes with one tap.",
    color: "#2563eb",
  },
  {
    icon: "folder" as const,
    title: "Organize & Discover",
    subtitle: "Sort videos into folders, tag them, and chat with AI to find exactly what you need.",
    color: "#059669",
  },
];

const ONBOARDING_KEY = "vidvault_onboarding_done";

const completeOnboarding = async () => {
  await AsyncStorage.setItem(ONBOARDING_KEY, "true");
  router.replace("/login");
};

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState(0);

  const isLast = current === SLIDES.length - 1;
  const slide = SLIDES[current];

  const next = () => {
    if (isLast) {
      completeOnboarding();
    } else {
      setCurrent((c) => c + 1);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0), paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) }]}>
      <TouchableOpacity onPress={completeOnboarding} style={styles.skip}>
        <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Skip</Text>
      </TouchableOpacity>

      <View style={styles.slideContent}>
        <View style={[styles.iconCircle, { backgroundColor: slide.color + "20" }]}>
          <View style={[styles.iconInner, { backgroundColor: slide.color + "30" }]}>
            <Feather name={slide.icon} size={42} color={slide.color} />
          </View>
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>{slide.title}</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{slide.subtitle}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === current ? colors.primary : colors.border,
                  width: i === current ? 20 : 8,
                },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          onPress={next}
          style={[styles.nextBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
        >
          <Text style={[styles.nextText, { color: colors.primaryForeground }]}>
            {isLast ? "Get Started" : "Continue"}
          </Text>
          <Feather name="arrow-right" size={18} color={colors.primaryForeground} style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 32,
  },
  skip: {
    alignSelf: "flex-end",
    paddingVertical: 16,
  },
  skipText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  slideContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 48,
  },
  iconInner: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 24,
  },
  footer: {
    paddingVertical: 32,
    gap: 24,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 100,
  },
  nextText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
