import type { RuleFunction } from '../types';
import { noRelativePaths } from './no-relative-paths';
import { noRequireStatements } from './no-require-statements';
import { noStylesheetCreate } from './no-stylesheet-create';
import { noSafeAreaView } from './no-safeareaview';
import { noClassComponents } from './no-class-components';
import { noTabBarHeight } from './no-tab-bar-height';
import { noBorderWidthOnGlass } from './no-border-width-on-glass';
import { expoImageImport } from './expo-image-import';
import { preferLucideIcons } from './prefer-lucide-icons';
import { scrollviewHorizontalFlexgrow } from './scrollview-horizontal-flexgrow';
import { noInlineScriptCode } from './no-inline-script-code';
import { glassNeedsFallback } from './glass-needs-fallback';
import { glassInteractiveProp } from './glass-interactive-prop';
import { headerShownFalse } from './header-shown-false';
import { expoFontLoadedCheck } from './expo-font-loaded-check';
import { noReactQueryMissing } from './no-react-query-missing';
import { browserApiInUseEffect } from './browser-api-in-useeffect';
import { fetchResponseOkCheck } from './fetch-response-ok-check';
import { tabsScreenOptionsHeaderShown } from './tabs-screen-options-header-shown';
import { noResponseJsonLowercase } from './no-response-json-lowercase';
import { nativeTabsBottomPadding } from './native-tabs-bottom-padding';
import { noTailwindAnimationClasses } from './no-tailwind-animation-classes';
import { sqlNoNestedCalls } from './sql-no-nested-calls';
import { glassNoOpacityAnimation } from './glass-no-opacity-animation';
import { noComplexJsxExpressions } from './no-complex-jsx-expressions';
import { textInputKeyboardAvoiding } from './textinput-keyboard-avoiding';
import { transitionWorkletDirective } from './transition-worklet-directive';
import { transitionProgressRange } from './transition-progress-range';
import { transitionGestureScrollview } from './transition-gesture-scrollview';
import { transitionSharedTagMismatch } from './transition-shared-tag-mismatch';
import { transitionPreferBlankStack } from './transition-prefer-blank-stack';
import { preferGuardClauses } from './prefer-guard-clauses';
import { noTypeAssertion } from './no-type-assertion';
import { safeJsonParse } from './safe-json-parse';
import { noLooseEquality } from './no-loose-equality';
import { noMagicEnvStrings } from './no-magic-env-strings';
import { urlParamsMustEncode } from './url-params-must-encode';
import { catchMustLogToSentry } from './catch-must-log-to-sentry';
import { noNestedTryCatch } from './no-nested-try-catch';
import { noInlineStyles } from './no-inline-styles';
import { noStringCoerceError } from './no-string-coerce-error';
import { loggerErrorWithErr } from './logger-error-with-err';
import { noOptionalProps } from './no-optional-props';
import { noSilentSkip } from './no-silent-skip';
import { noManualRetryLoop } from './no-manual-retry-loop';
import { noEmojiIcons } from './no-emoji-icons';
import { noSyncFs } from './no-sync-fs';
import { preferNamedParams } from './prefer-named-params';
import { requireUseClient } from './require-use-client';
import { noServerImportInClient } from './no-server-import-in-client';
import { ssrBrowserApiGuard } from './ssr-browser-api-guard';
import { noReactNativeInWeb } from './no-react-native-in-web';
import { noModuleLevelNew } from './no-module-level-new';
import { noUnrestrictedLoopInServerless } from './no-unrestricted-loop-in-serverless';
import { preferPromiseAll } from './prefer-promise-all';
import { noDeprecatedUrlParse } from './no-deprecated-url-parse';

export const rules: Record<string, RuleFunction> = {
  'no-relative-paths': noRelativePaths,
  'no-require-statements': noRequireStatements,
  'no-stylesheet-create': noStylesheetCreate,
  'no-safeareaview': noSafeAreaView,
  'no-class-components': noClassComponents,
  'no-tab-bar-height': noTabBarHeight,
  'no-border-width-on-glass': noBorderWidthOnGlass,
  'expo-image-import': expoImageImport,
  'prefer-lucide-icons': preferLucideIcons,
  'scrollview-horizontal-flexgrow': scrollviewHorizontalFlexgrow,
  'no-inline-script-code': noInlineScriptCode,
  'glass-needs-fallback': glassNeedsFallback,
  'glass-interactive-prop': glassInteractiveProp,
  'header-shown-false': headerShownFalse,
  'expo-font-loaded-check': expoFontLoadedCheck,
  'no-react-query-missing': noReactQueryMissing,
  'browser-api-in-useeffect': browserApiInUseEffect,
  'fetch-response-ok-check': fetchResponseOkCheck,
  'tabs-screen-options-header-shown': tabsScreenOptionsHeaderShown,
  'no-response-json-lowercase': noResponseJsonLowercase,
  'native-tabs-bottom-padding': nativeTabsBottomPadding,
  'no-tailwind-animation-classes': noTailwindAnimationClasses,
  'sql-no-nested-calls': sqlNoNestedCalls,
  'glass-no-opacity-animation': glassNoOpacityAnimation,
  'no-complex-jsx-expressions': noComplexJsxExpressions,
  'textinput-keyboard-avoiding': textInputKeyboardAvoiding,
  'transition-worklet-directive': transitionWorkletDirective,
  'transition-progress-range': transitionProgressRange,
  'transition-gesture-scrollview': transitionGestureScrollview,
  'transition-shared-tag-mismatch': transitionSharedTagMismatch,
  'transition-prefer-blank-stack': transitionPreferBlankStack,
  'prefer-guard-clauses': preferGuardClauses,
  'no-type-assertion': noTypeAssertion,
  'safe-json-parse': safeJsonParse,
  'no-loose-equality': noLooseEquality,
  'no-magic-env-strings': noMagicEnvStrings,
  'url-params-must-encode': urlParamsMustEncode,
  'catch-must-log-to-sentry': catchMustLogToSentry,
  'no-nested-try-catch': noNestedTryCatch,
  'no-inline-styles': noInlineStyles,
  'no-string-coerce-error': noStringCoerceError,
  'logger-error-with-err': loggerErrorWithErr,
  'no-optional-props': noOptionalProps,
  'no-silent-skip': noSilentSkip,
  'no-manual-retry-loop': noManualRetryLoop,
  'no-emoji-icons': noEmojiIcons,
  'no-sync-fs': noSyncFs,
  'prefer-named-params': preferNamedParams,
  'require-use-client': requireUseClient,
  'no-server-import-in-client': noServerImportInClient,
  'ssr-browser-api-guard': ssrBrowserApiGuard,
  'no-react-native-in-web': noReactNativeInWeb,
  'no-module-level-new': noModuleLevelNew,
  'no-unrestricted-loop-in-serverless': noUnrestrictedLoopInServerless,
  'prefer-promise-all': preferPromiseAll,
  'no-deprecated-url-parse': noDeprecatedUrlParse,
};
