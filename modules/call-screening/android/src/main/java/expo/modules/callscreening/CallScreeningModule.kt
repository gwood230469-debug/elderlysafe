package expo.modules.callscreening

import android.app.Activity
import android.app.role.RoleManager
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise

// NOTE for whoever verifies this against a real device/emulator build: the
// OnActivityResult(...) component below is the one piece of this file with
// genuine version-shape uncertainty in the Expo Modules Kotlin API — it
// hasn't been compiled here (no Android toolchain in this environment).
// Cross-check it against a working example in the installed
// expo-modules-core version (e.g. expo-image-picker's or
// expo-google-signin's own Kotlin module) before shipping, per this repo's
// convention of verifying against exact-versioned docs rather than
// assuming API shape.
class CallScreeningModule : Module() {
  private var pendingRolePromise: Promise? = null

  override fun definition() = ModuleDefinition {
    Name("CallScreening")

    Events("onCallRiskScored")

    AsyncFunction("requestCallScreeningRole") { promise: Promise ->
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
        promise.resolve("unsupported")
        return@AsyncFunction
      }
      val activity = appContext.currentActivity
      val roleManager = activity?.getSystemService(RoleManager::class.java)
      if (activity == null || roleManager == null || !roleManager.isRoleAvailable(RoleManager.ROLE_CALL_SCREENING)) {
        promise.resolve("unsupported")
        return@AsyncFunction
      }
      if (roleManager.isRoleHeld(RoleManager.ROLE_CALL_SCREENING)) {
        promise.resolve("granted")
        return@AsyncFunction
      }
      pendingRolePromise = promise
      val intent = roleManager.createRequestRoleIntent(RoleManager.ROLE_CALL_SCREENING)
      activity.startActivityForResult(intent, REQUEST_CODE_CALL_SCREENING_ROLE)
    }

    AsyncFunction("getCallScreeningRoleStatus") { promise: Promise ->
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
        promise.resolve("unsupported")
        return@AsyncFunction
      }
      val roleManager = appContext.reactContext?.getSystemService(RoleManager::class.java)
      if (roleManager == null || !roleManager.isRoleAvailable(RoleManager.ROLE_CALL_SCREENING)) {
        promise.resolve("unsupported")
        return@AsyncFunction
      }
      promise.resolve(if (roleManager.isRoleHeld(RoleManager.ROLE_CALL_SCREENING)) "granted" else "denied")
    }

    AsyncFunction("configure") { config: Map<String, Any?>, promise: Promise ->
      val context = appContext.reactContext
      if (context == null) {
        promise.resolve(null)
        return@AsyncFunction
      }
      val supabaseUrl = config["supabaseUrl"] as? String ?: ""
      val supabaseAnonKey = config["supabaseAnonKey"] as? String ?: ""
      val userRegion = config["userRegion"] as? String ?: "GB"
      CallScreeningPrefs.save(context, supabaseUrl, supabaseAnonKey, userRegion)
      promise.resolve(null)
    }

    OnActivityResult { _, payload ->
      if (payload.requestCode != REQUEST_CODE_CALL_SCREENING_ROLE) return@OnActivityResult
      val promise = pendingRolePromise ?: return@OnActivityResult
      pendingRolePromise = null
      promise.resolve(if (payload.resultCode == Activity.RESULT_OK) "granted" else "denied")
    }
  }

  companion object {
    private const val REQUEST_CODE_CALL_SCREENING_ROLE = 4177
  }
}
