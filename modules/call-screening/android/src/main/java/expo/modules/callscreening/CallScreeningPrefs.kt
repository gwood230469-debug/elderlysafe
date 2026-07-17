package expo.modules.callscreening

import android.content.Context
import android.content.SharedPreferences

// CallScreenerService is invoked directly by the OS (not through the Expo
// Modules JS bridge), so it has no access to the JS bundle's env vars —
// CallScreeningModule.configure() persists what the service needs here once
// at app startup (see App.tsx's configureCallScreening call).
internal object CallScreeningPrefs {
  private const val PREFS_NAME = "call_screening_config"
  private const val KEY_SUPABASE_URL = "supabase_url"
  private const val KEY_SUPABASE_ANON_KEY = "supabase_anon_key"
  private const val KEY_USER_REGION = "user_region"

  private fun prefs(context: Context): SharedPreferences =
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

  fun save(context: Context, supabaseUrl: String, supabaseAnonKey: String, userRegion: String) {
    prefs(context).edit()
      .putString(KEY_SUPABASE_URL, supabaseUrl)
      .putString(KEY_SUPABASE_ANON_KEY, supabaseAnonKey)
      .putString(KEY_USER_REGION, userRegion)
      .apply()
  }

  data class Config(val supabaseUrl: String, val supabaseAnonKey: String, val userRegion: String)

  fun load(context: Context): Config? {
    val p = prefs(context)
    val url = p.getString(KEY_SUPABASE_URL, null)
    val key = p.getString(KEY_SUPABASE_ANON_KEY, null)
    val region = p.getString(KEY_USER_REGION, null) ?: "GB"
    if (url.isNullOrEmpty() || key.isNullOrEmpty()) return null
    return Config(url, key, region)
  }
}
