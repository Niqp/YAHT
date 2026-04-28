import "@testing-library/react-native/extend-expect";

jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageTag: "en-US", languageCode: "en" }],
}));

jest.mock("react-native-emoji-popup", () => {
  const React = require("react");

  return {
    EmojiPopup: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  };
});
