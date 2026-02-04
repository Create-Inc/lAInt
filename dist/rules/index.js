import { noRelativePaths } from './no-relative-paths.js';
import { noRequireStatements } from './no-require-statements.js';
import { noStylesheetCreate } from './no-stylesheet-create.js';
import { noSafeAreaView } from './no-safeareaview.js';
import { noClassComponents } from './no-class-components.js';
import { noTabBarHeight } from './no-tab-bar-height.js';
import { noBorderWidthOnGlass } from './no-border-width-on-glass.js';
import { expoImageImport } from './expo-image-import.js';
import { preferLucideIcons } from './prefer-lucide-icons.js';
import { scrollviewHorizontalFlexgrow } from './scrollview-horizontal-flexgrow.js';
import { noInlineScriptCode } from './no-inline-script-code.js';
import { glassNeedsFallback } from './glass-needs-fallback.js';
import { glassInteractiveProp } from './glass-interactive-prop.js';
import { headerShownFalse } from './header-shown-false.js';
import { expoFontLoadedCheck } from './expo-font-loaded-check.js';
import { noReactQueryMissing } from './no-react-query-missing.js';
import { browserApiInUseEffect } from './browser-api-in-useeffect.js';
import { fetchResponseOkCheck } from './fetch-response-ok-check.js';
import { tabsScreenOptionsHeaderShown } from './tabs-screen-options-header-shown.js';
import { noResponseJsonLowercase } from './no-response-json-lowercase.js';
import { nativeTabsBottomPadding } from './native-tabs-bottom-padding.js';
import { noTailwindAnimationClasses } from './no-tailwind-animation-classes.js';
import { sqlNoNestedCalls } from './sql-no-nested-calls.js';
import { glassNoOpacityAnimation } from './glass-no-opacity-animation.js';
import { noComplexJsxExpressions } from './no-complex-jsx-expressions.js';
import { textInputKeyboardAvoiding } from './textinput-keyboard-avoiding.js';
export const rules = {
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
};
