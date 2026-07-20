import React from "react";
import { Platform } from "react-native";
import { act, fireEvent, render, screen } from "@testing-library/react-native";

import EmojiPickerField from "../EmojiPickerField.native";

const mockEmojiPicker = jest.fn((_props: unknown) => null);
const mockLightColors = {
  accent: "#111111",
  accentMuted: "#222222",
  accentSoftBg: "#333333",
  accentSoftBorder: "#444444",
  bgInset: "#555555",
  bgSurface: "#666666",
  borderStrong: "#777777",
  buttonPrimaryText: "#888888",
  inputBorder: "#999999",
  overlay: "#aaaaaa",
  textPrimary: "#bbbbbb",
  textSecondary: "#cccccc",
};
let mockColors = mockLightColors;
let mockLanguage: "en" | "ru" = "en";
const mockInsets = { bottom: 0, left: 0, right: 0, top: 0 };
const mutablePlatform = Platform as { OS: typeof Platform.OS };
const originalPlatform = Platform.OS;

jest.mock("emojibase-data/ru/compact.json", () => [
  { unicode: "🐶", label: "морда собаки", tags: ["собака", "питомец"] },
]);

jest.mock("rn-emoji-keyboard", () => ({
  __esModule: true,
  default: (props: { customButtons?: React.ReactNode; open: boolean }) => {
    mockEmojiPicker(props);
    return props.open ? props.customButtons : null;
  },
  emojisByCategory: [
    {
      title: "animals_nature",
      data: [{ emoji: "🐶", name: "dog face", v: "0.6", toneEnabled: false, keywords: ["dog", "pet"] }],
    },
  ],
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => mockInsets,
}));

jest.mock("@/hooks/useTheme", () => ({
  useTheme: () => ({ colors: mockColors }),
}));

jest.mock("@/i18n", () => {
  const { en } = jest.requireActual("@/i18n/locales/en");
  const { ru } = jest.requireActual("@/i18n/locales/ru");
  const catalogs = { en, ru };

  const getTranslation = (key: string) => {
    let value: unknown = catalogs[mockLanguage];

    for (const segment of key.split(".")) {
      value = (value as Record<string, unknown>)[segment];
    }

    return value as string;
  };

  return {
    translate: (key: string) => key,
    useTranslation: () => ({ i18n: { resolvedLanguage: mockLanguage }, t: getTranslation }),
  };
});

describe("EmojiPickerField", () => {
  beforeEach(() => {
    mockEmojiPicker.mockClear();
    mockColors = mockLightColors;
    mockLanguage = "en";
    Object.assign(mockInsets, { bottom: 0, left: 0, right: 0, top: 0 });
    mutablePlatform.OS = originalPlatform;
  });

  it("opens RN Emoji Keyboard with search enabled and returns the selected emoji", () => {
    const onChange = jest.fn();
    render(<EmojiPickerField value="" onChange={onChange} accessibilityLabel="Habit emoji" />);

    expect(mockEmojiPicker).toHaveBeenLastCalledWith(expect.objectContaining({ open: false, enableSearchBar: true }));

    fireEvent.press(screen.getByRole("button", { name: "Habit emoji" }));
    expect(mockEmojiPicker).toHaveBeenLastCalledWith(expect.objectContaining({ open: true, enableSearchBar: true }));

    const pickerProps = mockEmojiPicker.mock.lastCall![0] as {
      onEmojiSelected: (emoji: { emoji: string }) => void;
    };
    act(() => pickerProps.onEmojiSelected({ emoji: "🎯" }));

    expect(onChange).toHaveBeenCalledWith("🎯");
    expect(mockEmojiPicker).toHaveBeenLastCalledWith(expect.objectContaining({ open: false }));
  });

  it("closes from the accessible dismiss button without selecting an emoji", () => {
    const onChange = jest.fn();
    render(<EmojiPickerField value="" onChange={onChange} accessibilityLabel="Habit emoji" />);

    fireEvent.press(screen.getByRole("button", { name: "Habit emoji" }));
    fireEvent.press(screen.getByRole("button", { name: "Close emoji picker" }));

    expect(onChange).not.toHaveBeenCalled();
    expect(mockEmojiPicker).toHaveBeenLastCalledWith(expect.objectContaining({ open: false }));
  });

  it("adds the Android navigation-bar inset to the keyboard container", () => {
    mutablePlatform.OS = "android";
    mockInsets.bottom = 48;

    render(<EmojiPickerField value="" onChange={jest.fn()} />);

    expect(mockEmojiPicker).toHaveBeenLastCalledWith(
      expect.objectContaining({
        styles: {
          container: {
            paddingBottom: 48,
          },
        },
      })
    );
  });

  it("uses app-owned English and Russian category translations", () => {
    const { rerender } = render(<EmojiPickerField value="" onChange={jest.fn()} />);

    expect(mockEmojiPicker).toHaveBeenLastCalledWith(
      expect.objectContaining({
        translation: expect.objectContaining({
          smileys_emotion: "Smileys & Emotion",
          people_body: "People & Body",
          search: "Search",
        }),
      })
    );

    mockLanguage = "ru";
    rerender(<EmojiPickerField value="" onChange={jest.fn()} />);

    expect(mockEmojiPicker).toHaveBeenLastCalledWith(
      expect.objectContaining({
        translation: expect.objectContaining({
          smileys_emotion: "Смайлы и эмоции",
          people_body: "Люди и тело",
          search: "Поиск",
        }),
      })
    );

    const pickerProps = mockEmojiPicker.mock.lastCall![0] as {
      emojisByCategory: Array<{ data: Array<{ emoji: string; keywords?: string[] }> }>;
    };
    const dog = pickerProps.emojisByCategory.flatMap((category) => category.data).find((emoji) => emoji.emoji === "🐶");

    expect(dog?.keywords).toEqual(expect.arrayContaining(["dog", "pet", "морда собаки", "собака", "питомец"]));
  });

  it("updates the keyboard theme from YAHT light to dark colors", () => {
    const { rerender } = render(<EmojiPickerField value="" onChange={jest.fn()} />);

    expect(mockEmojiPicker).toHaveBeenLastCalledWith(
      expect.objectContaining({
        theme: expect.objectContaining({
          container: mockLightColors.bgSurface,
          header: mockLightColors.textPrimary,
        }),
      })
    );

    mockColors = {
      ...mockLightColors,
      bgInset: "#181818",
      bgSurface: "#090909",
      textPrimary: "#f5f5f5",
      textSecondary: "#b5b5b5",
      overlay: "rgba(0,0,0,0.74)",
    };
    rerender(<EmojiPickerField value="" onChange={jest.fn()} />);

    expect(mockEmojiPicker).toHaveBeenLastCalledWith(
      expect.objectContaining({
        theme: expect.objectContaining({
          backdrop: "rgba(0,0,0,0.74)",
          container: "#090909",
          header: "#f5f5f5",
          search: expect.objectContaining({
            background: "#181818",
            text: "#f5f5f5",
            placeholder: "#b5b5b5",
          }),
        }),
      })
    );
  });
});
