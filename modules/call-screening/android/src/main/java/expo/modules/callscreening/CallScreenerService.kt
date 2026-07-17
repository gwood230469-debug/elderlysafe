package expo.modules.callscreening

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.content.pm.PackageManager
import androidx.core.content.ContextCompat
import android.net.Uri
import android.os.Build
import android.provider.ContactsContract
import android.telecom.Call
import android.telecom.CallScreeningService
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

// Registered via this module's own AndroidManifest.xml (manifest-merged
// into the app automatically, see that file's comments) — the OS binds to
// this only when the app holds RoleManager.ROLE_CALL_SCREENING (requested
// from CallScreeningModule.requestCallScreeningRole(), prompted from
// Settings).
class CallScreenerService : CallScreeningService() {
  companion object {
    private const val CHANNEL_ID = "call-risk-alert"
    // Below this, the call isn't worth interrupting anyone about — most
    // calls (known contacts, verified numbers) should produce no
    // notification at all.
    private const val NOTIFY_THRESHOLD = 40
  }

  private val serviceScope = CoroutineScope(Dispatchers.IO)

  override fun onScreenCall(callDetails: Call.Details) {
    val number = callDetails.handle?.schemeSpecificPart ?: ""

    // Always let the call ring normally — this service's job is to warn,
    // never to silently block a real call (a false positive that silences
    // a genuine family member would be far worse than a missed warning).
    val response = CallResponse.Builder()
      .setDisallowCall(false)
      .setRejectCall(false)
      .setSilenceCall(false)
      .setSkipCallLog(false)
      .setSkipNotification(false)
      .build()
    respondToCall(callDetails, response)

    if (number.isEmpty()) return

    val verificationStatus = verificationStatusFor(callDetails)
    val contactMatch = isKnownContact(number)

    // Scoring happens after respondToCall() returns — it's off
    // onScreenCall's own time-boxed critical path, so a slow network call
    // here never delays the call ringing.
    serviceScope.launch {
      val config = CallScreeningPrefs.load(applicationContext) ?: return@launch
      val result = RiskApiClient.score(config, number, verificationStatus, contactMatch)
        ?: RiskHeuristic.score(number, verificationStatus, contactMatch, config.userRegion)

      if (result.riskScore >= NOTIFY_THRESHOLD) {
        showRiskNotification(number, result.riskScore, result.riskReasons)
      }
    }
  }

  private fun verificationStatusFor(callDetails: Call.Details): String {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return "unverified"
    return when (callDetails.callerNumberVerificationStatus) {
      Call.Details.VERIFICATION_STATUS_PASSED -> "passed"
      Call.Details.VERIFICATION_STATUS_FAILED -> "failed"
      else -> "unverified"
    }
  }

  private fun isKnownContact(number: String): Boolean {
    val granted = ContextCompat.checkSelfPermission(this, Manifest.permission.READ_CONTACTS) == PackageManager.PERMISSION_GRANTED
    if (!granted) return false
    return try {
      val uri = Uri.withAppendedPath(ContactsContract.PhoneLookup.CONTENT_FILTER_URI, Uri.encode(number))
      contentResolver.query(uri, arrayOf(ContactsContract.PhoneLookup._ID), null, null, null)?.use { cursor ->
        cursor.moveToFirst()
      } ?: false
    } catch (e: Exception) {
      false
    }
  }

  private fun showRiskNotification(number: String, riskScore: Int, reasons: List<String>) {
    val notificationManager = getSystemService(NotificationManager::class.java)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(CHANNEL_ID, "Call risk alerts", NotificationManager.IMPORTANCE_HIGH).apply {
        description = "Warns when an incoming call looks like a scam."
      }
      notificationManager.createNotificationChannel(channel)
    }

    val deepLinkUrl = buildString {
      append("safeword://incoming-call-risk?callerNumber=")
      append(Uri.encode(number))
      append("&riskScore=")
      append(riskScore)
      append("&reasons=")
      append(Uri.encode(reasons.joinToString("|")))
    }
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(deepLinkUrl)).apply {
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
    }
    val pendingIntentFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    } else {
      PendingIntent.FLAG_UPDATE_CURRENT
    }
    val pendingIntent = PendingIntent.getActivity(this, number.hashCode(), intent, pendingIntentFlags)

    val notification = NotificationCompat.Builder(this, CHANNEL_ID)
      .setSmallIcon(android.R.drawable.ic_dialog_alert)
      .setContentTitle("Possible scam call")
      .setContentText("Scam risk: $riskScore% — $number")
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setCategory(NotificationCompat.CATEGORY_CALL)
      .setFullScreenIntent(pendingIntent, true)
      .setContentIntent(pendingIntent)
      .setAutoCancel(true)
      .build()

    notificationManager.notify(number.hashCode(), notification)
  }
}
