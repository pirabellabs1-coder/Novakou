// Liste exhaustive des icônes Material Symbols utilisées dans toute l'app.
// Passée à Google Fonts via ?icon_names= pour générer un font subset.
//
// Avant subset : 3.8 MB (font variable complète, 3000+ icônes).
// Après subset : ~70 KB (uniquement les ~350 icônes utilisées).
//
// Pour régénérer la liste : grep des spans `material-symbols-outlined>NOM<`
// dans apps/web + ajouter les icônes utilisées dynamiquement (constantes
// `icon:` dans les arrays). Si une icône utilisée manque ici, elle reste
// invisible (cachée par color:transparent dans layout.tsx).
export const MATERIAL_SYMBOLS_USED = [
  "account_balance", "account_balance_wallet", "account_circle", "account_tree",
  "add", "add_box", "add_business", "add_circle", "add_comment", "add_link",
  "add_photo_alternate", "add_shopping_cart", "admin_panel_settings", "ads_click",
  "all_inclusive", "alt_route", "alternate_email", "analytics", "apps", "archive",
  "arrow_back", "arrow_downward", "arrow_drop_down", "arrow_forward",
  "arrow_outward", "arrow_upward", "article", "assessment", "attach_file",
  "attach_money", "audio_file", "auto_awesome", "auto_fix_high", "autorenew",
  "badge", "balance", "bar_chart", "block", "bolt", "book", "bookmark_remove",
  "broken_image", "brush", "bug_report", "build", "business", "business_center",
  "calendar_add_on", "calendar_month", "calendar_today", "call", "call_end",
  "call_to_action", "cameraswitch", "campaign", "cancel", "card_giftcard",
  "card_membership", "category", "celebration", "chat", "chat_bubble", "check",
  "check_circle", "checklist", "chevron_left", "chevron_right",
  "cleaning_services", "close", "cloud", "cloud_done", "cloud_upload", "code",
  "comment", "compare", "construction", "content_copy", "conversion_path",
  "cookie", "corporate_fare", "credit_card", "credit_card_off",
  "currency_exchange", "dashboard", "dashboard_customize", "data_object",
  "delete", "delete_forever", "delete_outline", "delete_sweep", "description",
  "design_services", "devices", "diamond", "discount", "diversity_3", "domain",
  "done", "done_all", "donut_large", "download", "download_done", "draft", "drafts",
  "drag_indicator", "drag_pan", "edit", "edit_note", "edit_square", "email",
  "emoji_events", "engineering", "error", "error_outline", "event",
  "event_available", "event_busy", "event_repeat", "exit_to_app", "expand_more",
  "explore", "explore_off", "extension", "facebook", "fact_check", "favorite",
  "filter_alt", "flag", "folder", "folder_open", "folder_zip",
  "format_align_center", "format_align_left", "format_align_right",
  "format_bold", "format_color_text", "format_ink_highlighter", "format_italic",
  "format_list_bulleted", "format_list_numbered", "format_paragraph",
  "format_quote", "format_strikethrough", "format_underlined", "forum",
  "g_mobiledata", "gavel", "gpp_bad", "grid_view", "group", "group_add",
  "group_off", "groups", "handshake", "hd", "headphones", "height", "help",
  "help_outline", "high_quality", "history", "home", "horizontal_rule",
  "hourglass_empty", "hourglass_top", "how_to_reg", "hub", "image",
  "image_not_supported", "inbox", "info", "insert_drive_file", "insights",
  "inventory_2", "key", "key_off", "label", "language", "leaderboard",
  "library_add", "lightbulb", "link", "link_off", "list", "list_alt",
  "live_help", "local_atm", "local_fire_department", "local_offer",
  "local_shipping", "lock", "lock_open", "lock_reset", "login", "logout",
  "looks_3", "looks_one", "looks_two", "mail", "mail_outline", "manage_accounts",
  "mark_email_read", "menu", "menu_book", "mic", "military_tech", "money_off",
  "monitoring", "more_vert", "movie", "music_note", "neurology", "notifications",
  "notifications_active", "notifications_off", "ondemand_video", "open_in_new",
  "package_2", "pageview", "palette", "pause", "pause_circle", "payment",
  "payments", "pending_actions", "people", "percent", "perm_media", "person",
  "person_add", "person_off", "person_remove", "person_search", "phone",
  "phone_android", "phone_iphone", "phone_missed", "photo_camera",
  "photo_library", "picture_as_pdf", "play_arrow", "play_circle", "play_lesson",
  "preview", "priority_high", "progress_activity", "psychology", "public",
  "push_pin", "qr_code_2", "quiz", "radio_button_checked",
  "radio_button_unchecked", "rate_review", "receipt_long", "record_voice_over",
  "redeem", "redo", "refresh", "remove_shopping_cart", "repeat", "replay",
  "replay_30", "reply", "restart_alt", "reviews", "rocket_launch", "route",
  "save", "savings", "schedule", "school", "science", "search", "search_off",
  "security", "sell", "send", "send_money", "settings", "share", "shield", "shield_lock",
  "shield_remove", "shopping_bag", "shopping_cart", "shopping_cart_checkout",
  "shopping_cart_off", "show_chart", "skip_next", "slideshow", "smart_button",
  "smart_display", "smart_toy", "smartphone", "sort", "speed", "star",
  "star_rate", "storage", "store", "storefront", "subtitles", "summarize",
  "support_agent", "swap_horiz", "swap_vert", "switch_account", "table_chart",
  "table_rows", "task_alt", "thumb_down", "thumb_up", "timeline", "timer",
  "timer_off", "tips_and_updates", "title", "toggle_on", "touch_app",
  "translate", "trending_down", "trending_flat", "trending_up", "tune", "undo",
  "update", "upload", "upload_file", "verified", "verified_user",
  "vertical_align_bottom", "video_call", "video_camera_front", "video_file",
  "video_library", "videocam", "videocam_off", "view_carousel", "view_column", "view_column_2",
  "visibility", "visibility_off", "volume_up", "volunteer_activism", "warning",
  "waves", "webhook", "whatshot", "widgets", "workflow", "workspace_premium",
] as const;

const ICONS_PARAM = MATERIAL_SYMBOLS_USED.join(",");

/**
 * URL Google Fonts pour Material Symbols Outlined, subset aux icônes utilisées.
 * display=block évite le FOUT (cf. layout.tsx).
 *
 * Axes : seul FILL (0..1) est réellement utilisé dans le code
 * (fontVariationSettings "'FILL' 1" pour les icônes actives). wght/opsz/GRAD
 * sont figés à leur valeur par défaut (400/24/0) → police BEAUCOUP plus
 * légère (348 Ko → ~120 Ko) et chargement icônes quasi instantané.
 */
export const MATERIAL_SYMBOLS_URL =
  `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:FILL@0..1&icon_names=${ICONS_PARAM}&display=block`;
