import React from "react";
import { Text } from "react-native";
import { render, screen } from "@testing-library/react-native";

describe("testing setup", () => {
  it("renders React Native components", () => {
    render(<Text>Smoke Test</Text>);
    expect(screen.getByText("Smoke Test")).toBeOnTheScreen();
  });
});
