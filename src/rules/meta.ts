import type { Platform } from '../types';

/**
 * Platform tags for rules. Only platform-specific rules are listed here.
 * Any rule NOT in this map is universal (included on all platforms).
 */
export const rulePlatforms: Partial<Record<string, Platform[]>> = {
  // Expo / React Native
  'no-stylesheet-create': ['expo'],
  'no-safeareaview': ['expo'],
  'no-tab-bar-height': ['expo'],
  'no-border-width-on-glass': ['expo'],
  'expo-image-import': ['expo'],
  'scrollview-horizontal-flexgrow': ['expo'],
  'glass-needs-fallback': ['expo'],
  'glass-interactive-prop': ['expo'],
  'header-shown-false': ['expo'],
  'expo-font-loaded-check': ['expo'],
  'tabs-screen-options-header-shown': ['expo'],
  'native-tabs-bottom-padding': ['expo'],
  'glass-no-opacity-animation': ['expo'],
  'textinput-keyboard-avoiding': ['expo'],
  'transition-worklet-directive': ['expo'],
  'transition-progress-range': ['expo'],
  'transition-gesture-scrollview': ['expo'],
  'transition-shared-tag-mismatch': ['expo'],
  'transition-prefer-blank-stack': ['expo'],

  // Web
  'no-inline-script-code': ['web'],
  'browser-api-in-useeffect': ['web'],
  'no-tailwind-animation-classes': ['web'],
  'require-use-client': ['web'],
  'no-server-import-in-client': ['web'],
  'ssr-browser-api-guard': ['web'],
  'no-react-native-in-web': ['web'],
  'no-module-level-new': ['web'],

  // Expo + Web (shared frontend)
  'no-relative-paths': ['expo', 'web'],
  'no-class-components': ['expo', 'web'],
  'no-react-query-missing': ['expo', 'web'],
  'no-complex-jsx-expressions': ['expo', 'web'],
  'prefer-lucide-icons': ['expo', 'web'],

  // Web + Backend
  'fetch-response-ok-check': ['web', 'backend'],

  // Backend only
  'no-require-statements': ['backend'],
  'no-response-json-lowercase': ['backend'],
  'sql-no-nested-calls': ['backend'],
  'no-sync-fs': ['backend'],
  'no-unrestricted-loop-in-serverless': ['backend'],
  'no-deprecated-url-parse': ['backend'],

  // Universal rules (NOT listed here): prefer-guard-clauses, no-type-assertion,
  // no-string-coerce-error
};
