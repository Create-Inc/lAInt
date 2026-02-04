"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rules = void 0;
const no_relative_paths_1 = require("./no-relative-paths");
const no_require_statements_1 = require("./no-require-statements");
const no_stylesheet_create_1 = require("./no-stylesheet-create");
const no_safeareaview_1 = require("./no-safeareaview");
const no_class_components_1 = require("./no-class-components");
const no_tab_bar_height_1 = require("./no-tab-bar-height");
const no_border_width_on_glass_1 = require("./no-border-width-on-glass");
const expo_image_import_1 = require("./expo-image-import");
const prefer_lucide_icons_1 = require("./prefer-lucide-icons");
const scrollview_horizontal_flexgrow_1 = require("./scrollview-horizontal-flexgrow");
const no_inline_script_code_1 = require("./no-inline-script-code");
const glass_needs_fallback_1 = require("./glass-needs-fallback");
const glass_interactive_prop_1 = require("./glass-interactive-prop");
const header_shown_false_1 = require("./header-shown-false");
const expo_font_loaded_check_1 = require("./expo-font-loaded-check");
const no_react_query_missing_1 = require("./no-react-query-missing");
const browser_api_in_useeffect_1 = require("./browser-api-in-useeffect");
const fetch_response_ok_check_1 = require("./fetch-response-ok-check");
const tabs_screen_options_header_shown_1 = require("./tabs-screen-options-header-shown");
const no_response_json_lowercase_1 = require("./no-response-json-lowercase");
const native_tabs_bottom_padding_1 = require("./native-tabs-bottom-padding");
const no_tailwind_animation_classes_1 = require("./no-tailwind-animation-classes");
const sql_no_nested_calls_1 = require("./sql-no-nested-calls");
const glass_no_opacity_animation_1 = require("./glass-no-opacity-animation");
const no_complex_jsx_expressions_1 = require("./no-complex-jsx-expressions");
const textinput_keyboard_avoiding_1 = require("./textinput-keyboard-avoiding");
exports.rules = {
    'no-relative-paths': no_relative_paths_1.noRelativePaths,
    'no-require-statements': no_require_statements_1.noRequireStatements,
    'no-stylesheet-create': no_stylesheet_create_1.noStylesheetCreate,
    'no-safeareaview': no_safeareaview_1.noSafeAreaView,
    'no-class-components': no_class_components_1.noClassComponents,
    'no-tab-bar-height': no_tab_bar_height_1.noTabBarHeight,
    'no-border-width-on-glass': no_border_width_on_glass_1.noBorderWidthOnGlass,
    'expo-image-import': expo_image_import_1.expoImageImport,
    'prefer-lucide-icons': prefer_lucide_icons_1.preferLucideIcons,
    'scrollview-horizontal-flexgrow': scrollview_horizontal_flexgrow_1.scrollviewHorizontalFlexgrow,
    'no-inline-script-code': no_inline_script_code_1.noInlineScriptCode,
    'glass-needs-fallback': glass_needs_fallback_1.glassNeedsFallback,
    'glass-interactive-prop': glass_interactive_prop_1.glassInteractiveProp,
    'header-shown-false': header_shown_false_1.headerShownFalse,
    'expo-font-loaded-check': expo_font_loaded_check_1.expoFontLoadedCheck,
    'no-react-query-missing': no_react_query_missing_1.noReactQueryMissing,
    'browser-api-in-useeffect': browser_api_in_useeffect_1.browserApiInUseEffect,
    'fetch-response-ok-check': fetch_response_ok_check_1.fetchResponseOkCheck,
    'tabs-screen-options-header-shown': tabs_screen_options_header_shown_1.tabsScreenOptionsHeaderShown,
    'no-response-json-lowercase': no_response_json_lowercase_1.noResponseJsonLowercase,
    'native-tabs-bottom-padding': native_tabs_bottom_padding_1.nativeTabsBottomPadding,
    'no-tailwind-animation-classes': no_tailwind_animation_classes_1.noTailwindAnimationClasses,
    'sql-no-nested-calls': sql_no_nested_calls_1.sqlNoNestedCalls,
    'glass-no-opacity-animation': glass_no_opacity_animation_1.glassNoOpacityAnimation,
    'no-complex-jsx-expressions': no_complex_jsx_expressions_1.noComplexJsxExpressions,
    'textinput-keyboard-avoiding': textinput_keyboard_avoiding_1.textInputKeyboardAvoiding,
};
