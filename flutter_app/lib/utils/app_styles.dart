import 'package:flutter/material.dart';

class AppStyles {
  // Login Screen Icon Style
  static const double loginIconSize = 80.0;
  static const Color loginIconColor = Colors.deepPurple;

  // Input Decoration for TextFields
  static InputDecoration inputDecoration(String labelText, IconData iconData) {
    return InputDecoration(
      labelText: labelText,
      border: const OutlineInputBorder(),
      prefixIcon: Icon(iconData),
    );
  }

  // Button Style
  static final ButtonStyle primaryButtonStyle = ElevatedButton.styleFrom(
    padding: const EdgeInsets.symmetric(vertical: 16),
    textStyle: const TextStyle(fontSize: 18),
  );
}
